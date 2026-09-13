import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Resume } from '@resumind/shared';
import type { RootState } from './store';
import { loggedOut, tokenReceived } from '../features/auth/auth-slice';
const rawBase = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1',
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});
const baseQuery: typeof rawBase = async (args, apiContext, extra) => {
  let result = await rawBase(args, apiContext, extra);
  if (
    result.error?.status === 401 &&
    !(typeof args === 'string' ? args : args.url).includes('/auth/refresh')
  ) {
    const refreshed = await rawBase({ url: '/auth/refresh', method: 'POST' }, apiContext, extra);
    if (refreshed.data) {
      const payload = refreshed.data as { data: { accessToken: string; user: User } };
      apiContext.dispatch(tokenReceived(payload.data));
      result = await rawBase(args, apiContext, extra);
    } else apiContext.dispatch(loggedOut());
  }
  return result;
};
export type User = {
  _id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'user';
  emailVerifiedAt?: string;
  plan?: 'free' | 'pro';
  subscriptionStatus?: 'inactive' | 'active' | 'trialing' | 'past_due' | 'cancelled';
  subscriptionExpiresAt?: string;
};
export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Session', 'Resume', 'ATS', 'JobMatch', 'Template'],
  endpoints: (builder) => ({
    login: builder.mutation<
      { success: true; data: { accessToken: string; user: User } },
      { email: string; password: string }
    >({ query: (body) => ({ url: '/auth/login', method: 'POST', body }) }),
    register: builder.mutation<
      { success: true; data: { message: string } },
      { name: string; email: string; password: string }
    >({ query: (body) => ({ url: '/auth/register', method: 'POST', body }) }),
    forgotPassword: builder.mutation<
      { success: true; data: { message: string } },
      { email: string }
    >({ query: (body) => ({ url: '/auth/forgot-password', method: 'POST', body }) }),
    resetPassword: builder.mutation<
      { success: true; data: { message: string } },
      { token: string; password: string }
    >({ query: (body) => ({ url: '/auth/reset-password', method: 'POST', body }) }),
    verifyEmail: builder.mutation<{ success: true; data: { message: string } }, { token: string }>({
      query: (body) => ({ url: '/auth/verify-email', method: 'POST', body }),
    }),
    refresh: builder.mutation<{ success: true; data: { accessToken: string; user: User } }, void>({
      query: () => ({ url: '/auth/refresh', method: 'POST' }),
    }),
    restoreSession: builder.query<
      { success: true; data: { accessToken: string; user: User } },
      void
    >({
      query: () => ({ url: '/auth/refresh', method: 'POST' }),
      keepUnusedDataFor: 5,
    }),
    me: builder.query<{ success: true; data: User }, void>({ query: () => '/auth/me' }),
    dashboard: builder.query<{ success: true; data: Dashboard }, void>({
      query: () => '/dashboard/summary',
    }),
    resumes: builder.query<
      { success: true; data: Resume[]; meta: { total: number; pages: number } },
      string | void
    >({ query: (q = '') => `/resumes?${q}`, providesTags: ['Resume'] }),
    resume: builder.query<{ success: true; data: Resume }, string>({
      query: (id) => `/resumes/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Resume', id }],
    }),
    createResume: builder.mutation<
      { success: true; data: Resume },
      { title: string; targetRole?: string; targetCompany?: string; templateId: string }
    >({
      query: (body) => ({ url: '/resumes', method: 'POST', body }),
      invalidatesTags: ['Resume'],
    }),
    autosaveResume: builder.mutation<
      { success: true; data: Resume },
      { id: string; changes: Partial<Resume> }
    >({
      query: ({ id, changes }) => ({
        url: `/resumes/${id}/autosave`,
        method: 'PATCH',
        body: changes,
      }),
      invalidatesTags: ['Resume'],
    }),
    resumeAction: builder.mutation<
      unknown,
      { id: string; action: 'duplicate' | 'archive' | 'restore' | 'delete' }
    >({
      query: ({ id, action }) =>
        action === 'delete'
          ? { url: `/resumes/${id}`, method: 'DELETE' }
          : { url: `/resumes/${id}/${action}`, method: action === 'duplicate' ? 'POST' : 'PATCH' },
      invalidatesTags: ['Resume'],
    }),
    analyzeAts: builder.mutation<
      { success: true; data: ATSAnalysis },
      { resumeId: string; jobDescription?: string; mode?: 'deterministic' | 'enhanced' }
    >({
      query: ({ resumeId, ...body }) => ({
        url: `/ats/resumes/${resumeId}/analyze`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ATS'],
    }),
    latestAts: builder.query<{ success: true; data: ATSAnalysis }, string>({
      query: (id) => `/ats/resumes/${id}/latest`,
      providesTags: ['ATS'],
    }),
    atsHistory: builder.query<{ success: true; data: ATSAnalysis[] }, string>({
      query: (id) => `/ats/resumes/${id}/history`,
      providesTags: ['ATS'],
    }),
    analyzeJob: builder.mutation<
      { success: true; data: JobMatch },
      {
        resumeId: string;
        jobTitle: string;
        companyName?: string;
        jobDescription: string;
        consent: boolean;
        aiEnhanced: boolean;
      }
    >({
      query: ({ resumeId, ...body }) => ({
        url: `/job-matching/resumes/${resumeId}/analyze`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['JobMatch'],
    }),
    jobHistory: builder.query<{ success: true; data: JobMatch[] }, string>({
      query: (id) => `/job-matching/resumes/${id}/history`,
      providesTags: ['JobMatch'],
    }),
    applySuggestion: builder.mutation<unknown, { id: string; replacement?: string }>({
      query: ({ id, ...body }) => ({ url: `/ats/suggestions/${id}/apply`, method: 'POST', body }),
      invalidatesTags: ['Resume', 'ATS'],
    }),
    rejectSuggestion: builder.mutation<unknown, string>({
      query: (id) => ({ url: `/ats/suggestions/${id}/reject`, method: 'POST' }),
      invalidatesTags: ['ATS'],
    }),
    templates: builder.query<{ success: true; data: TemplateDefinition[] }, string | void>({
      query: (q = '') => `/templates?${q}`,
      providesTags: ['Template'],
    }),
    templateAccess: builder.query<
      { success: true; data: { canApply: boolean; accessLevel: 'free' | 'premium' } },
      string
    >({ query: (id) => `/templates/${id}/access` }),
    applyTemplate: builder.mutation<
      { success: true; data: { resume: Resume; template: TemplateDefinition } },
      { resumeId: string; templateId: string; styling?: Partial<Resume['styling']> }
    >({
      query: ({ resumeId, ...body }) => ({
        url: `/resumes/${resumeId}/template`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Resume'],
    }),
    previewTemplate: builder.mutation<
      { success: true; data: { resume: Resume; template: TemplateDefinition; canApply: boolean } },
      { resumeId: string; templateId: string }
    >({
      query: ({ resumeId, templateId }) => ({
        url: `/resumes/${resumeId}/template-preview`,
        method: 'POST',
        body: { templateId },
      }),
    }),
    createImport: builder.mutation<{ success: true; data: ResumeImport }, FormData>({
      query: (body) => ({ url: '/resume-imports', method: 'POST', body }),
    }),
    importStatus: builder.query<{ success: true; data: ResumeImport }, string>({
      query: (id) => `/resume-imports/${id}`,
    }),
    updateImport: builder.mutation<
      { success: true; data: ResumeImport },
      { id: string; parsedData: ParsedImportData }
    >({
      query: ({ id, parsedData }) => ({
        url: `/resume-imports/${id}`,
        method: 'PATCH',
        body: parsedData,
      }),
    }),
    confirmImport: builder.mutation<
      { success: true; data: { resume: Resume; idempotent: boolean } },
      string
    >({
      query: (id) => ({ url: `/resume-imports/${id}/confirm`, method: 'POST' }),
      invalidatesTags: ['Resume'],
    }),
    resumeVersions: builder.query<{ success: true; data: ResumeVersion[] }, string>({
      query: (id) => `/resumes/${id}/versions`,
    }),
    resumeVersion: builder.query<
      { success: true; data: ResumeVersion },
      { resumeId: string; versionId: string }
    >({ query: ({ resumeId, versionId }) => `/resumes/${resumeId}/versions/${versionId}` }),
    restoreVersion: builder.mutation<
      { success: true; data: Resume },
      { resumeId: string; versionId: string }
    >({
      query: ({ resumeId, versionId }) => ({
        url: `/resumes/${resumeId}/versions/${versionId}/restore`,
        method: 'POST',
      }),
      invalidatesTags: ['Resume'],
    }),
    shareLinks: builder.query<{ success: true; data: ShareLink[] }, string>({
      query: (id) => `/resumes/${id}/share-links`,
    }),
    createShareLink: builder.mutation<
      { success: true; data: ShareLink & { token: string; url: string } },
      {
        resumeId: string;
        password?: string;
        expiresAt?: string;
        downloadAllowed: boolean;
        searchIndexing: boolean;
        confirmed: true;
      }
    >({
      query: ({ resumeId, ...body }) => ({
        url: `/resumes/${resumeId}/share-links`,
        method: 'POST',
        body,
      }),
    }),
    revokeShareLink: builder.mutation<void, { resumeId: string; linkId: string }>({
      query: ({ resumeId, linkId }) => ({
        url: `/resumes/${resumeId}/share-links/${linkId}`,
        method: 'DELETE',
      }),
    }),
    publicResume: builder.query<
      {
        success: true;
        data: { resume: Resume; downloadAllowed: boolean; searchIndexing: boolean };
      },
      string
    >({ query: (token) => `/public/resumes/${token}` }),
    unlockPublicResume: builder.mutation<
      {
        success: true;
        data: { resume: Resume; downloadAllowed: boolean; searchIndexing: boolean };
      },
      { token: string; password: string }
    >({
      query: ({ token, password }) => ({
        url: `/public/resumes/${token}/unlock`,
        method: 'POST',
        body: { password },
      }),
    }),
    createExport: builder.mutation<
      { success: true; data: { _id: string; status: string; filename: string } },
      { resumeId: string; format: 'pdf' | 'docx'; idempotencyKey: string }
    >({
      query: ({ resumeId, format, idempotencyKey }) => ({
        url: `/resumes/${resumeId}/exports/${format}`,
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
      }),
    }),
    exportStatus: builder.query<
      {
        success: true;
        data: {
          _id: string;
          status: string;
          filename: string;
          progress: number;
          currentStep: string;
          safeErrorMessage?: string;
        };
      },
      { resumeId: string; exportId: string }
    >({ query: ({ resumeId, exportId }) => `/resumes/${resumeId}/exports/${exportId}` }),
    downloadExport: builder.mutation<Blob, { resumeId: string; exportId: string }>({
      query: ({ resumeId, exportId }) => ({
        url: `/resumes/${resumeId}/exports/${exportId}?download=true`,
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
});
export type Dashboard = {
  totalResumes: number;
  averageAtsScore: number | null;
  latestAtsScore: number | null;
  totalDownloads: number;
  aiCreditsRemaining: number;
  plan: string;
  recentResumes: unknown[];
  recentAnalyses: unknown[];
  recommendedActions: string[];
};
export const {
  useLoginMutation,
  useRegisterMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useVerifyEmailMutation,
  useRefreshMutation,
  useRestoreSessionQuery,
  useMeQuery,
  useDashboardQuery,
  useResumesQuery,
  useResumeQuery,
  useCreateResumeMutation,
  useAutosaveResumeMutation,
  useResumeActionMutation,
  useAnalyzeAtsMutation,
  useLatestAtsQuery,
  useAtsHistoryQuery,
  useAnalyzeJobMutation,
  useJobHistoryQuery,
  useApplySuggestionMutation,
  useRejectSuggestionMutation,
  useTemplatesQuery,
  useTemplateAccessQuery,
  useApplyTemplateMutation,
  usePreviewTemplateMutation,
  useCreateImportMutation,
  useLazyImportStatusQuery,
  useUpdateImportMutation,
  useConfirmImportMutation,
  useResumeVersionsQuery,
  useResumeVersionQuery,
  useRestoreVersionMutation,
  useShareLinksQuery,
  useCreateShareLinkMutation,
  useRevokeShareLinkMutation,
  usePublicResumeQuery,
  useUnlockPublicResumeMutation,
  useCreateExportMutation,
  useLazyExportStatusQuery,
  useDownloadExportMutation,
} = api;
export type ParsedImportData = Omit<Partial<Resume>, 'personalDetails'> & {
  personalDetails?: Partial<Resume['personalDetails']>;
};
export type ResumeImport = {
  _id: string;
  status: string;
  extractedText: string;
  parsedData: ParsedImportData;
  confidence: Record<string, 'high' | 'medium' | 'low'>;
  originalName: string;
  progress?: number;
  currentStep?: string;
  safeErrorMessage?: string;
};
export type ResumeVersion = {
  _id: string;
  versionNumber: number;
  changeSource: string;
  changeSummary: string;
  createdAt: string;
  snapshot?: Resume;
};
export type ShareLink = {
  _id: string;
  active: boolean;
  expiresAt?: string;
  downloadAllowed: boolean;
  searchIndexing: boolean;
  viewCount: number;
  downloadCount: number;
  createdAt: string;
};
export type TemplateDefinition = {
  id: string;
  name: string;
  description: string;
  accessLevel: 'free' | 'premium';
  category: 'modern' | 'professional' | 'minimal' | 'creative';
  layout: 'single-column' | 'two-column';
  atsFriendly: boolean;
  recommendedFor: string[];
  palettes: Array<{
    name: string;
    primaryColor: string;
    secondaryColor: string;
    headingColor: string;
    textColor: string;
  }>;
  fonts: string[];
  featured: boolean;
  popular: number;
  sortOrder: number;
  active: boolean;
  defaultStyling: Resume['styling'];
};
export type ATSAnalysis = {
  _id: string;
  overallScore: number;
  scoreVersion: string;
  createdAt: string;
  categories: Array<{
    key: string;
    label: string;
    score: number;
    maxScore: number;
    percentage: number;
    findings: string[];
  }>;
  strengths: string[];
  issues: Array<{ category: string; severity: string; message: string }>;
  missingKeywords: string[];
  matchedKeywords: string[];
  weakVerbs: string[];
  overusedWords: string[];
  grammarObservations: string[];
  formattingObservations: string[];
};
export type JobMatch = {
  _id: string;
  jobTitle: string;
  companyName?: string;
  matchPercentage: number;
  categories: Record<string, number | null>;
  matchedKeywords: string[];
  missingKeywords: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  warnings: string[];
  createdAt: string;
};
