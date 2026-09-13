import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { useRestoreSessionQuery } from './api';
import { useAppDispatch, useAppSelector } from './hooks';
import { tokenReceived } from '../features/auth/auth-slice';
import { AuthPage } from '../pages/auth';
import { Contact, ContentPage } from '../pages/content';
import { AccountAction } from '../pages/account-action';
const Landing = lazy(() => import('../pages/landing').then((m) => ({ default: m.Landing })));
const Dashboard = lazy(() => import('../pages/dashboard').then((m) => ({ default: m.Dashboard })));
const ResumeEditor = lazy(() =>
  import('../pages/resume-editor').then((m) => ({ default: m.ResumeEditor })),
);
const ResumeManager = lazy(() =>
  import('../pages/resume-manager').then((m) => ({ default: m.ResumeManager })),
);
const ATSAnalysisPage = lazy(() =>
  import('../pages/ats-analysis').then((m) => ({ default: m.ATSAnalysisPage })),
);
const JobMatchPage = lazy(() =>
  import('../pages/job-match').then((m) => ({ default: m.JobMatchPage })),
);
const TemplateGallery = lazy(() =>
  import('../pages/template-gallery').then((m) => ({ default: m.TemplateGallery })),
);
const TemplatePreview = lazy(() =>
  import('../pages/template-preview').then((m) => ({ default: m.TemplatePreview })),
);
const ResumeImport = lazy(() =>
  import('../pages/resume-import').then((m) => ({ default: m.ResumeImport })),
);
const ResumeHistory = lazy(() =>
  import('../pages/resume-history').then((m) => ({ default: m.ResumeHistory })),
);
const PublicResume = lazy(() =>
  import('../pages/public-resume').then((m) => ({ default: m.PublicResume })),
);
const InternalResumePrint = lazy(() =>
  import('../pages/internal-resume-print').then((m) => ({ default: m.InternalResumePrint })),
);
const page = (node: React.ReactNode) => (
  <Suspense fallback={<main className="grid min-h-screen place-items-center">Loading…</main>}>
    {node}
  </Suspense>
);
function Protected() {
  const token = useAppSelector((s) => s.auth.accessToken);
  const dispatch = useAppDispatch();
  const { data, isLoading, isError } = useRestoreSessionQuery(undefined, { skip: Boolean(token) });
  useEffect(() => {
    if (data) dispatch(tokenReceived(data.data));
  }, [data, dispatch]);
  if (!token && isLoading)
    return <main className="grid min-h-screen place-items-center">Restoring your session…</main>;
  if (!token && isError) return <Navigate to="/login" replace />;
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}
function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center p-6 text-center">
      <div>
        <p className="text-7xl font-black gradient-text">404</p>
        <h1 className="mt-4 text-2xl font-bold">This page took a wrong turn.</h1>
        <a href="/" className="mt-6 inline-block font-bold text-indigo-600">
          Return home
        </a>
      </div>
    </main>
  );
}
export const router = createBrowserRouter([
  { path: '/', element: page(<Landing />) },
  { path: '/login', element: <AuthPage mode="login" /> },
  { path: '/register', element: <AuthPage mode="register" /> },
  { path: '/forgot-password', element: <AccountAction kind="forgot" /> },
  { path: '/reset-password', element: <AccountAction kind="reset" /> },
  { path: '/verify-email', element: <AccountAction kind="verify" /> },
  { path: '/auth/callback', element: <AccountAction kind="oauth" /> },
  { path: '/privacy', element: <ContentPage kind="privacy" /> },
  { path: '/terms', element: <ContentPage kind="terms" /> },
  { path: '/refund-policy', element: <ContentPage kind="refund" /> },
  { path: '/contact', element: <Contact /> },
  { path: '/r/:shareToken', element: page(<PublicResume />) },
  { path: '/internal/resumes/:resumeId/print', element: page(<InternalResumePrint />) },
  {
    element: <Protected />,
    children: [
      { path: '/dashboard', element: page(<Dashboard />) },
      { path: '/dashboard/resumes', element: page(<ResumeManager />) },
      { path: '/dashboard/resumes/:resumeId/edit', element: page(<ResumeEditor />) },
      { path: '/dashboard/resumes/:resumeId/ats-analysis', element: page(<ATSAnalysisPage />) },
      { path: '/dashboard/resumes/:resumeId/job-match', element: page(<JobMatchPage />) },
      { path: '/dashboard/resumes/:resumeId/templates', element: page(<TemplateGallery />) },
      { path: '/dashboard/resumes/import', element: page(<ResumeImport />) },
      { path: '/dashboard/resumes/:resumeId/history', element: page(<ResumeHistory />) },
      {
        path: '/dashboard/resumes/:resumeId/templates/:templateId/preview',
        element: page(<TemplatePreview />),
      },
    ],
  },
  { path: '*', element: <NotFound /> },
]);
