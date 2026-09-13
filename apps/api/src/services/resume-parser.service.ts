import { randomUUID } from 'node:crypto';
import { HttpError } from '../utilities/http-error.js';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type ParsedFileMetadata = { extension: 'pdf' | 'docx'; mime: string; size: number };
export type SecureFileReference = { buffer: Buffer; metadata: ParsedFileMetadata };
export interface ResumeParser {
  supports(file: ParsedFileMetadata): boolean;
  extract(file: SecureFileReference): Promise<string>;
  parse(
    text: string,
  ): Promise<{ data: Record<string, unknown>; confidence: Record<string, ConfidenceLevel> }>;
}
const email = /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/;
const phone = /(?:\+?\d[\d ()-]{7,}\d)/;
function deterministic(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  const mail = text.match(email)?.[0] ?? '';
  const tel = text.match(phone)?.[0] ?? '';
  const name = (lines[0] ?? 'Imported Resume').split(/\s+/);
  const section = (label: string) => {
    const i = lines.findIndex((x) => x.toLowerCase() === label);
    return i < 0 ? '' : lines.slice(i + 1, i + 5).join('\n');
  };
  return {
    data: {
      title: `${name.join(' ')} Resume`,
      templateId: 'modern-classic',
      personalDetails: {
        firstName: name[0] ?? '',
        lastName: name.slice(1).join(' '),
        email: mail,
        phone: tel,
      },
      professionalSummary: section('summary'),
      workExperience: [],
      education: [],
      skills: section('skills')
        .split(/[,•|]/)
        .map((x) => x.trim())
        .filter(Boolean)
        .map((x, i) => ({ id: randomUUID(), name: x, visible: true, order: i })),
      projects: [],
      certifications: [],
      languages: [],
      achievements: [],
      volunteerExperience: [],
      customSections: [
        {
          id: randomUUID(),
          title: 'Unmapped Content',
          type: 'text',
          content: text.slice(0, 5000),
          visible: true,
          order: 0,
        },
      ],
    },
    confidence: {
      'personalDetails.firstName': lines[0] ? 'medium' : 'low',
      'personalDetails.email': mail ? 'high' : 'low',
      'personalDetails.phone': tel ? 'high' : 'low',
      professionalSummary: section('summary') ? 'medium' : 'low',
    },
  };
}
export async function extractAndParse(file: SecureFileReference) {
  let text = '';
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new HttpError(408, 'IMPORT_TIMEOUT', 'Document parsing timed out.')),
      15000,
    ),
  );
  const work = async () => {
    if (file.metadata.extension === 'docx') {
      const mammoth = (await import('mammoth')).default;
      text = (await mammoth.extractRawText({ buffer: file.buffer })).value;
    } else {
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: new Uint8Array(file.buffer) });
      try {
        text = (await parser.getText()).text;
      } finally {
        await parser.destroy();
      }
    }
  };
  await Promise.race([work(), timeout]);
  text = text.trim();
  if (!text)
    throw new HttpError(
      422,
      'SCANNED_OR_EMPTY',
      'No selectable text was found. Scanned documents require manual entry.',
    );
  return { text, ...deterministic(text) };
}
