import { useState } from 'react';
import { Archive, Copy, FilePlus2, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@resumind/ui';
import { useCreateResumeMutation, useResumeActionMutation, useResumesQuery } from '../app/api';
import { templates } from '../features/resume/templates';
export function ResumeManager() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [show, setShow] = useState(false);
  const nav = useNavigate();
  const { data, isLoading, isError, refetch } = useResumesQuery(
    new URLSearchParams({
      ...(search ? { search } : {}),
      ...(status ? { status } : {}),
    }).toString(),
  );
  const [create, { isLoading: creating }] = useCreateResumeMutation();
  const [action] = useResumeActionMutation();
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      const r = await create({
        title: String(f.get('title')),
        targetRole: String(f.get('targetRole') || ''),
        templateId: String(f.get('templateId')),
      }).unwrap();
      nav(`/dashboard/resumes/${r.data._id}/edit`);
    } catch {
      toast.error('Resume could not be created');
    }
  };
  const act = async (id: string, a: 'duplicate' | 'archive' | 'restore' | 'delete') => {
    if (a === 'delete' && !confirm('Delete this resume? This can only be recovered by support.'))
      return;
    try {
      await action({ id, action: a }).unwrap();
      toast.success(`Resume ${a}d`);
    } catch {
      toast.error('Action failed');
    }
  };
  return (
    <main className="container-shell py-10">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/dashboard" className="text-sm font-bold text-indigo-600">
            ← Dashboard
          </Link>
          <h1 className="mt-2 text-3xl font-black">My Resumes</h1>
        </div>
        <Button asChild variant="secondary">
          <Link to="/dashboard/resumes/import">Import PDF/DOCX</Link>
        </Button>
        <Button onClick={() => setShow((v) => !v)}>
          <FilePlus2 />
          Create resume
        </Button>
      </div>
      {show && (
        <form
          onSubmit={submit}
          className="mt-6 grid gap-4 rounded-3xl border bg-white p-6 sm:grid-cols-4 dark:border-slate-700 dark:bg-slate-900"
        >
          <input required name="title" className="input" placeholder="Resume title" />
          <input name="targetRole" className="input" placeholder="Target role" />
          <select name="templateId" className="input">
            {templates.map(([v, l]) => (
              <option value={v} key={v}>
                {l}
              </option>
            ))}
          </select>
          <Button disabled={creating}>Start from blank</Button>
        </form>
      )}
      <div className="mt-8 flex gap-3">
        <input
          className="input max-w-sm"
          placeholder="Search titles"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input max-w-40"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All active</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
      </div>
      {isLoading ? (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((x) => (
            <div key={x} className="h-56 animate-pulse rounded-3xl bg-slate-200" />
          ))}
        </div>
      ) : isError ? (
        <div className="mt-8">
          Could not load resumes. <button onClick={() => refetch()}>Retry</button>
        </div>
      ) : !data?.data.length ? (
        <div className="mt-12 rounded-3xl border border-dashed p-16 text-center">
          <h2 className="font-bold">No resumes found</h2>
          <p className="text-slate-500">Create one to begin.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {data.data.map((r) => (
            <article
              key={r._id}
              className="rounded-3xl border bg-white p-5 dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="h-28 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-100 p-4 text-indigo-900">
                <b>{r.personalDetails?.firstName || r.title}</b>
                <div className="mt-3 h-1 w-2/3 bg-indigo-300" />
              </div>
              <h2 className="mt-4 font-bold">{r.title}</h2>
              <p className="text-sm text-slate-500">
                {r.targetRole || 'No target role'} · {r.templateId}
              </p>
              <div className="mt-3 h-2 rounded bg-slate-100">
                <div
                  className="h-full rounded bg-emerald-500"
                  style={{ width: `${r.completionPercentage}%` }}
                />
              </div>
              <div className="mt-4 flex gap-2">
                <Button asChild size="sm">
                  <Link to={`/dashboard/resumes/${r._id}/edit`}>
                    <Pencil size={14} />
                    Edit
                  </Link>
                </Button>
                <Button asChild size="sm" variant="secondary">
                  <Link to={`/dashboard/resumes/${r._id}/templates`}>Templates</Link>
                </Button>
                <Button asChild size="sm" variant="secondary">
                  <Link to={`/dashboard/resumes/${r._id}/history`}>History</Link>
                </Button>
                <button onClick={() => act(r._id, 'duplicate')} aria-label="Duplicate">
                  <Copy />
                </button>
                {r.status === 'archived' ? (
                  <button onClick={() => act(r._id, 'restore')} aria-label="Restore">
                    <RotateCcw />
                  </button>
                ) : (
                  <button onClick={() => act(r._id, 'archive')} aria-label="Archive">
                    <Archive />
                  </button>
                )}
                <button
                  onClick={() => act(r._id, 'delete')}
                  aria-label="Delete"
                  className="text-rose-500"
                >
                  <Trash2 />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
