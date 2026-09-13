import { z } from 'zod';
const text = z.string().trim().max(5000);
const short = z.string().trim().max(160);
const url = z.union([z.literal(''), z.url()]);
const itemBase = {
  id: z.uuid(),
  visible: z.boolean().default(true),
  order: z.number().int().min(0),
};
export const personalDetailsSchema = z.object({
  firstName: short.default(''),
  lastName: short.default(''),
  professionalTitle: short.optional(),
  email: z.union([z.literal(''), z.email()]).default(''),
  phone: short.optional(),
  country: short.optional(),
  state: short.optional(),
  city: short.optional(),
  postalCode: short.optional(),
  address: text.optional(),
  linkedIn: url.optional(),
  github: url.optional(),
  portfolio: url.optional(),
  website: url.optional(),
  profileImage: url.optional(),
});
const work = z.object({
  ...itemBase,
  jobTitle: short,
  company: short,
  location: short.optional(),
  employmentType: short.optional(),
  startDate: short,
  endDate: short.optional(),
  currentlyWorking: z.boolean(),
  description: text.optional(),
  achievements: z.array(text.max(500)).max(20),
});
const education = z.object({
  ...itemBase,
  institution: short,
  degree: short,
  fieldOfStudy: short.optional(),
  location: short.optional(),
  startDate: short.optional(),
  endDate: short.optional(),
  currentlyStudying: z.boolean(),
  grade: short.optional(),
  description: text.optional(),
});
const skill = z.object({
  ...itemBase,
  name: short,
  level: short.optional(),
  category: short.optional(),
});
const project = z.object({
  ...itemBase,
  name: short,
  role: short.optional(),
  description: text.optional(),
  technologies: z.array(short).max(30),
  projectUrl: url.optional(),
  repositoryUrl: url.optional(),
  startDate: short.optional(),
  endDate: short.optional(),
});
const certification = z.object({
  ...itemBase,
  name: short,
  issuer: short.optional(),
  issueDate: short.optional(),
  expiryDate: short.optional(),
  credentialId: short.optional(),
  credentialUrl: url.optional(),
});
const language = z.object({ ...itemBase, name: short, proficiency: short.optional() });
const achievement = z.object({
  ...itemBase,
  title: short,
  description: text.optional(),
  date: short.optional(),
});
const volunteer = z.object({
  ...itemBase,
  organization: short,
  role: short,
  startDate: short.optional(),
  endDate: short.optional(),
  currentlyVolunteering: z.boolean(),
  description: text.optional(),
});
const custom = z.object({
  ...itemBase,
  title: short,
  type: z.enum(['text', 'list']),
  content: text.optional(),
  items: z.array(text.max(500)).max(50).optional(),
});
export const stylingSchema = z.object({
  pageSize: z.enum(['A4', 'LETTER']).default('A4'),
  layout: z.enum(['single-column', 'two-column']).default('single-column'),
  fontFamily: z.enum(['Inter', 'Georgia', 'Arial', 'Merriweather', 'Roboto Mono']).default('Inter'),
  fontSize: z.number().min(8).max(14).default(10),
  lineHeight: z.number().min(1).max(2).default(1.45),
  sectionSpacing: z.number().min(4).max(32).default(14),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default('#4f46e5'),
  textColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default('#0f172a'),
  pageMargin: z.number().min(8).max(35).default(18),
  showProfileImage: z.boolean().default(false),
  secondaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default('#e0e7ff'),
  headingColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default('#0f172a'),
  headingSize: z.number().min(10).max(28).default(14),
  showIcons: z.boolean().default(true),
  dateFormat: z.enum(['MMM YYYY', 'MM/YYYY', 'YYYY']).default('MMM YYYY'),
  sectionTitleStyle: z.enum(['underline', 'filled', 'plain', 'uppercase']).default('underline'),
});
export const templateIds = [
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
] as const;
export const templateIdSchema = z.enum(templateIds);
export const sectionKeys = [
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
] as const;
export const resumeContentSchema = z.object({
  title: short.min(1),
  targetRole: short.optional(),
  targetCompany: short.optional(),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  templateId: templateIdSchema.default('modern-classic'),
  personalDetails: personalDetailsSchema,
  professionalSummary: text.max(2000).optional(),
  workExperience: z.array(work).max(50),
  education: z.array(education).max(30),
  skills: z.array(skill).max(100),
  projects: z.array(project).max(50),
  certifications: z.array(certification).max(50),
  languages: z.array(language).max(30),
  achievements: z.array(achievement).max(50),
  volunteerExperience: z.array(volunteer).max(30),
  customSections: z.array(custom).max(20),
  sectionOrder: z.array(z.enum(sectionKeys)),
  styling: stylingSchema,
});
export const createResumeSchema = z.object({
  title: short.min(1),
  targetRole: short.optional(),
  targetCompany: short.optional(),
  templateId: templateIdSchema.default('modern-classic'),
});
export const updateResumeSchema = resumeContentSchema.partial().omit({ status: true });
export const applyTemplateSchema = z.object({
  templateId: templateIdSchema,
  styling: stylingSchema.partial().optional(),
});
export const listResumesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  search: z.string().max(100).optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  templateId: z.string().optional(),
  sort: z.enum(['createdAt', 'updatedAt', 'title']).default('updatedAt'),
  direction: z.enum(['asc', 'desc']).default('desc'),
});
export type ResumeContent = z.infer<typeof resumeContentSchema>;
export type Resume = z.infer<typeof resumeContentSchema> & {
  _id: string;
  completionPercentage: number;
  lastSavedAt?: string;
  createdAt: string;
  updatedAt: string;
};
