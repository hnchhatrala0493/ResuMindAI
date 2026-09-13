import { ArrowLeft, Gauge, RefreshCw } from 'lucide-react';
import { Button } from '@resumind/ui';
import { Link, useParams } from 'react-router-dom';
import { useAnalyzeAtsMutation, useLatestAtsQuery } from '../app/api';
const tone = (n: number) =>
  n < 50
    ? 'text-rose-600'
    : n < 70
      ? 'text-amber-600'
      : n < 85
        ? 'text-blue-600'
        : 'text-emerald-600';
const label = (n: number) =>
  n < 50 ? 'Needs attention' : n < 70 ? 'Developing' : n < 85 ? 'Strong' : 'Excellent';
export function ATSAnalysisPage() {
  const resumeId = useParams().resumeId!;
  const q = useLatestAtsQuery(resumeId);
  const [analyze, state] = useAnalyzeAtsMutation();
  const a = q.data?.data;
  return (
    <main className="min-h-screen bg-slate-50 p-6 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl">
        <Link
          to={`/dashboard/resumes/${resumeId}/edit`}
          className="flex items-center gap-2 text-sm font-bold text-indigo-600"
        >
          <ArrowLeft size={16} />
          Back to resume
        </Link>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-bold text-indigo-600">ATS ANALYSIS</p>
            <h1 className="text-3xl font-black">Resume health report</h1>
            <p className="mt-2 text-sm text-slate-500">
              Internal estimate—not an official employer ATS score.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" asChild>
              <Link to={`/dashboard/resumes/${resumeId}/job-match`}>Match a job</Link>
            </Button>
            <Button
              disabled={state.isLoading}
              onClick={() =>
                analyze({ resumeId, mode: 'deterministic' })
                  .unwrap()
                  .then(() => q.refetch())
              }
            >
              <RefreshCw size={16} />
              {a ? 'Reanalyze' : 'Analyze resume'}
            </Button>
          </div>
        </div>
        {!a ? (
          <section className="mt-10 rounded-3xl border bg-white p-12 text-center dark:bg-slate-900">
            <Gauge className="mx-auto text-indigo-500" size={44} />
            <h2 className="mt-4 text-xl font-bold">Run your first deterministic analysis</h2>
            <p className="mt-2 text-slate-500">No AI key or external data sharing required.</p>
          </section>
        ) : (
          <>
            <section className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
              <div className="rounded-3xl border bg-white p-7 text-center dark:bg-slate-900">
                <div
                  className={`mx-auto grid size-40 place-items-center rounded-full border-[12px] border-current ${tone(a.overallScore)}`}
                >
                  <div>
                    <strong className="text-5xl">{a.overallScore}</strong>
                    <span className="block text-sm">out of 100</span>
                  </div>
                </div>
                <p className="mt-4 font-bold">{label(a.overallScore)}</p>
                <p className="text-xs text-slate-500">
                  {a.scoreVersion} · {new Date(a.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="rounded-3xl border bg-white p-7 dark:bg-slate-900">
                <h2 className="text-xl font-bold">Category breakdown</h2>
                <div className="mt-5 space-y-4">
                  {a.categories.map((c) => (
                    <div key={c.key}>
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold">{c.label}</span>
                        <span>
                          {c.score}/{c.maxScore}
                        </span>
                      </div>
                      <div className="mt-2 h-2 rounded bg-slate-200">
                        <div
                          className="h-full rounded bg-indigo-500"
                          style={{ width: `${c.percentage}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{c.findings.join(' ')}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
            <section className="mt-6 grid gap-6 md:grid-cols-2">
              <Panel title="Strengths" items={a.strengths} />
              <Panel
                title="Priority actions"
                items={a.issues.map((x) => `${x.severity.toUpperCase()}: ${x.message}`)}
              />
              <Panel title="Missing keywords" items={a.missingKeywords} />
              <Panel title="Matched keywords" items={a.matchedKeywords} />
              <Panel
                title="Writing observations"
                items={[
                  ...a.weakVerbs.map((x) => `Weak verb: ${x}`),
                  ...a.grammarObservations,
                  ...a.overusedWords.map((x) => `Overused: ${x}`),
                ]}
              />
              <Panel title="Formatting observations" items={a.formattingObservations} />
            </section>
          </>
        )}
      </div>
    </main>
  );
}
function Panel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-3xl border bg-white p-6 dark:bg-slate-900">
      <h2 className="font-bold">{title}</h2>
      {items.length ? (
        <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
          {items.map((x, i) => (
            <li key={`${x}-${i}`}>• {x}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-500">Nothing flagged.</p>
      )}
    </div>
  );
}
