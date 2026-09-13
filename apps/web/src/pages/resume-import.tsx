import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@resumind/ui';
import {
  useConfirmImportMutation,
  useCreateImportMutation,
  useLazyImportStatusQuery,
  useUpdateImportMutation,
  type ResumeImport as ImportType,
} from '../app/api';
import { RepeatableSection } from '../features/resume/repeatable-section';
const reviewSections = [
  'workExperience',
  'education',
  'skills',
  'projects',
  'certifications',
  'languages',
  'achievements',
  'volunteerExperience',
  'customSections',
] as const;
export function ResumeImport() {
  const navigate = useNavigate();
  const [create, { isLoading }] = useCreateImportMutation();
  const [update] = useUpdateImportMutation();
  const [getImportStatus] = useLazyImportStatusQuery();
  const [confirm, { isLoading: confirming }] = useConfirmImportMutation();
  const [item, setItem] = useState<ImportType>();
  const [error, setError] = useState('');
  const upload = async (file?: File) => {
    if (!file) return;
    setError('');
    const form = new FormData();
    form.append('file', file);
    try {
      const job = (await create(form).unwrap()).data;
      setItem(job);
      for (
        let attempt = 0;
        attempt < 90 && ['queued', 'processing'].includes(job.status);
        attempt += 1
      ) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const current = (await getImportStatus(job._id, false).unwrap()).data;
        setItem(current);
        if (current.status === 'review_required') break;
        if (current.status === 'failed')
          throw new Error(current.safeErrorMessage ?? 'The document could not be imported.');
      }
    } catch (e) {
      setError(
        (e as { data?: { error?: { message?: string } } }).data?.error?.message ??
          'The document could not be imported.',
      );
    }
  };
  const patchPersonal = (key: string, value: string) =>
    setItem((x) =>
      x
        ? {
            ...x,
            parsedData: {
              ...x.parsedData,
              personalDetails: { ...x.parsedData.personalDetails, [key]: value },
            },
          }
        : x,
    );
  const patchSection = (
    section: (typeof reviewSections)[number],
    values: Record<string, unknown>[],
  ) => setItem((x) => (x ? { ...x, parsedData: { ...x.parsedData, [section]: values } } : x));
  const done = async () => {
    if (!item) return;
    await update({ id: item._id, parsedData: item.parsedData }).unwrap();
    const r = await confirm(item._id).unwrap();
    navigate(`/dashboard/resumes/${r.data.resume._id}/edit`);
  };
  return (
    <main className="min-h-screen bg-slate-50 p-5 sm:p-10">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-black">Import an existing resume</h1>
        <p className="mt-2 text-slate-600">
          Upload a selectable-text PDF or DOCX. Nothing is created until you review and confirm.
        </p>
        {!item ? (
          <label className="mt-8 grid min-h-80 cursor-pointer place-items-center rounded-3xl border-2 border-dashed border-indigo-200 bg-white p-8 text-center">
            <div>
              <UploadCloud className="mx-auto text-indigo-600" size={48} />
              <h2 className="mt-4 text-xl font-bold">Drop a PDF or DOCX here</h2>
              <p className="mt-2 text-sm text-slate-500">
                Maximum 5 MB. Scanned PDFs are not supported.
              </p>
              <input
                className="sr-only"
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => void upload(e.target.files?.[0])}
              />
              <span className="mt-5 inline-block rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white">
                {isLoading ? 'Processing…' : 'Choose file'}
              </span>
            </div>
          </label>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="rounded-3xl bg-slate-900 p-6 text-slate-100">
              <h2 className="font-bold">Original extracted content</h2>
              <pre className="mt-4 max-h-[70vh] whitespace-pre-wrap overflow-auto text-sm">
                {item.extractedText}
              </pre>
            </section>
            <section className="rounded-3xl border bg-white p-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-emerald-600" />
                <h2 className="text-xl font-black">Review parsed data</h2>
              </div>
              {Object.entries(item.confidence).some(([, v]) => v === 'low') && (
                <p className="mt-4 flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                  <AlertTriangle size={18} />
                  Low-confidence fields need review.
                </p>
              )}
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field
                  label="First name"
                  value={item.parsedData.personalDetails?.firstName ?? ''}
                  confidence={item.confidence['personalDetails.firstName']}
                  onChange={(v) => patchPersonal('firstName', v)}
                />
                <Field
                  label="Last name"
                  value={item.parsedData.personalDetails?.lastName ?? ''}
                  onChange={(v) => patchPersonal('lastName', v)}
                />
                <Field
                  label="Email"
                  value={item.parsedData.personalDetails?.email ?? ''}
                  confidence={item.confidence['personalDetails.email']}
                  onChange={(v) => patchPersonal('email', v)}
                />
                <Field
                  label="Phone"
                  value={item.parsedData.personalDetails?.phone ?? ''}
                  confidence={item.confidence['personalDetails.phone']}
                  onChange={(v) => patchPersonal('phone', v)}
                />
                {(
                  [
                    'professionalTitle',
                    'city',
                    'state',
                    'country',
                    'postalCode',
                    'address',
                    'linkedIn',
                    'github',
                    'portfolio',
                    'website',
                  ] as const
                ).map((key) => (
                  <Field
                    key={key}
                    label={key.replace(/([A-Z])/g, ' $1')}
                    value={String(item.parsedData.personalDetails?.[key] ?? '')}
                    confidence={item.confidence[`personalDetails.${key}`]}
                    onChange={(v) => patchPersonal(key, v)}
                  />
                ))}
              </div>
              <label className="mt-4 block text-sm font-bold">
                Professional summary
                <textarea
                  className="input mt-1 min-h-28 w-full"
                  value={item.parsedData.professionalSummary ?? ''}
                  onChange={(e) =>
                    setItem({
                      ...item,
                      parsedData: { ...item.parsedData, professionalSummary: e.target.value },
                    })
                  }
                />
              </label>
              <div className="mt-6 space-y-7">
                {reviewSections.map((section) => (
                  <section key={section} aria-labelledby={`import-${section}`}>
                    <h3 id={`import-${section}`} className="mb-3 text-lg font-black capitalize">
                      {section.replace(/([A-Z])/g, ' $1')}
                    </h3>
                    <p className="mb-3 text-xs text-slate-500">
                      Use Visibility to accept or reject an entry. Drag or use Move Up/Down to
                      reorder.
                    </p>
                    <RepeatableSection
                      section={section}
                      items={
                        (item.parsedData[section] ?? []) as unknown as (Record<string, unknown> & {
                          id: string;
                          visible: boolean;
                          order: number;
                        })[]
                      }
                      onChange={(values) => patchSection(section, values)}
                    />
                  </section>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={() => void done()} disabled={confirming}>
                  Confirm and Create Resume
                </Button>
                <Button variant="secondary" onClick={() => navigate('/dashboard/resumes')}>
                  Cancel Import
                </Button>
              </div>
            </section>
          </div>
        )}
        {error && (
          <p role="alert" className="mt-4 text-rose-600">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
function Field({
  label,
  value,
  onChange,
  confidence,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  confidence?: string;
}) {
  return (
    <label className="text-sm font-bold">
      {label}
      {confidence && (
        <span
          className={`ml-2 rounded-full px-2 py-0.5 text-xs ${confidence === 'high' ? 'bg-emerald-50 text-emerald-700' : confidence === 'low' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}
        >
          {confidence}
        </span>
      )}
      <input
        className="input mt-1 w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
