import { expect, test } from '@playwright/test';
const email = 'test@example.com',
  password = 'Test@Resume123';
const resumeTitle = `Playwright QA ${Date.now()}`;
async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/dashboard/);
}
test('complete resume builder lifecycle', async ({ page }) => {
  page.on('response', async (response) => {
    if (response.url().includes('/autosave') && !response.ok())
      console.log('AUTOSAVE_ERROR', response.status(), await response.text());
  });
  await login(page);
  await page.getByRole('link', { name: /Create new resume/i }).click();
  await expect(page).toHaveURL(/dashboard\/resumes$/);
  await page.getByRole('button', { name: /Create resume/i }).click();
  await page.getByPlaceholder('Resume title').fill(resumeTitle);
  await page.getByPlaceholder('Target role').fill('Senior Engineer');
  await page.getByRole('button', { name: 'Start from blank' }).click();
  await expect(page).toHaveURL(/\/edit/);
  await page.getByLabel('First name').fill('Playwright');
  await page.getByLabel('Last name').fill('Tester');
  await page.getByLabel('Email').fill(email);
  await page
    .getByRole('combobox')
    .filter({ has: page.locator('option') })
    .first();
  await page.getByRole('button', { name: 'Professional Summary' }).click();
  await page
    .getByLabel('Summary')
    .fill(
      'Experienced engineer delivering measurable, accessible and reliable products for global customers.',
    );
  const addSection = async (section: string, values: Record<string, string>) => {
    await page.getByRole('button', { name: section, exact: true }).click();
    await page.getByRole('button', { name: 'Add entry' }).click();
    for (const [field, value] of Object.entries(values))
      await page.getByLabel(field, { exact: true }).fill(value);
  };
  await addSection('Work Experience', {
    'Job title': 'Senior Engineer',
    Company: 'Example Labs',
    'Start date': '2022-01',
    Description: 'Built accessible products.',
    'Achievements (one per line)': 'Improved reliability by 25%.',
  });
  await addSection('Education', {
    Institution: 'Example University',
    Degree: 'BSc Computer Science',
  });
  await addSection('Skills', { Skill: 'TypeScript', Category: 'Engineering' });
  await addSection('Projects', {
    'Project name': 'ResuMind',
    Role: 'Lead developer',
    'Technologies (one per line)': 'React\nNode.js',
    Description: 'Created a resume platform.',
  });
  await addSection('Certifications', {
    Certification: 'Cloud Fundamentals',
    Issuer: 'Example Institute',
  });
  await addSection('Languages', { Language: 'English' });
  await addSection('Achievements', {
    Title: 'Engineering Award',
    Description: 'Recognized for product quality.',
  });
  await addSection('Volunteer Experience', { Organization: 'Community Lab', Role: 'Mentor' });
  await addSection('Custom Sections', {
    'Section title': 'Publications',
    'Text content': 'Accessible systems handbook.',
  });
  await page.getByRole('button', { name: 'Skills', exact: true }).click();
  await page.getByRole('button', { name: 'Add entry' }).click();
  await page.getByLabel('Skill', { exact: true }).last().fill('React');
  await page.getByLabel('Move up').last().click();
  await expect(page.locator('header [role="status"]')).toContainText(/Unsaved|Saving/, {
    timeout: 3000,
  });
  await expect(page.locator('header [role="status"]')).toContainText(/Saved/, { timeout: 10000 });
  await page.getByLabel('Back to dashboard').click();
  await page.getByRole('link', { name: /Create new resume/i }).click();
  await page
    .locator('article')
    .filter({ hasText: resumeTitle })
    .getByRole('link', { name: 'Edit' })
    .click();
  await expect(page.locator('header input')).toHaveValue(resumeTitle);
  await expect(page.getByLabel('First name')).toHaveValue('Playwright');
  await page.locator('select').filter({ hasText: 'Modern' }).first().selectOption('technical');
  await expect(page.locator('header [role="status"]')).toContainText(/Unsaved|Saving/, {
    timeout: 3000,
  });
  await expect(page.locator('header [role="status"]')).toContainText(/Saved/, { timeout: 10000 });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Resume preview' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close preview' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Resume preview' })).toBeHidden();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.getByRole('link', { name: 'Templates', exact: true }).click({ force: true });
  await expect(page.getByRole('heading', { name: 'Resume Templates' })).toBeVisible();
  await page
    .locator('article')
    .filter({ hasText: 'Professional' })
    .getByRole('link', { name: 'Preview', exact: true })
    .click();
  await expect(page.getByLabel('Professional full-screen preview')).toContainText('Playwright');
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await page.getByRole('button', { name: 'Apply Template' }).click();
  await expect(page).toHaveURL(/\/edit$/);
  await page.mouse.move(10, 400);
  await expect(page.getByText('Professional applied')).toBeHidden({ timeout: 10000 });
  await page.getByRole('link', { name: 'Templates', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Resume Templates' })).toBeVisible();
  await page
    .locator('article')
    .filter({ hasText: 'Developer Pro' })
    .getByRole('link', { name: 'Preview', exact: true })
    .click();
  await expect(page.getByLabel('Developer Pro full-screen preview')).toContainText(
    'Premium Preview',
  );
  await expect(page.getByRole('button', { name: 'Upgrade to Pro' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Apply Template' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Close preview' }).click();
  await page.getByRole('link', { name: /Back to builder/ }).click();
  await expect(page.locator('header input')).toHaveValue(resumeTitle);
  await page.getByLabel('Back to dashboard').click();
  await page.getByRole('link', { name: /Create new resume/i }).click();
  const card = page.locator('article').filter({ hasText: resumeTitle });
  await card.getByLabel('Duplicate').click();
  await expect(page.locator('article').filter({ hasText: `${resumeTitle} Copy` })).toBeVisible();
  const copy = page.locator('article').filter({ hasText: `${resumeTitle} Copy` });
  await copy.getByLabel('Archive').click();
  await page.locator('select').filter({ hasText: 'Archived' }).selectOption('archived');
  await expect(page.locator('article').filter({ hasText: `${resumeTitle} Copy` })).toBeVisible();
  await page
    .locator('article')
    .filter({ hasText: `${resumeTitle} Copy` })
    .getByLabel('Restore')
    .click();
  await page.locator('select').filter({ hasText: 'All active' }).selectOption('');
  const exactCard = (title: string) =>
    page
      .locator('article')
      .filter({ has: page.getByRole('heading', { name: title, exact: true }) });
  page.once('dialog', (d) => d.accept());
  await exactCard(resumeTitle).getByLabel('Delete').click();
  page.once('dialog', (d) => d.accept());
  await exactCard(`${resumeTitle} Copy`).getByLabel('Delete').click();
});
test('template gallery responsive grid and full preview', async ({ page }, info) => {
  await login(page);
  await page.getByRole('link', { name: /Create new resume/i }).click();
  const templatesLink = page.getByRole('link', { name: 'Templates' }).first();
  await expect(templatesLink).toBeVisible();
  await templatesLink.click();
  await expect(page.getByRole('heading', { name: 'Resume Templates' })).toBeVisible();
  for (const [name, width, height] of [
    ['375x667', 375, 667],
    ['390x844', 390, 844],
    ['768x1024', 768, 1024],
    ['1024x768', 1024, 768],
    ['1280x800', 1280, 800],
    ['1440x900', 1440, 900],
    ['1920x1080', 1920, 1080],
  ] as const) {
    await page.setViewportSize({ width, height });
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
    if (width === 1440) {
      const boxes = await page
        .locator('.template-card')
        .evaluateAll((cards) =>
          cards.slice(0, 4).map((card) => Math.round(card.getBoundingClientRect().top)),
        );
      expect(Math.max(...boxes) - Math.min(...boxes)).toBeLessThanOrEqual(4);
    }
    await page.screenshot({
      path: info.outputPath(`template-gallery-${name}.png`),
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator('article').first().getByRole('link', { name: 'Preview', exact: true }).click();
  await expect(page.locator('.resume-paper')).toBeVisible();
  await page.screenshot({ path: info.outputPath('template-preview-1440x900.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: info.outputPath('template-preview-390x844.png'), fullPage: true });
});
for (const [name, width, height] of [
  ['375x667', 375, 667],
  ['390x844', 390, 844],
  ['768x1024', 768, 1024],
  ['1024x768', 1024, 768],
  ['1280x800', 1280, 800],
  ['1440x900', 1440, 900],
  ['1920x1080', 1920, 1080],
] as const)
  test(`responsive screenshots ${name}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Build a Resume That/i })).toBeVisible();
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
    await page.screenshot({ path: info.outputPath(`landing-${name}.png`), fullPage: true });
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Sign in to ResuMind/i })).toBeVisible();
    await page.screenshot({ path: info.outputPath(`login-${name}.png`), fullPage: true });
  });
