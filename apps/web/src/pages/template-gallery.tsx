import { useMemo, useState } from 'react';
import { Check, Eye, Filter, LayoutGrid, Lock, Search, Sparkles } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@resumind/ui';
import {
  useApplyTemplateMutation,
  useMeQuery,
  useResumeQuery,
  useTemplatesQuery,
  type TemplateDefinition,
} from '../app/api';

type FilterId = 'all' | 'free' | 'premium' | 'ats' | 'single' | 'two';
const filters: Array<[FilterId, string]> = [
  ['all', 'All Templates'],
  ['free', 'Free'],
  ['premium', 'Premium'],
  ['ats', 'ATS Friendly'],
  ['single', 'One Column'],
  ['two', 'Two Column'],
];

export function TemplateGallery() {
  const { resumeId = '' } = useParams();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterId>('all');
  const [sort, setSort] = useState('popular');
  const { data, isLoading, isError, refetch } = useTemplatesQuery();
  const { data: resume } = useResumeQuery(resumeId);
  const { data: me } = useMeQuery();
  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = (data?.data ?? []).filter((t) => {
      const matches =
        !q || `${t.name} ${t.description} ${t.recommendedFor.join(' ')}`.toLowerCase().includes(q);
      const category =
        filter === 'all' ||
        (filter === 'free' && t.accessLevel === 'free') ||
        (filter === 'premium' && t.accessLevel === 'premium') ||
        (filter === 'ats' && t.atsFriendly) ||
        (filter === 'single' && t.layout === 'single-column') ||
        (filter === 'two' && t.layout === 'two-column');
      return matches && category;
    });
    return [...result].sort((a, b) =>
      sort === 'name'
        ? a.name.localeCompare(b.name)
        : sort === 'newest'
          ? b.sortOrder - a.sortOrder
          : sort === 'free'
            ? Number(a.accessLevel === 'premium') - Number(b.accessLevel === 'premium')
            : sort === 'premium'
              ? Number(b.accessLevel === 'premium') - Number(a.accessLevel === 'premium')
              : b.popular - a.popular,
    );
  }, [data, filter, search, sort]);
  return (
    <main className="template-gallery min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-[1600px]">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-indigo-600">
              <Sparkles size={16} /> Template marketplace
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Resume Templates</h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Choose a professionally designed template and customize it to match your career.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="secondary">
              <Link to={`/dashboard/resumes/${resumeId}/edit`}>Back to builder</Link>
            </Button>
            <span className="rounded-full bg-white px-4 py-2 text-sm font-bold shadow-sm">
              {data?.data.length ?? 0} templates
            </span>
            <span className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700">
              {me?.data.plan === 'pro' ? 'Pro plan' : 'Free plan'}
            </span>
          </div>
        </div>
        <section
          aria-label="Template filters"
          className="sticky top-0 z-20 mt-7 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur"
        >
          <div className="flex flex-wrap gap-3">
            <label className="relative min-w-60 flex-1">
              <Search className="absolute left-3 top-3 text-slate-400" size={18} />
              <span className="sr-only">Search templates</span>
              <input
                className="input w-full pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates or careers"
              />
            </label>
            <select
              aria-label="Sort templates"
              className="input"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="popular">Most Popular</option>
              <option value="newest">Newest</option>
              <option value="free">Free First</option>
              <option value="premium">Premium First</option>
              <option value="name">Name</option>
            </select>
            <Button className="md:hidden" variant="secondary" aria-label="Show template filters">
              <Filter size={17} /> Filters
            </Button>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {filters.map(([id, label]) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                aria-pressed={filter === id}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold focus-visible:outline-2 focus-visible:outline-indigo-600 ${filter === id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>
        {isLoading && (
          <div aria-label="Loading templates" className="template-grid mt-7">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="h-[520px] animate-pulse rounded-2xl bg-white shadow-sm">
                <div className="m-4 h-80 rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>
        )}
        {isError && (
          <State
            title="Templates could not be loaded"
            action={<Button onClick={refetch}>Retry</Button>}
          />
        )}
        {!isLoading && !isError && !list.length && (
          <State
            title="No templates match your filters"
            action={
              <Button
                onClick={() => {
                  setFilter('all');
                  setSearch('');
                }}
              >
                Clear filters
              </Button>
            }
          />
        )}
        <div className="template-grid mt-7">
          {list.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              resumeId={resumeId}
              selected={resume?.data.templateId === t.id}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
function TemplateCard({
  template: t,
  resumeId,
  selected,
}: {
  template: TemplateDefinition;
  resumeId: string;
  selected: boolean;
}) {
  const navigate = useNavigate();
  const [apply, { isLoading }] = useApplyTemplateMutation();
  const useTemplate = async () => {
    if (t.accessLevel === 'premium') {
      navigate(`/dashboard/resumes/${resumeId}/templates/${t.id}/preview`);
      return;
    }
    try {
      await apply({ resumeId, templateId: t.id }).unwrap();
      toast.success(`${t.name} applied`);
      navigate(`/dashboard/resumes/${resumeId}/edit`);
    } catch {
      toast.error('Template could not be applied');
    }
  };
  return (
    <article
      className={`template-card group flex overflow-hidden rounded-2xl border bg-white ${selected ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-slate-200'}`}
    >
      <div className="relative bg-slate-100 p-4">
        <div
          className="template-thumbnail mx-auto aspect-[210/297] w-full overflow-hidden rounded-md bg-white p-[8%] shadow-md"
          style={{
            color: t.defaultStyling.textColor,
            borderTop: `8px solid ${t.defaultStyling.primaryColor}`,
          }}
        >
          <div className="h-3 w-1/2 rounded bg-current opacity-80" />
          <div className="mt-2 h-1 w-4/5 bg-slate-300" />
          <div className="mt-1 h-1 w-2/3 bg-slate-200" />
          {[1, 2, 3, 4].map((x) => (
            <div key={x} className="mt-5">
              <div
                className="h-1.5 w-1/3"
                style={{ background: String(t.defaultStyling.primaryColor) }}
              />
              <div className="mt-2 h-1 w-full bg-slate-200" />
              <div className="mt-1 h-1 w-11/12 bg-slate-200" />
              <div className="mt-1 h-1 w-4/5 bg-slate-100" />
            </div>
          ))}
        </div>
        <div className="absolute left-6 top-6 flex flex-wrap gap-2">
          <Badge>
            {t.accessLevel === 'premium' ? (
              <>
                <Lock size={11} /> Pro
              </>
            ) : (
              'Free'
            )}
          </Badge>
          {t.atsFriendly && <Badge>ATS Friendly</Badge>}
        </div>
        <Link
          aria-label={`Preview ${t.name}`}
          className="absolute inset-x-12 top-1/2 hidden -translate-y-1/2 rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-bold text-white shadow-xl group-hover:block group-focus-within:block"
          to={`/dashboard/resumes/${resumeId}/templates/${t.id}/preview`}
        >
          <Eye className="mr-2 inline" size={17} />
          Preview
        </Link>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-black">{t.name}</h2>
          {selected && (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-700">
              <Check size={14} /> Selected
            </span>
          )}
        </div>
        <p className="mt-1 min-h-10 text-sm text-slate-600">{t.description}</p>
        <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
          <LayoutGrid size={14} />
          {t.layout === 'single-column' ? 'One column' : 'Two column'} · {t.recommendedFor[0]}
        </div>
        <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
          <Button asChild variant="secondary">
            <Link to={`/dashboard/resumes/${resumeId}/templates/${t.id}/preview`}>Preview</Link>
          </Button>
          <Button onClick={useTemplate} disabled={selected || isLoading}>
            {selected
              ? 'Currently Selected'
              : t.accessLevel === 'premium'
                ? 'View Pro'
                : 'Use Template'}
          </Button>
        </div>
      </div>
    </article>
  );
}
const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-700 shadow">
    {children}
  </span>
);
const State = ({ title, action }: { title: string; action: React.ReactNode }) => (
  <div className="my-16 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
    <h2 className="text-xl font-bold">{title}</h2>
    <div className="mt-5">{action}</div>
  </div>
);
