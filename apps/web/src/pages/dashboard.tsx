import {
  BarChart3,
  Bell,
  Download,
  FilePlus2,
  FileText,
  Gauge,
  Menu,
  Search,
  Sparkles,
} from 'lucide-react';
import { Button } from '@resumind/ui';
import { Link } from 'react-router-dom';
import { useDashboardQuery } from '../app/api';
import { useAppSelector } from '../app/hooks';
import { Logo } from '../components/logo';
import { ThemeToggle } from '../components/theme-toggle';
export function Dashboard() {
  const user = useAppSelector((s) => s.auth.user);
  const { data, isLoading, isError, refetch } = useDashboardQuery();
  const summary = data?.data;
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="container-shell flex h-18 items-center gap-4">
          <button className="md:hidden">
            <Menu />
          </button>
          <Logo />
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <button
              className="grid size-10 place-items-center rounded-xl border border-slate-200 dark:border-slate-700"
              aria-label="Notifications"
            >
              <Bell size={18} />
            </button>
            <span className="ml-1 grid size-10 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 font-bold text-white">
              {user?.name?.[0] ?? 'U'}
            </span>
          </div>
        </div>
      </header>
      <main className="container-shell py-10">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold text-indigo-600">YOUR WORKSPACE</p>
            <h1 className="mt-2 text-3xl font-black">
              Welcome back, {user?.name?.split(' ')[0] ?? 'there'}
            </h1>
            <p className="mt-2 text-slate-500">
              Let’s move your story one step closer to the shortlist.
            </p>
          </div>
          <Button asChild>
            <Link to="/dashboard/resumes">
              <FilePlus2 size={18} /> Create new resume
            </Link>
          </Button>
        </div>
        {isError ? (
          <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-800">
            <p className="font-bold">We couldn’t load your dashboard.</p>
            <button onClick={() => refetch()} className="mt-2 underline">
              Try again
            </button>
          </div>
        ) : (
          <>
            <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric
                loading={isLoading}
                icon={<FileText />}
                label="Total resumes"
                value={summary?.totalResumes ?? 0}
              />
              <Metric
                loading={isLoading}
                icon={<Gauge />}
                label="Average ATS score"
                value={summary?.averageAtsScore ?? '—'}
              />
              <Metric
                loading={isLoading}
                icon={<BarChart3 />}
                label="Latest ATS score"
                value={summary?.latestAtsScore ?? '—'}
              />
              <Metric
                loading={isLoading}
                icon={<Download />}
                label="Downloads"
                value={summary?.totalDownloads ?? 0}
              />
            </section>
            <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-xl font-bold">Recent resumes</h2>
                    <p className="text-sm text-slate-500">Pick up where you left off.</p>
                  </div>
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={16}
                    />
                    <input className="input h-10 pl-9" placeholder="Search resumes" />
                  </div>
                </div>
                <Empty
                  icon={<FileText />}
                  title="Your first resume starts here"
                  text="Create a tailored resume and watch your progress appear on this dashboard."
                />
              </div>
              <aside className="space-y-5">
                <div className="rounded-3xl bg-slate-950 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{summary?.plan ?? 'Free'} plan</span>
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs">Current</span>
                  </div>
                  <p className="mt-8 text-4xl font-black">{summary?.aiCreditsRemaining ?? 5}</p>
                  <p className="text-sm text-slate-400">AI credits remaining</p>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-indigo-400 to-violet-400" />
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                  <h2 className="font-bold">Recommended next</h2>
                  <ul className="mt-4 space-y-3">
                    {(summary?.recommendedActions ?? []).map((x) => (
                      <li key={x} className="flex gap-3 text-sm text-slate-600 dark:text-slate-300">
                        <Sparkles size={17} className="shrink-0 text-indigo-500" />
                        {x}
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
function Metric({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
        <span className="text-indigo-500">{icon}</span>
        {label}
      </div>
      {loading ? (
        <div className="mt-5 h-9 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      ) : (
        <p className="mt-4 text-3xl font-black">{value}</p>
      )}
    </div>
  );
}
function Empty({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="grid min-h-72 place-items-center text-center">
      <div>
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950">
          {icon}
        </span>
        <h3 className="mt-4 font-bold">{title}</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{text}</p>
      </div>
    </div>
  );
}
