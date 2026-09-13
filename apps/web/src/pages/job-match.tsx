import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@resumind/ui';
import { useAnalyzeJobMutation, useJobHistoryQuery, type JobMatch } from '../app/api';
export function JobMatchPage() {
  const resumeId = useParams().resumeId!;
  const [title, setTitle] = useState(''),
    [company, setCompany] = useState(''),
    [description, setDescription] = useState(''),
    [consent, setConsent] = useState(false),
    [result, setResult] = useState<JobMatch>();
  const [analyze, s] = useAnalyzeJobMutation();
  const history = useJobHistoryQuery(resumeId);
  return (
    <main className="min-h-screen bg-slate-50 p-6 dark:bg-slate-950">
      <div className="mx-auto max-w-5xl">
        <Link
          className="font-bold text-indigo-600"
          to={`/dashboard/resumes/${resumeId}/ats-analysis`}
        >
          ← ATS analysis
        </Link>
        <h1 className="mt-5 text-3xl font-black">Job description match</h1>
        <div className="mt-7 grid gap-6 lg:grid-cols-2">
          <form
            className="rounded-3xl border bg-white p-6 dark:bg-slate-900"
            onSubmit={(e) => {
              e.preventDefault();
              analyze({
                resumeId,
                jobTitle: title,
                companyName: company,
                jobDescription: description,
                consent,
                aiEnhanced: false,
              })
                .unwrap()
                .then((x) => {
                  setResult(x.data);
                  history.refetch();
                });
            }}
          >
            <label className="label">
              Job title
              <input
                className="input mt-2"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label className="label mt-4">
              Company (optional)
              <input
                className="input mt-2"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </label>
            <label className="label mt-4">
              Job description
              <textarea
                className="input mt-2 min-h-64"
                minLength={50}
                maxLength={20000}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <label className="mt-4 flex gap-3 text-sm">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              I understand selected resume content may be securely sent to the configured AI
              provider for optional AI features. Deterministic matching stays local.
            </label>
            <Button className="mt-5" disabled={s.isLoading}>
              Analyze match
            </Button>
          </form>
          <div>
            {result ? (
              <Result x={result} />
            ) : (
              <div className="rounded-3xl border bg-white p-10 text-center text-slate-500 dark:bg-slate-900">
                Paste a job description to see skill and keyword coverage.
              </div>
            )}
            <div className="mt-6 rounded-3xl border bg-white p-6 dark:bg-slate-900">
              <h2 className="font-bold">Previous analyses</h2>
              {history.data?.data.map((x) => (
                <button
                  className="mt-3 block text-left text-sm"
                  key={x._id}
                  onClick={() => setResult(x)}
                >
                  <strong>{x.jobTitle}</strong> · {x.matchPercentage}% ·{' '}
                  {new Date(x.createdAt).toLocaleDateString()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
function Result({ x }: { x: JobMatch }) {
  return (
    <div className="rounded-3xl border bg-white p-6 dark:bg-slate-900">
      <p className="text-sm font-bold text-indigo-600">MATCH SCORE</p>
      <p className="mt-2 text-6xl font-black">{x.matchPercentage}%</p>
      <h3 className="mt-6 font-bold">Matched keywords</h3>
      <p className="mt-2 text-sm text-emerald-700">{x.matchedKeywords.join(', ') || 'None yet'}</p>
      <h3 className="mt-5 font-bold">Missing keywords</h3>
      <p className="mt-2 text-sm text-amber-700">
        {x.missingKeywords.join(', ') || 'None detected'}
      </p>
      <p className="mt-5 text-xs text-slate-500">
        Only add skills and experience you genuinely possess.
      </p>
    </div>
  );
}
