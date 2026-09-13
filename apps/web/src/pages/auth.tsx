import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, registerSchema } from '@resumind/shared';
import { ArrowLeft, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@resumind/ui';
import { useLoginMutation, useRegisterMutation } from '../app/api';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { Logo } from '../components/logo';
import { tokenReceived } from '../features/auth/auth-slice';
export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const current = useAppSelector((s) => s.auth.user);
  const [show, setShow] = useState(false);
  const [login, { isLoading: logging }] = useLoginMutation();
  const [register, { isLoading: registering }] = useRegisterMutation();
  const schema = mode === 'login' ? loginSchema : registerSchema;
  type AuthValues = z.infer<typeof registerSchema>;
  const form = useForm<AuthValues>({
    resolver: zodResolver(schema) as unknown as Resolver<AuthValues>,
    defaultValues: { name: '', email: '', password: '' },
  });
  if (current) return <Navigate to="/dashboard" replace />;
  const submit = form.handleSubmit(async (values) => {
    try {
      if (mode === 'login') {
        const response = await login({ email: values.email, password: values.password }).unwrap();
        dispatch(tokenReceived(response.data));
        toast.success('Welcome back');
        navigate('/dashboard');
      } else {
        await register(values).unwrap();
        toast.success('Account created. Check your email to verify it.');
        navigate('/login');
      }
    } catch (error) {
      const message =
        (error as { data?: { error?: { message?: string } } }).data?.error?.message ??
        ((error as { status?: string }).status === 'FETCH_ERROR'
          ? 'The API could not be reached. Check that the server is running and this site is an allowed origin.'
          : 'Something went wrong. Please try again.');
      toast.error(message);
    }
  });
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <Logo />
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600"
          >
            <ArrowLeft size={16} /> Back home
          </Link>
        </div>
        <div className="mx-auto my-auto w-full max-w-md py-14">
          <p className="text-sm font-bold text-indigo-600">
            {mode === 'login' ? 'Welcome back' : 'Your next opportunity starts here'}
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">
            {mode === 'login' ? 'Sign in to ResuMind' : 'Create your account'}
          </h1>
          <p className="mt-3 text-slate-500">
            {mode === 'login'
              ? 'Keep building the resume that opens doors.'
              : 'Build clearer, stronger resumes with guidance you control.'}
          </p>
          <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
            <a
              href={`${import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1'}/auth/google`}
              className="flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              Continue with Google
            </a>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              or use email
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            </div>
            {mode === 'register' && (
              <Field label="Full name" error={form.formState.errors.name?.message}>
                <input
                  {...form.register('name')}
                  autoComplete="name"
                  className="input"
                  placeholder="Maya Sharma"
                />
              </Field>
            )}
            <Field label="Email address" error={form.formState.errors.email?.message}>
              <input
                {...form.register('email')}
                type="email"
                autoComplete="email"
                className="input"
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Password" error={form.formState.errors.password?.message}>
              <div className="relative">
                <input
                  {...form.register('password')}
                  type={show ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="input pr-12"
                  placeholder={mode === 'login' ? 'Your password' : '12+ characters'}
                />
                <button
                  type="button"
                  onClick={() => setShow((x) => !x)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  aria-label={show ? 'Hide password' : 'Show password'}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>
            {mode === 'login' && (
              <div className="text-right">
                <Link to="/forgot-password" className="text-sm font-semibold text-indigo-600">
                  Forgot password?
                </Link>
              </div>
            )}
            <Button className="w-full" size="lg" disabled={logging || registering}>
              {(logging || registering) && <LoaderCircle className="animate-spin" size={18} />}{' '}
              {mode === 'login' ? 'Sign in' : 'Create free account'}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            {mode === 'login' ? 'New to ResuMind? ' : 'Already have an account? '}
            <Link
              className="font-bold text-indigo-600"
              to={mode === 'login' ? '/register' : '/login'}
            >
              {mode === 'login' ? 'Create an account' : 'Sign in'}
            </Link>
          </p>
        </div>
      </section>
      <aside className="hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-center">
        <div className="mx-auto max-w-lg">
          <div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-2xl">
            ✦
          </div>
          <blockquote className="mt-8 text-3xl font-bold leading-snug">
            “Clarity beats cleverness. Your resume should make your value impossible to miss.”
          </blockquote>
          <p className="mt-5 text-slate-400">
            Explainable guidance. Honest improvements. Your final say.
          </p>
        </div>
      </aside>
    </main>
  );
}
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold">{label}</span>
      {children}
      {error && (
        <span role="alert" className="mt-1.5 block text-xs font-medium text-rose-600">
          {error}
        </span>
      )}
    </label>
  );
}
