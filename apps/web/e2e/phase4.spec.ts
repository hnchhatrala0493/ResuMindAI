import { expect, test } from '@playwright/test';
import { Document, Packer, Paragraph } from 'docx';
import { readFile } from 'node:fs/promises';

test('Phase 4 import, durable PDF, versions, secure sharing, and responsive states', async ({
  page,
  request,
  context,
}) => {
  const email = `phase4-${Date.now()}@e2e.test`,
    password = 'Phase4@Test123';
  const registered = await request.post('http://localhost:5000/api/v1/auth/register', {
    data: { name: 'Phase Four', email, password },
  });
  expect(registered.status()).toBe(201);
  const accessToken = (await registered.json()).data.accessToken as string;
  await page.goto('/login');
  await page.getByLabel('Email address').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/dashboard/);
  const fixture = await Packer.toBuffer(
    new Document({
      sections: [
        {
          children: [
            new Paragraph('Ada Lovelace'),
            new Paragraph(email),
            new Paragraph('SUMMARY'),
            new Paragraph('Reliable engineer focused on accessible systems.'),
            new Paragraph('EXPERIENCE'),
            new Paragraph('Senior Engineer at Analytical Engines'),
            new Paragraph('EDUCATION'),
            new Paragraph('University of London'),
            new Paragraph('SKILLS'),
            new Paragraph('TypeScript, React, Node.js'),
            new Paragraph('PROJECTS'),
            new Paragraph('ResuMind AI'),
          ],
        },
      ],
    }),
  );
  await page.getByRole('link',{name:/Create new resume/i}).click();await page.getByRole('link',{name:'Import PDF/DOCX'}).click();
  await page
    .locator('input[type=file]')
    .setInputFiles({
      name: 'phase4.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: fixture,
    });
  await expect(page.getByRole('heading', { name: 'Review parsed data' })).toBeVisible({
    timeout: 30000,
  });
  for (const section of [
    'work Experience',
    'education',
    'skills',
    'projects',
    'certifications',
    'languages',
    'achievements',
    'volunteer Experience',
    'custom Sections',
  ])
    await expect(page.getByRole('heading', { name: new RegExp(section, 'i') })).toBeVisible();
  await page.getByLabel('First name').fill('Grace');
  await page.getByRole('button', { name: 'Confirm and Create Resume' }).click();
  await expect(page).toHaveURL(/\/dashboard\/resumes\/[^/]+\/edit/, { timeout: 30000 });
  const resumeId = page.url().match(/resumes\/([^/]+)/)![1];
  const versions = await request.get(`http://localhost:5000/api/v1/resumes/${resumeId}/versions`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  expect(versions.status()).toBe(200);
  expect((await versions.json()).data.length).toBeGreaterThan(0);
  await page.getByRole('link',{name:'Download & History'}).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Generate PDF' }).click();
  const download = await downloadPromise;
  const saved = await download.path();
  expect(saved).toBeTruthy();
  expect((await readFile(saved!)).subarray(0, 5).toString()).toBe('%PDF-');
  const shareResponse = await request.post(
    `http://localhost:5000/api/v1/resumes/${resumeId}/share-links`,
    {
      headers: { authorization: `Bearer ${accessToken}`, origin: 'http://localhost:5173' },
      data: {
        confirmed: true,
        password: 'Shared@Test123',
        downloadAllowed: true,
        searchIndexing: false,
      },
    },
  );
  expect(shareResponse.status()).toBe(201);
  const share = await shareResponse.json();
  const token = share.data.token as string;
  await context.clearCookies();
  await page.goto(`/r/${token}`);
  await expect(page.getByRole('heading', { name: 'Protected resume' })).toBeVisible();
  await page.getByLabel('Password').fill('incorrect');
  await page.getByRole('button', { name: 'View resume' }).click();
  await expect(page.getByRole('alert')).toContainText('Incorrect password');
  await page.getByLabel('Password').fill('Shared@Test123');
  await page.getByRole('button', { name: 'View resume' }).click();
  await expect(page.locator('.resume-paper')).toBeVisible();
  for (const viewport of [
    { width: 375, height: 667 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1280, height: 800 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(page.locator('body')).toHaveJSProperty(
      'scrollWidth',
      await page.locator('body').evaluate((e) => e.clientWidth),
    );
    await page.screenshot({
      path: `playwright-artifacts/phase4-public-${viewport.width}x${viewport.height}.png`,
      fullPage: true,
    });
  }
  await request.delete(
    `http://localhost:5000/api/v1/resumes/${resumeId}/share-links/${share.data._id}`,
    { headers: { authorization: `Bearer ${accessToken}`, origin: 'http://localhost:5173' } },
  );
  await context.clearCookies();
  await page.goto(`/r/${token}`);
  await expect(page.getByRole('heading', { name: 'Resume unavailable' })).toBeVisible();
});
