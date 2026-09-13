const id = { name: 'resumeId', in: 'path', required: true, schema: { type: 'string' } };
const templateIds = [
  'modern-classic',
  'professional',
  'minimal',
  'technical',
  'executive-pro',
  'modern-sidebar',
  'creative-studio',
  'elegant-serif',
  'product-leader',
  'developer-pro',
  'international',
  'compact-pro',
  'modern',
  'executive',
  'creative',
];
const baseItem = {
  id: { type: 'string', format: 'uuid' },
  visible: { type: 'boolean' },
  order: { type: 'integer', minimum: 0 },
};
const objectArray = (properties: Record<string, unknown>, required: string[] = []) => ({
  type: 'array',
  maxItems: 100,
  items: {
    type: 'object',
    required: ['id', 'visible', 'order', ...required],
    properties: { ...baseItem, ...properties },
    additionalProperties: false,
  },
});
const resume = {
  type: 'object',
  required: [
    'title',
    'templateId',
    'personalDetails',
    'workExperience',
    'education',
    'skills',
    'projects',
    'certifications',
    'languages',
    'achievements',
    'volunteerExperience',
    'customSections',
    'sectionOrder',
    'styling',
  ],
  properties: {
    _id: { type: 'string', readOnly: true },
    title: { type: 'string', minLength: 1, maxLength: 160 },
    targetRole: { type: 'string', maxLength: 160 },
    targetCompany: { type: 'string', maxLength: 160 },
    status: { enum: ['draft', 'active', 'archived'] },
    templateId: {
      enum: templateIds,
    },
    completionPercentage: { type: 'number', minimum: 0, maximum: 100, readOnly: true },
    personalDetails: {
      type: 'object',
      required: ['firstName', 'lastName', 'email'],
      additionalProperties: false,
      properties: Object.fromEntries(
        [
          'firstName',
          'lastName',
          'professionalTitle',
          'email',
          'phone',
          'country',
          'state',
          'city',
          'postalCode',
          'address',
          'linkedIn',
          'github',
          'portfolio',
          'website',
          'profileImage',
        ].map((x) => [x, { type: 'string' }]),
      ),
    },
    professionalSummary: { type: 'string', maxLength: 2000 },
    workExperience: objectArray(
      {
        jobTitle: { type: 'string' },
        company: { type: 'string' },
        location: { type: 'string' },
        employmentType: { type: 'string' },
        startDate: { type: 'string' },
        endDate: { type: 'string' },
        currentlyWorking: { type: 'boolean' },
        description: { type: 'string', maxLength: 5000 },
        achievements: { type: 'array', maxItems: 20, items: { type: 'string', maxLength: 500 } },
      },
      ['jobTitle', 'company', 'startDate', 'currentlyWorking', 'achievements'],
    ),
    education: objectArray(
      {
        institution: { type: 'string' },
        degree: { type: 'string' },
        fieldOfStudy: { type: 'string' },
        location: { type: 'string' },
        startDate: { type: 'string' },
        endDate: { type: 'string' },
        currentlyStudying: { type: 'boolean' },
        grade: { type: 'string' },
        description: { type: 'string' },
      },
      ['institution', 'degree', 'currentlyStudying'],
    ),
    skills: objectArray(
      { name: { type: 'string' }, level: { type: 'string' }, category: { type: 'string' } },
      ['name'],
    ),
    projects: objectArray(
      {
        name: { type: 'string' },
        role: { type: 'string' },
        description: { type: 'string' },
        technologies: { type: 'array', items: { type: 'string' } },
        projectUrl: { type: 'string', format: 'uri' },
        repositoryUrl: { type: 'string', format: 'uri' },
        startDate: { type: 'string' },
        endDate: { type: 'string' },
      },
      ['name', 'technologies'],
    ),
    certifications: objectArray(
      {
        name: { type: 'string' },
        issuer: { type: 'string' },
        issueDate: { type: 'string' },
        expiryDate: { type: 'string' },
        credentialId: { type: 'string' },
        credentialUrl: { type: 'string', format: 'uri' },
      },
      ['name'],
    ),
    languages: objectArray({ name: { type: 'string' }, proficiency: { type: 'string' } }, ['name']),
    achievements: objectArray(
      { title: { type: 'string' }, description: { type: 'string' }, date: { type: 'string' } },
      ['title'],
    ),
    volunteerExperience: objectArray(
      {
        organization: { type: 'string' },
        role: { type: 'string' },
        startDate: { type: 'string' },
        endDate: { type: 'string' },
        currentlyVolunteering: { type: 'boolean' },
        description: { type: 'string' },
      },
      ['organization', 'role', 'currentlyVolunteering'],
    ),
    customSections: objectArray(
      {
        title: { type: 'string' },
        type: { enum: ['text', 'list'] },
        content: { type: 'string' },
        items: { type: 'array', items: { type: 'string' } },
      },
      ['title', 'type'],
    ),
    sectionOrder: {
      type: 'array',
      uniqueItems: true,
      items: {
        enum: [
          'personalDetails',
          'professionalSummary',
          'workExperience',
          'education',
          'skills',
          'projects',
          'certifications',
          'languages',
          'achievements',
          'volunteerExperience',
          'customSections',
        ],
      },
    },
    styling: {
      type: 'object',
      additionalProperties: false,
      properties: {
        pageSize: { enum: ['A4', 'LETTER'] },
        layout: { enum: ['single-column', 'two-column'] },
        fontFamily: { enum: ['Inter', 'Georgia', 'Arial', 'Merriweather', 'Roboto Mono'] },
        fontSize: { type: 'number', minimum: 8, maximum: 14 },
        lineHeight: { type: 'number', minimum: 1, maximum: 2 },
        sectionSpacing: { type: 'number', minimum: 4, maximum: 32 },
        primaryColor: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        secondaryColor: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        textColor: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        headingColor: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        headingSize: { type: 'number', minimum: 10, maximum: 28 },
        pageMargin: { type: 'number', minimum: 8, maximum: 35 },
        showProfileImage: { type: 'boolean' },
        showIcons: { type: 'boolean' },
        dateFormat: { enum: ['MMM YYYY', 'MM/YYYY', 'YYYY'] },
        sectionTitleStyle: { enum: ['underline', 'filled', 'plain', 'uppercase'] },
      },
    },
  },
};
const ok = {
  description: 'Success',
  content: {
    'application/json': {
      schema: { type: 'object', properties: { success: { const: true }, data: resume } },
    },
  },
};
const action = (summary: string, method: 'patch' | 'post' = 'patch') => ({
  parameters: [id],
  [method]: { summary, responses: { 200: ok, 201: ok } },
});
export const openapi = {
  openapi: '3.1.0',
  info: { title: 'ResuMind AI API', version: '0.3.0' },
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Resume: resume,
      CreateResumeRequest: {
        type: 'object',
        required: ['title'],
        additionalProperties: false,
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 160 },
          targetRole: { type: 'string', maxLength: 160 },
          targetCompany: { type: 'string', maxLength: 160 },
          templateId: { enum: templateIds },
        },
      },
      Completion: {
        type: 'object',
        properties: {
          percentage: { type: 'number' },
          completedSections: { type: 'array', items: { type: 'string' } },
          incompleteSections: { type: 'array', items: { type: 'string' } },
          recommendedNextSection: { type: ['string', 'null'] },
        },
      },
      Error: {
        type: 'object',
        required: ['success', 'error'],
        properties: {
          success: { const: false },
          error: {
            type: 'object',
            properties: { code: { type: 'string' }, message: { type: 'string' }, details: {} },
          },
          requestId: { type: 'string' },
        },
      },
      Phase4Job: {
        type: 'object',
        required: ['_id', 'status'],
        properties: {
          _id: { type: 'string' },
          status: {
            enum: [
              'queued',
              'processing',
              'review_required',
              'completed',
              'ready',
              'failed',
              'cancelled',
              'expired',
            ],
          },
          progress: { type: 'number', minimum: 0, maximum: 100 },
          currentStep: { type: 'string' },
          attempts: { type: 'integer' },
          errorCode: { type: 'string' },
          safeErrorMessage: { type: 'string' },
        },
      },
      ShareLink: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          active: { type: 'boolean' },
          expiresAt: { type: ['string', 'null'], format: 'date-time' },
          downloadAllowed: { type: 'boolean' },
          searchIndexing: { type: 'boolean' },
          viewCount: { type: 'integer' },
          downloadCount: { type: 'integer' },
        },
      },
      ResumeVersion: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          versionNumber: { type: 'integer' },
          changeSource: { type: 'string' },
          changeSummary: { type: 'string' },
          snapshot: resume,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/api/v1/templates': {
      get: {
        summary: 'List active resume templates with filters',
        security: [],
        responses: { 200: { description: 'Template registry' } },
      },
    },
    '/api/v1/templates/{templateId}': {
      get: {
        summary: 'Get active template metadata',
        security: [],
        responses: {
          200: { description: 'Template details' },
          404: { description: 'Unknown or inactive template' },
        },
      },
    },
    '/api/v1/templates/{templateId}/access': {
      get: {
        summary: 'Check current user entitlement',
        responses: { 200: { description: 'Access decision' } },
      },
    },
    '/api/v1/resumes/{resumeId}/template': {
      patch: {
        summary: 'Apply an entitled template without modifying resume content',
        parameters: [id],
        responses: {
          200: { description: 'Updated resume and template' },
          403: { description: 'PREMIUM_REQUIRED' },
        },
      },
    },
    '/api/v1/resumes/{resumeId}/template-preview': {
      post: {
        summary: 'Preview any active template with owned resume data',
        parameters: [id],
        responses: { 200: { description: 'Preview payload and access decision' } },
      },
    },
    '/api/v1/resumes': {
      get: {
        summary: 'List owned resumes',
        parameters: ['page', 'limit', 'search', 'status', 'templateId', 'sort', 'direction'].map(
          (name) => ({ name, in: 'query', schema: { type: 'string' } }),
        ),
        responses: { 200: { description: 'Paginated resumes' } },
      },
      post: {
        summary: 'Create resume',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'templateId'],
                properties: {
                  title: { type: 'string' },
                  targetRole: { type: 'string' },
                  targetCompany: { type: 'string' },
                  templateId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: ok },
      },
    },
    '/api/v1/resumes/{resumeId}': {
      parameters: [id],
      get: { summary: 'Read owned resume', responses: { 200: ok } },
      patch: {
        summary: 'Manual update and version',
        requestBody: { content: { 'application/json': { schema: resume } } },
        responses: { 200: ok },
      },
      delete: { summary: 'Soft delete resume', responses: { 204: { description: 'Deleted' } } },
    },
    '/api/v1/resumes/{resumeId}/duplicate': action('Duplicate resume', 'post'),
    '/api/v1/resumes/{resumeId}/archive': action('Archive resume'),
    '/api/v1/resumes/{resumeId}/restore': action('Restore resume'),
    '/api/v1/resumes/{resumeId}/autosave': action('Autosave controlled fields'),
    '/api/v1/resumes/{resumeId}/sections/reorder': action('Reorder sections'),
    '/api/v1/resumes/{resumeId}/completion': {
      get: {
        summary: 'Calculate completion',
        parameters: [id],
        responses: { 200: { description: 'Completion breakdown' } },
      },
    },
    '/api/v1/ats/resumes/{resumeId}/analyze': {
      post: {
        summary: 'Run deterministic or enhanced ATS analysis',
        parameters: [id],
        responses: {
          201: { description: 'Explainable ATS analysis' },
          429: { description: 'Rate limit exceeded' },
        },
      },
    },
    '/api/v1/ats/resumes/{resumeId}/latest': {
      get: {
        summary: 'Latest owned ATS analysis',
        parameters: [id],
        responses: { 200: { description: 'ATS analysis' } },
      },
    },
    '/api/v1/ats/resumes/{resumeId}/history': {
      get: {
        summary: 'Paginated ATS history',
        parameters: [id],
        responses: { 200: { description: 'Analysis history' } },
      },
    },
    '/api/v1/ats/suggestions/{suggestionId}/apply': {
      post: {
        summary: 'Safely apply a pending suggestion',
        responses: {
          200: { description: 'Updated resume section' },
          409: { description: 'Stale or already reviewed' },
        },
      },
    },
    '/api/v1/ats/suggestions/{suggestionId}/reject': {
      post: {
        summary: 'Reject a pending suggestion',
        responses: { 200: { description: 'Rejected suggestion' } },
      },
    },
    '/api/v1/job-matching/resumes/{resumeId}/analyze': {
      post: {
        summary: 'Analyze resume against a job description',
        parameters: [id],
        responses: { 201: { description: 'Keyword and qualification match' } },
      },
    },
    '/api/v1/ai/resumes/{resumeId}/summary/generate': {
      post: {
        summary: 'Generate a reviewable summary suggestion',
        parameters: [id],
        responses: {
          200: { description: 'Validated suggestion and credit balance' },
          402: { description: 'Insufficient credits' },
          429: { description: 'Rate limited' },
          502: { description: 'Provider failure' },
        },
      },
    },
    '/api/v1/resume-imports': {
      post: {
        summary: 'Upload and parse PDF or DOCX for review',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary',
                    description: 'PDF or DOCX; maximum configured IMPORT_MAX_FILE_BYTES',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Review-required import job' },
          415: { description: 'Unsupported type, signature mismatch, or malware' },
          422: { description: 'Scanned or empty document' },
          429: { description: 'Rate limited' },
        },
      },
    },
    '/api/v1/resume-imports/{importId}': {
      parameters: [{ name: 'importId', in: 'path', required: true, schema: { type: 'string' } }],
      get: {
        summary: 'Get owned import status and review data',
        responses: { 200: { description: 'Import job' } },
      },
      patch: {
        summary: 'Update all reviewed resume sections',
        requestBody: { content: { 'application/json': { schema: resume } } },
        responses: { 200: { description: 'Updated review' } },
      },
      delete: {
        summary: 'Cancel import and clear extracted text',
        responses: { 204: { description: 'Cancelled' } },
      },
    },
    '/api/v1/resume-imports/{importId}/confirm': {
      post: {
        summary: 'Idempotently create one resume from reviewed import',
        parameters: [{ name: 'importId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          201: { description: 'Resume created' },
          200: { description: 'Previously created resume returned' },
        },
      },
    },
    '/api/v1/resumes/{resumeId}/exports/{format}': {
      post: {
        summary: 'Create an idempotent PDF or DOCX export',
        parameters: [
          id,
          { name: 'format', in: 'path', required: true, schema: { enum: ['pdf', 'docx'] } },
          {
            name: 'Idempotency-Key',
            in: 'header',
            required: false,
            schema: { type: 'string', maxLength: 200 },
          },
        ],
        responses: {
          201: { description: 'Export job' },
          200: { description: 'Existing idempotent job' },
          402: { description: 'Premium template entitlement required' },
          409: { description: 'Idempotency key conflicts with settings' },
          429: { description: 'Rate limited' },
        },
      },
    },
    '/api/v1/resumes/{resumeId}/exports/{exportId}': {
      get: {
        summary: 'Get owned export status or download completed output',
        parameters: [
          id,
          { name: 'exportId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'download', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: {
          200: { description: 'Job status or document file' },
          404: { description: 'Not found or not owned' },
        },
      },
    },
    '/api/v1/resumes/{resumeId}/versions': {
      get: {
        summary: 'List owned resume versions',
        parameters: [id],
        responses: { 200: { description: 'Version list' } },
      },
    },
    '/api/v1/resumes/{resumeId}/versions/{versionId}': {
      get: {
        summary: 'Get owned version snapshot',
        parameters: [
          id,
          { name: 'versionId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Version' } },
      },
    },
    '/api/v1/resumes/{resumeId}/versions/{versionId}/restore': {
      post: {
        summary: 'Restore version after creating a safety snapshot',
        parameters: [
          id,
          { name: 'versionId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Restored resume' } },
      },
    },
    '/api/v1/resumes/{resumeId}/share-links': {
      get: {
        summary: 'List owned share links',
        parameters: [id],
        responses: { 200: { description: 'Share links without token hashes or passwords' } },
      },
      post: {
        summary: 'Create confirmed private share link',
        parameters: [id],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['confirmed'],
                properties: {
                  confirmed: { const: true },
                  password: { type: 'string', minLength: 8, maxLength: 100 },
                  expiresAt: { type: 'string', format: 'date-time' },
                  downloadAllowed: { type: 'boolean' },
                  searchIndexing: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'One-time plaintext token and safe link metadata' } },
      },
    },
    '/api/v1/resumes/{resumeId}/share-links/{linkId}': {
      patch: {
        summary: 'Update and revoke existing unlock credentials',
        parameters: [
          id,
          { name: 'linkId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Updated share' } },
      },
      delete: {
        summary: 'Revoke share link',
        parameters: [
          id,
          { name: 'linkId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { 204: { description: 'Revoked' } },
      },
    },
    '/api/v1/public/resumes/{token}': {
      get: {
        summary: 'View a public resume with deduplicated analytics',
        security: [],
        parameters: [{ name: 'token', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Public resume' },
          401: { description: 'Password required' },
          410: { description: 'Expired or revoked' },
        },
      },
    },
    '/api/v1/public/resumes/{token}/unlock': {
      post: {
        summary: 'Issue short-lived HttpOnly download unlock credential',
        security: [],
        responses: {
          200: { description: 'Unlocked public resume' },
          401: { description: 'Generic invalid credential' },
          429: { description: 'Password attempt rate limited' },
        },
      },
    },
    '/api/v1/public/resumes/{token}/download': {
      get: {
        summary: 'Download public PDF after permission and unlock checks',
        security: [],
        responses: {
          200: { description: 'PDF' },
          401: { description: 'Unlock required' },
          403: { description: 'Download disabled' },
          410: { description: 'Expired or revoked' },
        },
      },
    },
  },
};
