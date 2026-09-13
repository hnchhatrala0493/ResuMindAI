import { describe, expect, it } from 'vitest';
import { completion } from './resume.service.js';
describe('resume completion', () => {
  it('weights meaningful sections', () => {
    const result = completion({
      personalDetails: { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' },
      professionalSummary: 'A'.repeat(100),
      workExperience: [{ jobTitle: 'Engineer' }],
      education: [{ degree: 'BSc' }],
      skills: [1, 2, 3],
      projects: [1],
    });
    expect(result.percentage).toBe(90);
    expect(result.recommendedNextSection).toBe('certifications');
  });
  it('does not award empty content', () =>
    expect(completion({ personalDetails: {}, skills: [] }).percentage).toBe(0));
});
