import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@resumind/ui';
import {
  useForgotPasswordMutation,
  useRefreshMutation,
  useResetPasswordMutation,
  useVerifyEmailMutation,
} from '../app/api';
import { useAppDispatch } from '../app/hooks';
import { Logo } from '../components/logo';
import { tokenReceived } from '../features/auth/auth-slice';

export function AccountAction({ kind }: { kind: 'forgot' | 'reset' | 'verify' | 'oauth' }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [forgot, { isLoading: forgetting }] = useForgotPasswordMutation();
  const [reset, { isLoading: resetting }] = useResetPasswordMutation();
  const [verify] = useVerifyEmailMutation();
  const [refresh] = useRefreshMutation();

  useEffect(() => {
    if (kind === 'verify') {
      const token = params.get('token');
      if (!token) return setMessage('This verification link is incomplete.');
      void verify({ token })
        .unwrap()
        .then((r) => setMessage(r.data.message))
        .catch(() => setMessage('This verification link is invalid or expired.'));
    }
    if (kind === 'oauth') {
      void refresh()
        .unwrap()
        .then((r) => {
          dispatch(tokenReceived(r.data));
          navigate('/dashboard', { replace: true });
        })
        .catch(() => setMessage('Google sign-in could not be completed.'));
    }
  }, [dispatch, kind, navigate, params, refresh, verify]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (kind === 'forgot') setMessage((await forgot({ email }).unwrap()).data.message);
      if (kind === 'reset') {
        const token = params.get('token');
        if (!token) throw new Error('Missing token');
        toast.success((await reset({ token, password }).unwrap()).data.message);
        navigate('/login');
      }
    } catch {
      toast.error('The request could not be completed. Check the form or link.');
    }
  };
  const titles = {
    forgot: 'Reset your password',
    reset: 'Choose a new password',
    verify: 'Verify your email',
    oauth: 'Completing Google sign-in',
  };
  const hasForm = kind === 'forgot' || kind === 'reset';
  return (
    <main className="min-h-screen">
      <header className="container-shell py-6">
        <Logo />
      </header>
      <section className="mx-auto max-w-md px-6 py-24">
        <p className="text-sm font-bold text-indigo-600">ACCOUNT SECURITY</p>
        <h1 className="mt-2 text-3xl font-black">{titles[kind]}</h1>
        {message ? (
          <div className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-5 text-sm text-indigo-900">
            {message}
          </div>
        ) : hasForm ? (
          <form onSubmit={submit} className="mt-8 space-y-5">
            {kind === 'forgot' ? (
              <label className="block text-sm font-bold">
                Email
                <input
                  className="input mt-2"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            ) : (
              <label className="block text-sm font-bold">
                New password
                <input
                  className="input mt-2"
                  type="password"
                  minLength={12}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            )}
            <Button className="w-full" disabled={forgetting || resetting}>
              {kind === 'forgot' ? 'Send reset link' : 'Update password'}
            </Button>
          </form>
        ) : (
          <p className="mt-6 text-slate-500">
            Please wait while we securely complete this request…
          </p>
        )}
        <Link to="/login" className="mt-8 inline-block text-sm font-bold text-indigo-600">
          ← Back to sign in
        </Link>
      </section>
    </main>
  );
}
