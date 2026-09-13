import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Lock,
  Maximize2,
  Minus,
  Plus,
  RotateCcw,
  X,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@resumind/ui';
import { toast } from 'sonner';
import type { Resume } from '@resumind/shared';
import {
  useApplyTemplateMutation,
  usePreviewTemplateMutation,
  useTemplatesQuery,
} from '../app/api';
import { ResumeDocument } from '../features/resume/templates';

export function TemplatePreview() {
  const { resumeId = '', templateId = '' } = useParams();
  const navigate = useNavigate();
  const [zoom, setZoom] = useState(80);
  const [fit, setFit] = useState(true);
  const { data: list } = useTemplatesQuery();
  const [load, { data, isLoading, error }] = usePreviewTemplateMutation();
  const [apply, { isLoading: applying }] = useApplyTemplateMutation();
  useEffect(() => {
    void load({ resumeId, templateId });
  }, [load, resumeId, templateId]);
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === 'Escape') navigate(`/dashboard/resumes/${resumeId}/templates`);
    };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [navigate, resumeId]);
  const templates = list?.data ?? [];
  const index = templates.findIndex((t) => t.id === templateId);
  const adjacent = (delta: number) =>
    templates[(index + delta + templates.length) % templates.length];
  const previewResume = useMemo(
    () =>
      data
        ? ({
            ...data.data.resume,
            templateId: data.data.template.id,
            styling: { ...data.data.resume.styling, ...data.data.template.defaultStyling },
          } as Resume)
        : null,
    [data],
  );
  const go = (delta: number) => {
    const t = adjacent(delta);
    if (t) navigate(`/dashboard/resumes/${resumeId}/templates/${t.id}/preview`);
  };
  const applyNow = async () => {
    if (!data?.data.canApply) return;
    try {
      await apply({ resumeId, templateId }).unwrap();
      toast.success(`${data.data.template.name} applied`);
      navigate(`/dashboard/resumes/${resumeId}/edit`);
    } catch {
      toast.error('Template could not be applied');
    }
  };
  if (isLoading && !data) return <PreviewState title="Preparing your latest resume…" />;
  if (error || !data || !previewResume)
    return (
      <PreviewState
        title="This preview could not be loaded."
        action={
          <>
            <Button onClick={() => load({ resumeId, templateId })}>Retry</Button>
            <Button asChild variant="secondary">
              <Link to={`/dashboard/resumes/${resumeId}/templates`}>Back to Gallery</Link>
            </Button>
          </>
        }
      />
    );
  const t = data.data.template;
  return (
    <main
      className="fixed inset-0 z-50 flex flex-col bg-slate-200"
      aria-label={`${t.name} full-screen preview`}
    >
      <header className="z-10 flex min-h-16 flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 shadow-sm sm:px-5">
        <Button asChild variant="ghost">
          <Link to={`/dashboard/resumes/${resumeId}/templates`}>
            <ArrowLeft size={17} /> <span className="hidden sm:inline">Back to Templates</span>
          </Link>
        </Button>
        <div className="mr-auto border-l pl-3">
          <strong>{t.name}</strong>
          <span className="ml-2 rounded-full bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700">
            {t.accessLevel === 'premium' ? 'Premium Preview' : 'Free'}
          </span>
        </div>
        <div className="hidden items-center gap-1 md:flex">
          <Button variant="ghost" aria-label="Previous template" onClick={() => go(-1)}>
            <ChevronLeft size={18} />
          </Button>
          <Button
            variant="ghost"
            aria-label="Zoom out"
            onClick={() => {
              setFit(false);
              setZoom((z) => Math.max(50, z - 10));
            }}
          >
            <Minus size={18} />
          </Button>
          <output className="w-12 text-center text-sm font-bold">{fit ? 'Fit' : `${zoom}%`}</output>
          <Button
            variant="ghost"
            aria-label="Zoom in"
            onClick={() => {
              setFit(false);
              setZoom((z) => Math.min(150, z + 10));
            }}
          >
            <Plus size={18} />
          </Button>
          <Button variant="ghost" aria-label="Fit to width" onClick={() => setFit(true)}>
            <Maximize2 size={18} />
          </Button>
          <Button
            variant="ghost"
            aria-label="Reset zoom"
            onClick={() => {
              setFit(false);
              setZoom(100);
            }}
          >
            <RotateCcw size={18} />
          </Button>
          <Button variant="ghost" aria-label="Next template" onClick={() => go(1)}>
            <ChevronRight size={18} />
          </Button>
        </div>
        {data.data.canApply ? (
          <Button disabled={applying || t.id === data.data.resume.templateId} onClick={applyNow}>
            {t.id === data.data.resume.templateId ? 'Currently Selected' : 'Apply Template'}
          </Button>
        ) : (
          <Button onClick={() => toast.info('Upgrade options are coming soon')}>
            <Lock size={16} /> Upgrade to Pro
          </Button>
        )}
        <Button asChild variant="ghost">
          <Link aria-label="Close preview" to={`/dashboard/resumes/${resumeId}/templates`}>
            <X size={19} />
          </Link>
        </Button>
      </header>
      <section className="preview-canvas flex min-h-0 flex-1 justify-center overflow-auto p-4 sm:p-8">
        <div
          className={fit ? 'preview-fit' : 'origin-top'}
          style={
            fit
              ? undefined
              : { width: '210mm', transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }
          }
        >
          <ResumeDocument resume={previewResume} />
          <p className="mt-3 text-center text-xs font-bold text-slate-500">
            Page boundaries shown · Actual saved resume data
          </p>
        </div>
      </section>
      <nav
        aria-label="Mobile preview actions"
        className="grid grid-cols-4 gap-2 border-t bg-white p-3 md:hidden"
      >
        <Button variant="secondary" aria-label="Previous template" onClick={() => go(-1)}>
          <ChevronLeft />
        </Button>
        <Button
          variant="secondary"
          aria-label="Zoom out"
          onClick={() => {
            setFit(false);
            setZoom((z) => Math.max(50, z - 10));
          }}
        >
          <Minus />
        </Button>
        <Button
          variant="secondary"
          aria-label="Zoom in"
          onClick={() => {
            setFit(false);
            setZoom((z) => Math.min(150, z + 10));
          }}
        >
          <Plus />
        </Button>
        <Button variant="secondary" aria-label="Next template" onClick={() => go(1)}>
          <ChevronRight />
        </Button>
      </nav>
    </main>
  );
}
function PreviewState({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <main className="fixed inset-0 z-50 grid place-items-center bg-slate-100 p-6">
      <div className="text-center">
        <h1 className="text-xl font-black">{title}</h1>
        {action && <div className="mt-5 flex gap-3">{action}</div>}
      </div>
    </main>
  );
}
