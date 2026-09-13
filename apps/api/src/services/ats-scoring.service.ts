import type { ResumeDocument } from '../models/resume.model.js';
export const SCORE_VERSION = 'ats-v1';
type Item = Record<string, unknown>;
export type ATSIssue = {
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
};
export type ATSResult = {
  overallScore: number;
  scoreVersion: string;
  categories: Array<{
    key: string;
    label: string;
    score: number;
    maxScore: number;
    percentage: number;
    findings: string[];
  }>;
  strengths: string[];
  issues: ATSIssue[];
  recommendations: Array<{ category: string; action: string; priority: string }>;
  matchedKeywords: string[];
  missingKeywords: string[];
  weakVerbs: string[];
  overusedWords: string[];
  grammarObservations: string[];
  formattingObservations: string[];
};
const weak = ['helped', 'worked', 'responsible', 'assisted', 'handled', 'did', 'made'];
const aliases: Record<string, string[]> = {
  javascript: ['javascript', 'js'],
  typescript: ['typescript', 'ts'],
  react: ['react', 'reactjs', 'react.js'],
  node: ['node', 'nodejs', 'node.js'],
  'c sharp': ['c#', 'csharp', 'c sharp'],
  'amazon web services': ['aws', 'amazon web services'],
};
const stop = new Set(
  'the a an and or to of in for with on at by from as is are be this that you your our will role work'.split(
    ' ',
  ),
);
export const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9+#. ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
export function concepts(text: string) {
  const n = normalize(text);
  const found = new Set<string>();
  for (const [canonical, forms] of Object.entries(aliases))
    if (forms.some((f) => new RegExp(`(^|\\s)${f.replace('.', '\\.')}($|\\s)`).test(n)))
      found.add(canonical);
  for (const w of n.split(' ')) if (w.length > 2 && !stop.has(w)) found.add(w.replace(/\.$/, ''));
  return [...found];
}
export function keywordMatch(resumeText: string, jobText = '') {
  if (!jobText.trim()) return { matched: [] as string[], missing: [] as string[], percentage: 100 };
  const r = new Set(concepts(resumeText));
  const job = concepts(jobText).slice(0, 80);
  const matched = job.filter((x) => r.has(x));
  return {
    matched,
    missing: job.filter((x) => !r.has(x)),
    percentage: job.length ? Math.round((matched.length / job.length) * 100) : 100,
  };
}
export const hasMeasurement = (s: string) =>
  /(?:\b\d+(?:\.\d+)?\s?(?:%|x|k|m|ms|hours?|days?|users?|projects?|people|members?|clients?)(?:\s|$)|[$€£]\s?\d+)/i.test(
    s,
  );
