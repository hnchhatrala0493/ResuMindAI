import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@resumind/ui';
import { usePublicResumeQuery, useUnlockPublicResumeMutation } from '../app/api';
import { ResumeDocument } from '../features/resume/templates';
export function PublicResume() {
  const { shareToken = '' } = useParams();
  const { data, error, isLoading } = usePublicResumeQuery(shareToken);
  const [unlock, { data: unlocked, error: unlockError }] = useUnlockPublicResumeMutation();
  const [password, setPassword] = useState('');
  const shown = data ?? unlocked;
  if (isLoading)
    return <main className="grid min-h-screen place-items-center">Loading shared resume…</main>;
  if (!shown) {
    const code = (error as { data?: { error?: { code?: string; message?: string } } })?.data?.error;
    if (code?.code === 'SHARE_PASSWORD_REQUIRED')
      return (
        <main className="grid min-h-screen place-items-center bg-slate-100 p-5">
          <form
            className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-xl"
            onSubmit={(e) => {
              e.preventDefault();
              void unlock({ token: shareToken, password });
            }}
          >
            <h1 className="text-2xl font-black">Protected resume</h1>
            <label className="mt-5 block font-bold">
              Password
              <input
                autoFocus
                className="input mt-1 w-full"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {unlockError && (
              <p role="alert" className="mt-2 text-sm text-rose-600">
                Incorrect password.
              </p>
            )}
            <Button className="mt-5 w-full">View resume</Button>
          </form>
        </main>
      );
    return (
      <main className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <h1 className="text-2xl font-black">Resume unavailable</h1>
          <p className="mt-2 text-slate-500">
            {code?.message ?? 'This link is invalid, expired, or revoked.'}
          </p>
        </div>
      </main>
    );
  }
  return (
    <main className="min-h-screen bg-slate-200 p-3 sm:p-8">
      <meta
        name="robots"
        content={shown.data.searchIndexing ? 'index,follow' : 'noindex,nofollow'}
      />
      <div className="mx-auto max-w-[210mm]">
        <ResumeDocument resume={shown.data.resume} />
      </div>
    </main>
  );
}
