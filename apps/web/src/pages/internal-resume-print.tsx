import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Resume } from '@resumind/shared';
import { ResumeDocument } from '../features/resume/templates';

export function InternalResumePrint() {
  const { resumeId = '' } = useParams();
  const [resume, setResume] = useState<Resume>();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const token = location.hash.slice(1);
    history.replaceState(null, '', location.pathname);
    const base = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1';
    void fetch(`${base}/internal/exports/render`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ resumeId, token }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('render authorization failed');
        return (await response.json()) as { data: Resume };
      })
      .then(({ data }) => setResume(data))
      .catch(() => setFailed(true));
  }, [resumeId]);
  useEffect(() => {
    if (resume) document.documentElement.dataset.renderReady = 'true';
    return () => {
      delete document.documentElement.dataset.renderReady;
    };
  }, [resume]);
  if (failed) return <main role="alert">Render unavailable.</main>;
  if (!resume) return <main>Preparing document…</main>;
  return <ResumeDocument resume={resume} />;
}