const textOf = (r: Record<string, unknown>) => JSON.stringify(r).replace(/[{}[\]"_:,]/g, ' ');
export function scoreResume(
  resume: ResumeDocument | Record<string, unknown>,
  jobDescription = '',
): ATSResult {
  const r = resume as unknown as Record<string, unknown>,
    p = (r.personalDetails ?? {}) as Item,
    exp = (r.workExperience ?? []) as Item[],
    skills = (r.skills ?? []) as Item[],
    edu = (r.education ?? []) as Item[],
    cert = (r.certifications ?? []) as Item[];
  const summary = String(r.professionalSummary ?? '').trim(),
    bullets = exp.flatMap((x) => (x.achievements as string[]) ?? []).filter(Boolean),
    all = textOf(r),
    km = keywordMatch(all, jobDescription);
  const categories: ATSResult['categories'] = [];
  const issues: ATSIssue[] = [];
  const strengths: string[] = [];
  const add = (key: string, label: string, maxScore: number, score: number, findings: string[]) =>
    categories.push({
      key,
      label,
      maxScore,
      score: Math.max(0, Math.min(maxScore, Math.round(score))),
      percentage: Math.round((Math.max(0, Math.min(maxScore, score)) / maxScore) * 100),
      findings,
    });
  let contact = 0;
  for (const k of ['firstName', 'lastName', 'email', 'phone', 'city', 'country'])
    if (p[k]) contact += 0.65;
  if (p.linkedIn) contact += 0.6;
  if (p.portfolio || p.github) contact += 0.5;
  add('contact', 'Contact information', 5, contact, [
    contact >= 4
      ? 'Core contact details are complete.'
      : 'Add missing professional contact details.',
  ]);
  const sumScore = !summary
    ? 0
    : Math.min(
        10,
        4 +
          (summary.length >= 80 && summary.length <= 600 ? 3 : 1) +
          (r.targetRole && normalize(summary).includes(normalize(String(r.targetRole))) ? 2 : 0) +
          (summary.split(' ').length >= 20 ? 1 : 0),
      );
  add('summary', 'Professional summary', 10, sumScore, [
    summary ? 'Summary is present.' : 'Professional summary is missing.',
  ]);
  const complete = exp.filter((x) => x.jobTitle && x.company && x.startDate).length;
  const action = bullets.filter((b) => !weak.some((w) => normalize(b).startsWith(w))).length;
  add(
    'experience',
    'Work experience quality',
    20,
    exp.length
      ? 8 + (6 * complete) / exp.length + 6 * (bullets.length ? action / bullets.length : 0)
      : 0,
    [
      `${complete}/${exp.length} roles have core details.`,
      `${action}/${bullets.length} bullets begin with stronger language.`,
    ],
  );
  const measured = bullets.filter(hasMeasurement).length;
  add(
    'achievements',
    'Measurable achievements',
    10,
    bullets.length ? (10 * measured) / bullets.length : 0,
    [`${measured} achievement bullet(s) include meaningful scale or outcomes.`],
  );
  const unique = new Set(skills.map((x) => normalize(String(x.name ?? ''))).filter(Boolean));
  add(
    'skills',
    'Skills relevance',
    10,
    Math.min(10, unique.size * 1.2) * (jobDescription ? 0.5 + (0.5 * km.percentage) / 100 : 1),
    [
      `${unique.size} unique skill(s) listed.`,
      jobDescription
        ? `${km.percentage}% keyword coverage.`
        : 'No job description supplied; skills are scored for breadth.',
    ],
  );
  add('keywords', 'Job-description keyword match', 20, jobDescription ? km.percentage / 5 : 14, [
    jobDescription
      ? `${km.matched.length} matched and ${km.missing.length} missing terms.`
      : 'Fair fallback applied: 14/20; provide a job description for tailored scoring.',
  ]);
  add(
    'education',
    'Education and certifications',
    5,
    Math.min(5, (edu.length ? 3 : 0) + (cert.length ? 2 : 0)),
    [
      edu.length ? 'Education is present.' : 'Education is missing.',
      cert.length ? 'Certifications are present.' : 'No certifications listed.',
    ],
  );
  const st = (r.styling ?? {}) as Item;
  let format = 10;
  if (Number(st.fontSize ?? 10) < 9) format -= 3;
  if (Number(st.pageMargin ?? 18) < 10) format -= 2;
  if (st.layout === 'two-column') format -= 1;
  if (st.showProfileImage) format -= 1;
  add('formatting', 'ATS-readable formatting', 10, format, [
    format === 10
      ? 'Formatting uses ATS-friendly defaults.'
      : 'Some layout settings may reduce parsing reliability.',
  ]);
  const weakFound = weak.filter((w) => new RegExp(`\\b${w}\\b`, 'i').test(all));
  const pronouns = (all.match(/\b(I|me|my|we|our)\b/gi) || []).length;
  add(
    'writing',
    'Grammar and writing quality',
    5,
    5 - Math.min(3, weakFound.length * 0.5) - Math.min(2, pronouns * 0.25),
    [
      weakFound.length ? `Weak verbs: ${weakFound.join(', ')}.` : 'No common weak verbs detected.',
      pronouns
        ? `${pronouns} first-person pronoun(s) detected.`
        : 'No first-person pronouns detected.',
    ],
  );
  const sectionCount = [
    exp.length,
    edu.length,
    skills.length,
    ((r.projects as unknown[]) ?? []).length,
    cert.length,
    summary ? 1 : 0,
  ].filter(Boolean).length;
  add('sections', 'Section completeness', 5, Math.min(5, sectionCount), [
    `${sectionCount}/6 core sections contain content.`,
  ]);
  for (const c of categories) {
    if (c.percentage >= 80) strengths.push(`${c.label} is strong.`);
    else
      issues.push({
        category: c.key,
        severity: c.percentage < 40 ? 'high' : c.percentage < 70 ? 'medium' : 'low',
        message: c.findings[c.findings.length - 1] ?? `${c.label} can be improved.`,
      });
  }
  const recommendations = issues.map((x) => ({
    category: x.category,
    action: x.message,
    priority: x.severity,
  }));
  const overused = [
    ...new Set(
      normalize(all)
        .split(' ')
        .filter((w, _, a) => w.length > 4 && a.filter((v) => v === w).length > 5),
    ),
  ].slice(0, 10);
  return {
    overallScore: categories.reduce((n, c) => n + c.score, 0),
    scoreVersion: SCORE_VERSION,
    categories,
    strengths,
    issues,
    recommendations,
    matchedKeywords: km.matched,
    missingKeywords: km.missing.slice(0, 30),
    weakVerbs: weakFound,
    overusedWords: overused,
    grammarObservations: pronouns ? ['Avoid first-person pronouns in resume bullets.'] : [],
    formattingObservations: categories.find((c) => c.key === 'formatting')!.findings,
  };
}
