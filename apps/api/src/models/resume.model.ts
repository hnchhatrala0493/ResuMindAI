import { Schema, model, Types } from 'mongoose';
const personal = new Schema(
  {
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    professionalTitle: String,
    email: { type: String, default: '' },
    phone: String,
    country: String,
    state: String,
    city: String,
    postalCode: String,
    address: String,
    linkedIn: String,
    github: String,
    portfolio: String,
    website: String,
    profileImage: String,
  },
  { _id: false },
);
const styling = new Schema(
  {
    pageSize: { type: String, enum: ['A4', 'LETTER'], default: 'A4' },
    layout: { type: String, enum: ['single-column', 'two-column'], default: 'single-column' },
    fontFamily: { type: String, default: 'Inter' },
    fontSize: { type: Number, default: 10 },
    lineHeight: { type: Number, default: 1.45 },
    sectionSpacing: { type: Number, default: 14 },
    primaryColor: { type: String, default: '#4f46e5' },
    textColor: { type: String, default: '#0f172a' },
    pageMargin: { type: Number, default: 18 },
    showProfileImage: { type: Boolean, default: false },
    secondaryColor: { type: String, default: '#e0e7ff' },
    headingColor: { type: String, default: '#0f172a' },
    headingSize: { type: Number, default: 14 },
    showIcons: { type: Boolean, default: true },
    dateFormat: { type: String, enum: ['MMM YYYY', 'MM/YYYY', 'YYYY'], default: 'MMM YYYY' },
    sectionTitleStyle: {
      type: String,
      enum: ['underline', 'filled', 'plain', 'uppercase'],
      default: 'underline',
    },
  },
  { _id: false },
);
export interface ResumeDocument {
  userId: Types.ObjectId;
  title: string;
  targetRole?: string;
  targetCompany?: string;
  status: 'draft' | 'active' | 'archived';
  templateId: string;
  completionPercentage: number;
  personalDetails: Record<string, unknown>;
  professionalSummary?: string;
  workExperience: unknown[];
  education: unknown[];
  skills: unknown[];
  projects: unknown[];
  certifications: unknown[];
  languages: unknown[];
  achievements: unknown[];
  volunteerExperience: unknown[];
  customSections: unknown[];
  sectionOrder: string[];
  styling: Record<string, unknown>;
  lastSavedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
const schema = new Schema<ResumeDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, maxlength: 160 },
    targetRole: String,
    targetCompany: String,
    status: { type: String, enum: ['draft', 'active', 'archived'], default: 'draft', index: true },
    templateId: { type: String, required: true, default: 'modern-classic', index: true },
    completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
    personalDetails: { type: personal, default: () => ({}) },
    professionalSummary: String,
    workExperience: { type: [Schema.Types.Mixed], default: [] },
    education: { type: [Schema.Types.Mixed], default: [] },
    skills: { type: [Schema.Types.Mixed], default: [] },
    projects: { type: [Schema.Types.Mixed], default: [] },
    certifications: { type: [Schema.Types.Mixed], default: [] },
    languages: { type: [Schema.Types.Mixed], default: [] },
    achievements: { type: [Schema.Types.Mixed], default: [] },
    volunteerExperience: { type: [Schema.Types.Mixed], default: [] },
    customSections: { type: [Schema.Types.Mixed], default: [] },
    sectionOrder: {
      type: [String],
      default: [
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
    styling: { type: styling, default: () => ({}) },
    lastSavedAt: Date,
    deletedAt: { type: Date, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_d, r) => {
        delete (r as Record<string, unknown>).__v;
        return r;
      },
    },
  },
);
schema.index({ userId: 1, deletedAt: 1, status: 1, updatedAt: -1 });
schema.index({ userId: 1, title: 1 });
export const ResumeModel = model<ResumeDocument>('Resume', schema);
