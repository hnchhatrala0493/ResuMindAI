import { describe, expect, it } from 'vitest';
import { concepts, hasMeasurement, scoreResume } from './ats-scoring.service.js';
const resume = {
  personalDetails: { firstName: 'A', lastName: 'B', email: 'a@b.com' },
  professionalSummary:
    'Software engineer specializing in React and TypeScript applications with accessible user experiences.',
  workExperience: [
    {
      jobTitle: 'Engineer',
      company: 'Co',
      startDate: '2020',
      achievements: ['Increased performance by 30% for 10,000 users'],
    },
  ],
  education: [],
  skills: [{ name: 'React.js' }, { name: 'TS' }],
  projects: [],
  certifications: [],
  styling: { fontSize: 10, pageMargin: 18, layout: 'single-column' },
};
describe('ATS v1', () => {
  it('is deterministic and bounded', () => {
    const a = scoreResume(resume, 'React and JavaScript');
    expect(a).toEqual(scoreResume(resume, 'React and JavaScript'));
    expect(a.overallScore).toBeGreaterThanOrEqual(0);
    expect(a.overallScore).toBeLessThanOrEqual(100);
    expect(a.categories.reduce((n, c) => n + c.maxScore, 0)).toBe(100);
  });
  it('normalizes aliases and measurements', () => {
    expect(concepts('React.js and JS')).toContain('react');
    expect(hasMeasurement('Reduced latency by 30%')).toBe(true);
    expect(hasMeasurement('Worked on version 2')).toBe(false);
  });
});
