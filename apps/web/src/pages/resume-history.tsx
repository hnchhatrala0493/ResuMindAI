import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@resumind/ui';
import { toast } from 'sonner';
import {
  useCreateExportMutation,
  useLazyExportStatusQuery,
  useCreateShareLinkMutation,
  useDownloadExportMutation,
  useRestoreVersionMutation,
  useResumeVersionsQuery,
  useShareLinksQuery,
  useRevokeShareLinkMutation,
} from '../app/api';
export function ResumeHistory() {
  const { resumeId = '' } = useParams();
  const { data, refetch } = useResumeVersionsQuery(resumeId);
  const { data: shares, refetch: refetchShares } = useShareLinksQuery(resumeId);
  const [restore] = useRestoreVersionMutation();
  const [createShare] = useCreateShareLinkMutation();
  const [revoke] = useRevokeShareLinkMutation();
  const [createExport, { isLoading: exporting }] = useCreateExportMutation();
  const [download] = useDownloadExportMutation();
  const [getExportStatus] = useLazyExportStatusQuery();
  const [exportStatus, setExportStatus] = useState('');
  const [password, setPassword] = useState('');
  const exportFile = async (format: 'pdf' | 'docx') => {
    try {
      const job = (
        await createExport({ resumeId, format, idempotencyKey: crypto.randomUUID() }).unwrap()
      ).data;
      setExportStatus('Queued');
      for (let attempt = 0; attempt < 90; attempt += 1) {
        const current = (await getExportStatus({ resumeId, exportId: job._id }, false).unwrap())
          .data;
        setExportStatus(`${current.currentStep} ${current.progress}%`);
        if (current.status === 'ready') break;
        if (current.status === 'failed')
          throw new Error(current.safeErrorMessage ?? 'Export failed');
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (attempt === 89) throw new Error('Export timed out');
      }
      const blob = await download({ resumeId, exportId: job._id }).unwrap();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = job.filename;
      a.click();
      URL.revokeObjectURL(url);
      setExportStatus('Downloaded');
    } catch {
      setExportStatus('Failed');
      toast.error('Export failed or requires a Pro plan.');
    }
  };
  const share = async () => {
    if (!confirm('Anyone with this link may view the resume until the link is revoked or expires.'))
      return;
    const x = await createShare({
      resumeId,
      password: password || undefined,
      downloadAllowed: true,
      searchIndexing: false,
      confirmed: true,
    }).unwrap();
    await navigator.clipboard.writeText(`${location.origin}${x.data.url}`);
    toast.success('Private share link copied');
    void refetchShares();
  };
  return (
    <main className="min-h-screen bg-slate-50 p-5 sm:p-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black">Version history & sharing</h1>
            <p className="text-slate-500">Restore safely, export, or manage public access.</p>
          </div>
          <Button asChild variant="secondary">
            <Link to={`/dashboard/resumes/${resumeId}/edit`}>Back to builder</Link>
          </Button>
        </div>
        <section className="mt-7 rounded-3xl border bg-white p-6">
          <h2 className="text-xl font-black">Download</h2>
          <div className="mt-4 flex gap-3">
            <Button disabled={exporting} onClick={() => void exportFile('pdf')}>
              Generate PDF
            </Button>
            <Button
              disabled={exporting}
              variant="secondary"
              onClick={() => void exportFile('docx')}
            >
              Generate DOCX
            </Button>
          </div>
          {exportStatus && (
            <p role="status" aria-live="polite" className="mt-3 text-sm text-slate-600">
              {exportStatus}
            </p>
          )}
        </section>
        <section className="mt-6 rounded-3xl border bg-white p-6">
          <h2 className="text-xl font-black">Secure sharing</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <input
              className="input"
              type="password"
              placeholder="Optional password (8+ characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button onClick={() => void share()}>Create and copy link</Button>
          </div>
          <div className="mt-4 space-y-2">
            {shares?.data.map((x) => (
              <div
                key={x._id}
                className="flex items-center justify-between rounded-xl bg-slate-50 p-3"
              >
                <span>
                  {x.active ? 'Active' : 'Revoked'} · {x.viewCount} views
                </span>
                {x.active && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      await revoke({ resumeId, linkId: x._id });
                      void refetchShares();
                    }}
                  >
                    Revoke
                  </Button>
                )}
              </div>
            ))}
          </div>
        </section>
        <section className="mt-6 rounded-3xl border bg-white p-6">
          <h2 className="text-xl font-black">Saved versions</h2>
          <div className="mt-4 space-y-3">
            {data?.data.map((v) => (
              <article
                key={v._id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
              >
                <div>
                  <strong>Version {v.versionNumber}</strong>
                  <p className="text-sm text-slate-500">
                    {v.changeSummary || v.changeSource} · {new Date(v.createdAt).toLocaleString()}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    if (
                      confirm(
                        `Restore version ${v.versionNumber}? A safety snapshot will be created first.`,
                      )
                    ) {
                      await restore({ resumeId, versionId: v._id }).unwrap();
                      toast.success('Version restored');
                      void refetch();
                    }
                  }}
                >
                  Restore
                </Button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
