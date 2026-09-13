import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Minus, Plus } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@resumind/ui';
import type { Resume } from '@resumind/shared';
import { useAutosaveResumeMutation, useResumeQuery } from '../app/api';
import { ResumeDocument, templates } from '../features/resume/templates';
import { RepeatableSection } from '../features/resume/repeatable-section';
import { SectionOrder } from '../features/resume/section-order';
const steps = [
  'personalDetails',
  'professionalSummary',
  'workExperience',
  'education',
  'skills',
  'projects',
  'certifications',
  'languages',
  'achievements',
  'volunteerExperience',
  'customSections',
  'styling',
  'preview',
] as const;
const labels: Record<string, string> = {
  personalDetails: 'Personal Details',
  professionalSummary: 'Professional Summary',
  workExperience: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  languages: 'Languages',
  achievements: 'Achievements',
  volunteerExperience: 'Volunteer Experience',
  customSections: 'Custom Sections',
  styling: 'Template & Styling',
  preview: 'Preview',
};
export function ResumeEditor() {
  const { resumeId: id = '' } = useParams();
  const { data, isLoading, isError } = useResumeQuery(id);
  const [save] = useAutosaveResumeMutation();
  const [resume, setResume] = useState<Resume | null>(null);
  const [step, setStep] = useState<string>('personalDetails');
  const [status, setStatus] = useState('Saved');
  const [dirty, setDirty] = useState(false);
  const [zoom, setZoom] = useState(0.68);
  const [mobilePreview, setMobilePreview] = useState(false);
  const previewButton = useRef<HTMLButtonElement>(null);
  const previewDialog = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const saving = useRef(Promise.resolve());
  const pendingChanges = useRef<Partial<Resume>>({});
  const editVersion = useRef(0);
  useEffect(() => {
    if (data?.data && !resume) {
      setResume({
        ...data.data,
        personalDetails: data.data.personalDetails ?? { firstName: '', lastName: '', email: '' },
        styling: data.data.styling ?? {
          pageSize: 'A4',
          layout: 'single-column',
          fontFamily: 'Inter',
          fontSize: 10,
          lineHeight: 1.45,
          sectionSpacing: 14,
          primaryColor: '#4f46e5',
          textColor: '#0f172a',
          pageMargin: 18,
          showProfileImage: false,
          secondaryColor: '#e0e7ff',
          headingColor: '#0f172a',
          headingSize: 14,
          showIcons: true,
          dateFormat: 'MMM YYYY',
          sectionTitleStyle: 'underline',
        },
        workExperience: data.data.workExperience ?? [],
        education: data.data.education ?? [],
        skills: data.data.skills ?? [],
        projects: data.data.projects ?? [],
        certifications: data.data.certifications ?? [],
        languages: data.data.languages ?? [],
        achievements: data.data.achievements ?? [],
        volunteerExperience: data.data.volunteerExperience ?? [],
        customSections: data.data.customSections ?? [],
        sectionOrder: data.data.sectionOrder ?? [],
      });
    }
  }, [data, resume]);
  useEffect(() => {
    if (!resume || !data || !dirty) return;
    setStatus('Unsaved changes');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setStatus('Saving…');
      const changes = pendingChanges.current;
      pendingChanges.current = {};
      const version = editVersion.current;
      saving.current = saving.current
        .then(() => save({ id, changes }).unwrap())
        .then(() => {
          if (editVersion.current === version) {
            setDirty(false);
            setStatus('Saved');
          }
        })
        .catch(() => {
          pendingChanges.current = { ...changes, ...pendingChanges.current };
          setStatus('Save failed — retry');
        });
    }, 1400);
    return () => clearTimeout(timer.current);
  }, [resume, id, save, data, dirty]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (status !== 'Saved') {
        e.preventDefault();
      }
    };
    addEventListener('beforeunload', warn);
    return () => removeEventListener('beforeunload', warn);
  }, [status]);
  useEffect(() => {
    if (!mobilePreview) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const dialog = previewDialog.current;
    const trigger = previewButton.current;
    const focusable = () => [
      ...(dialog?.querySelectorAll<HTMLElement>(
        'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',
      ) ?? []),
    ];
    focusable()[0]?.focus();
    const manageFocus = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobilePreview(false);
      if (event.key !== 'Tab') return;
      const nodes = focusable();
      if (!nodes.length) return;
      const first = nodes[0]!,
        last = nodes[nodes.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', manageFocus);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', manageFocus);
      trigger?.focus();
    };
  }, [mobilePreview]);
  if (isLoading) return <div className="p-10">Loading editor…</div>;
  if (isError || !resume)
    return (
      <div className="p-10">
        Resume could not be loaded. <Link to="/dashboard">Return</Link>
      </div>
    );
  const patch = (x: Partial<Resume>) => {
    editVersion.current += 1;
    pendingChanges.current = { ...pendingChanges.current, ...x };
    setDirty(true);
    setResume((r) => (r ? { ...r, ...x } : r));
  };
  const retry = () => {
    editVersion.current += 1;
    setDirty(true);
    setResume((current) => (current ? { ...current } : current));
  };
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <header className="flex h-16 items-center gap-4 border-b bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
        <Link to="/dashboard" aria-label="Back to dashboard">
          <ArrowLeft />
        </Link>
        <input
          className="min-w-0 flex-1 bg-transparent text-lg font-bold outline-none"
          value={resume.title}
          onChange={(e) => patch({ title: e.target.value })}
        />
        <span role="status" className="text-xs text-slate-500">
          {status}
        </span>
        {status.startsWith('Save failed') && (
          <button onClick={retry} className="text-sm font-bold text-rose-600">
            Retry
          </button>
        )}
        <button
          ref={previewButton}
          onClick={() => setMobilePreview(true)}
          className="text-sm font-bold xl:hidden"
        >
          Preview
        </button>
        <Link
          to={`/dashboard/resumes/${id}/templates`}
          className="hidden text-sm font-bold text-indigo-600 sm:block"
        >
          Templates
        </Link>
        <Link
          to={`/dashboard/resumes/${id}/history`}
          className="hidden text-sm font-bold text-indigo-600 sm:block"
        >
          Download & History
        </Link>
        <select
          className="input max-w-36"
          value={resume.templateId}
          onChange={(e) => patch({ templateId: e.target.value as Resume['templateId'] })}
        >
          {templates.map(([id, n]) => (
            <option value={id} key={id}>
              {n}
            </option>
          ))}
        </select>
      </header>
      <div className="grid lg:grid-cols-[220px_minmax(360px,560px)_1fr]">
        <aside className="hidden h-[calc(100vh-4rem)] overflow-y-auto border-r bg-white p-3 lg:block dark:border-slate-800 dark:bg-slate-900">
          <div className="m-2 mb-4">
            <b>{resume.completionPercentage}% complete</b>
            <div className="mt-2 h-2 rounded bg-slate-200">
              <div
                className="h-full rounded bg-indigo-600"
                style={{ width: `${resume.completionPercentage}%` }}
              />
            </div>
          </div>
          {steps.map((s) => (
            <button
              key={s}
              onClick={() => setStep(s)}
              className={`mb-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm ${step === s ? 'bg-indigo-50 font-bold text-indigo-700 dark:bg-indigo-950' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <Check size={14} />
              {labels[s]}
            </button>
          ))}
        </aside>
        <main className="min-h-[calc(100vh-4rem)] bg-white p-5 sm:p-8 dark:bg-slate-900">
          <select
            className="input mb-6 lg:hidden"
            value={step}
            onChange={(e) => setStep(e.target.value)}
          >
            {steps.map((s) => (
              <option key={s} value={s}>
                {labels[s]}
              </option>
            ))}
          </select>
          <h1 className="text-2xl font-black">{labels[step]}</h1>
          <p className="mb-7 mt-1 text-sm text-slate-500">
            Changes save automatically after you pause typing.
          </p>
          <EditorSection step={step} resume={resume} patch={patch} />
        </main>
        <aside className="hidden h-[calc(100vh-4rem)] overflow-auto bg-slate-200 p-6 xl:block dark:bg-slate-800">
          <div className="sticky top-0 mb-4 flex justify-end gap-2">
            <button onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}>
              <Minus />
            </button>
            <button onClick={() => setZoom(0.68)}>Fit</button>
            <button onClick={() => setZoom((z) => Math.min(1.2, z + 0.1))}>
              <Plus />
            </button>
          </div>
          <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
            <ResumeDocument resume={resume} />
          </div>
        </aside>
      </div>
      {mobilePreview && (
        <div
          ref={previewDialog}
          role="dialog"
          aria-modal="true"
          aria-label="Resume preview"
          className="fixed inset-0 z-[100] overflow-auto bg-slate-900 p-3"
        >
          <div className="sticky top-0 z-10 mb-3 flex justify-end">
            <Button onClick={() => setMobilePreview(false)}>Close preview</Button>
          </div>
          <div className="origin-top scale-[.42] sm:scale-[.7]">
            <ResumeDocument resume={resume} />
          </div>
        </div>
      )}
    </div>
  );
}
function EditorSection({
  step,
  resume,
  patch,
}: {
  step: string;
  resume: Resume;
  patch: (x: Partial<Resume>) => void;
}) {
  if (step === 'personalDetails') {
    const p = resume.personalDetails;
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          ['firstName', 'First name'],
          ['lastName', 'Last name'],
          ['professionalTitle', 'Professional title'],
          ['email', 'Email'],
          ['phone', 'Phone'],
          ['country', 'Country'],
          ['state', 'State'],
          ['city', 'City'],
          ['postalCode', 'Postal code'],
          ['address', 'Address'],
          ['linkedIn', 'LinkedIn'],
          ['github', 'GitHub'],
          ['portfolio', 'Portfolio'],
          ['website', 'Website'],
          ['profileImage', 'Profile image URL'],
        ].map(([k, l]) => (
          <label className="text-sm font-bold" key={k}>
            {l}
            <input
              className="input mt-2"
              value={(p as Record<string, string>)[k!] ?? ''}
              onChange={(e) => patch({ personalDetails: { ...p, [k!]: e.target.value } })}
            />
          </label>
        ))}
      </div>
    );
  }
  if (step === 'professionalSummary')
    return (
      <label className="text-sm font-bold">
        Summary
        <textarea
          className="input mt-2 min-h-48"
          maxLength={2000}
          value={resume.professionalSummary ?? ''}
          onChange={(e) => patch({ professionalSummary: e.target.value })}
        />
        <span className="mt-2 block text-xs text-slate-500">
          {resume.professionalSummary?.length ?? 0}/2000 · Aim for 300–600 characters.
        </span>
      </label>
    );
  if (step === 'styling')
    return (
      <div className="space-y-5">
        <label>
          Template
          <select
            className="input mt-2"
            value={resume.templateId}
            onChange={(e) => patch({ templateId: e.target.value as Resume['templateId'] })}
          >
            {templates.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label>
          Primary color
          <input
            type="color"
            className="ml-3"
            value={resume.styling.primaryColor}
            onChange={(e) =>
              patch({ styling: { ...resume.styling, primaryColor: e.target.value } })
            }
          />
        </label>
        {(['secondaryColor', 'headingColor'] as const).map((key) => (
          <label key={key} className="block">
            {key === 'secondaryColor' ? 'Secondary color' : 'Heading color'}
            <input
              type="color"
              className="ml-3"
              value={resume.styling[key]}
              onChange={(e) => patch({ styling: { ...resume.styling, [key]: e.target.value } })}
            />
          </label>
        ))}
        <label>
          Layout
          <select
            className="input mt-2"
            value={resume.styling.layout}
            onChange={(e) =>
              patch({
                styling: {
                  ...resume.styling,
                  layout: e.target.value as 'single-column' | 'two-column',
                },
              })
            }
          >
            <option value="single-column">Single column</option>
            <option value="two-column">Two column</option>
          </select>
        </label>
        <label>
          Page size
          <select
            className="input mt-2"
            value={resume.styling.pageSize}
            onChange={(e) =>
              patch({ styling: { ...resume.styling, pageSize: e.target.value as 'A4' | 'LETTER' } })
            }
          >
            <option>A4</option>
            <option>LETTER</option>
          </select>
        </label>
        <label>
          Font family
          <select
            className="input mt-2"
            value={resume.styling.fontFamily}
            onChange={(e) =>
              patch({
                styling: {
                  ...resume.styling,
                  fontFamily: e.target.value as typeof resume.styling.fontFamily,
                },
              })
            }
          >
            {['Inter', 'Georgia', 'Arial', 'Merriweather', 'Roboto Mono'].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        {[
          ['fontSize', 'Font size', 8, 14, 0.5],
          ['lineHeight', 'Line height', 1, 2, 0.05],
          ['sectionSpacing', 'Section spacing', 4, 32, 1],
          ['pageMargin', 'Page margin', 8, 35, 1],
          ['headingSize', 'Heading size', 10, 28, 1],
        ].map(([key, label, min, max, increment]) => (
          <label key={String(key)} className="block">
            {label}: {String(resume.styling[key as keyof typeof resume.styling])}
            <input
              className="w-full"
              type="range"
              min={Number(min)}
              max={Number(max)}
              step={Number(increment)}
              value={Number(resume.styling[key as keyof typeof resume.styling])}
              onChange={(e) =>
                patch({ styling: { ...resume.styling, [String(key)]: Number(e.target.value) } })
              }
            />
          </label>
        ))}
        <label>
          Text color
          <input
            type="color"
            className="ml-3"
            value={resume.styling.textColor}
            onChange={(e) => patch({ styling: { ...resume.styling, textColor: e.target.value } })}
          />
        </label>
        <label className="flex gap-2">
          <input
            type="checkbox"
            checked={resume.styling.showProfileImage}
            onChange={(e) =>
              patch({ styling: { ...resume.styling, showProfileImage: e.target.checked } })
            }
          />
          Show profile image
        </label>
        <label className="flex gap-2">
          <input
            type="checkbox"
            checked={resume.styling.showIcons}
            onChange={(e) => patch({ styling: { ...resume.styling, showIcons: e.target.checked } })}
          />
          Show icons
        </label>
        <label>
          Date format
          <select
            className="input mt-2"
            value={resume.styling.dateFormat}
            onChange={(e) =>
              patch({
                styling: {
                  ...resume.styling,
                  dateFormat: e.target.value as typeof resume.styling.dateFormat,
                },
              })
            }
          >
            {['MMM YYYY', 'MM/YYYY', 'YYYY'].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Section-title style
          <select
            className="input mt-2"
            value={resume.styling.sectionTitleStyle}
            onChange={(e) =>
              patch({
                styling: {
                  ...resume.styling,
                  sectionTitleStyle: e.target.value as typeof resume.styling.sectionTitleStyle,
                },
              })
            }
          >
            {['underline', 'filled', 'plain', 'uppercase'].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <SectionOrder
          value={resume.sectionOrder}
          onChange={(sectionOrder) => patch({ sectionOrder })}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            patch({
              styling: {
                pageSize: 'A4',
                layout: 'single-column',
                fontFamily: 'Inter',
                fontSize: 10,
                lineHeight: 1.45,
                sectionSpacing: 14,
                primaryColor: '#4f46e5',
                textColor: '#0f172a',
                pageMargin: 18,
                showProfileImage: false,
                secondaryColor: '#e0e7ff',
                headingColor: '#0f172a',
                headingSize: 14,
                showIcons: true,
                dateFormat: 'MMM YYYY',
                sectionTitleStyle: 'underline',
              },
            })
          }
        >
          Reset template defaults
        </Button>
      </div>
    );
  if (step === 'preview')
    return (
      <div className="xl:hidden">
        <ResumeDocument resume={resume} />
      </div>
    );
  const key = step as keyof Resume;
  const items = (resume[key] as Array<Record<string, unknown>>) ?? [];
  const set = (next: Record<string, unknown>[]) => patch({ [key]: next } as Partial<Resume>);
  return (
    <RepeatableSection
      section={step}
      items={
        items as Array<Record<string, unknown> & { id: string; visible: boolean; order: number }>
      }
      onChange={set}
    />
  );
}
