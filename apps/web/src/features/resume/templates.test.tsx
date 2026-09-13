import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Resume } from '@resumind/shared';
import { ResumeDocument } from './templates';
afterEach(cleanup);
const resume = {
  _id: '1',
  title: 'Test',
  status: 'draft',
  templateId: 'modern',
  completionPercentage: 0,
  personalDetails: { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' },
  workExperience: [],
  education: [],
  skills: [{ id: crypto.randomUUID(), name: 'TypeScript', visible: true, order: 0 }],
  projects: [],
  certifications: [],
  languages: [],
  achievements: [],
  volunteerExperience: [],
  customSections: [],
  sectionOrder: [],
  styling: {
    pageSize: 'A4',
    layout: 'single-column',
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 1.45,
    sectionSpacing: 14,
    primaryColor: '#4f46e5',
    textColor: '#0f172a',
    pageMargin: 18,
    showProfileImage: false,
    secondaryColor: '#e0e7ff',
    headingColor: '#0f172a',
    headingSize: 14,
    showIcons: true,
    dateFormat: 'MMM YYYY',
    sectionTitleStyle: 'underline',
  },
  createdAt: '',
  updatedAt: '',
} as Resume;
describe('ResumeDocument', () => {
  it('renders normalized data as selectable text', () => {
    render(<ResumeDocument resume={resume} />);
    expect(screen.getByText(/Ada Lovelace/)).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });

  it('honors persisted top-level section ordering', () => {
    render(<ResumeDocument resume={{ ...resume, sectionOrder: ['skills', 'personalDetails'] }} />);
    expect(screen.getByRole('heading', { name: 'Skills' }).closest('section')).toHaveStyle({
      order: 0,
    });
    expect(screen.getByRole('heading', { name: 'Ada Lovelace' }).closest('header')).toHaveStyle({
      order: 1,
    });
  });
});
