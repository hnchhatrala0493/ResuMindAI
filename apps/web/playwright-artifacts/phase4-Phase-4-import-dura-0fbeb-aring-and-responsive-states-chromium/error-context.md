# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase4.spec.ts >> Phase 4 import, durable PDF, versions, secure sharing, and responsive states
- Location: e2e\phase4.spec.ts:5:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Review parsed data' })
Expected: visible
Timeout: 30000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'Review parsed data' }) with timeout 30000ms
  - waiting for getByRole('heading', { name: 'Review parsed data' })

```

```yaml
- heading "Unexpected Application Error!" [level=2]
- heading "Cannot convert undefined or null to object" [level=3]
- text: "TypeError: Cannot convert undefined or null to object at Object.entries (<anonymous>) at ResumeImport (http://localhost:5173/src/pages/resume-import.tsx?t=1789304616360:163:16) at Object.react_stack_bottom_frame (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=e9ef1202:20259:20) at renderWithHooks (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=e9ef1202:5918:24) at updateFunctionComponent (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=e9ef1202:7763:21) at beginWork (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=e9ef1202:8843:20) at runWithFiberInDEV (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=e9ef1202:1133:72) at performUnitOfWork (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=e9ef1202:13598:98) at workLoopSync (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=e9ef1202:13461:43) at renderRootSync (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=e9ef1202:13445:13)"
- paragraph: 💿 Hey developer 👋
- paragraph:
  - text: You can provide a way better UX than this when your app throws errors by providing your own
  - code: ErrorBoundary
  - text: or
  - code: errorElement
  - text: prop on your route.
- region "Notifications alt+T"
```

# Test source

```ts
  1   | import { expect, test } from '@playwright/test';
  2   | import { Document, Packer, Paragraph } from 'docx';
  3   | import { readFile } from 'node:fs/promises';
  4   | 
  5   | test('Phase 4 import, durable PDF, versions, secure sharing, and responsive states', async ({
  6   |   page,
  7   |   request,
  8   |   context,
  9   | }) => {
  10  |   const email = `phase4-${Date.now()}@e2e.test`,
  11  |     password = 'Phase4@Test123';
  12  |   const registered = await request.post('http://localhost:5000/api/v1/auth/register', {
  13  |     data: { name: 'Phase Four', email, password },
  14  |   });
  15  |   expect(registered.status()).toBe(201);
  16  |   const accessToken = (await registered.json()).data.accessToken as string;
  17  |   await page.goto('/login');
  18  |   await page.getByLabel('Email address').fill(email);
  19  |   await page.locator('input[name="password"]').fill(password);
  20  |   await page.getByRole('button', { name: 'Sign in' }).click();
  21  |   await expect(page).toHaveURL(/dashboard/);
  22  |   const fixture = await Packer.toBuffer(
  23  |     new Document({
  24  |       sections: [
  25  |         {
  26  |           children: [
  27  |             new Paragraph('Ada Lovelace'),
  28  |             new Paragraph(email),
  29  |             new Paragraph('SUMMARY'),
  30  |             new Paragraph('Reliable engineer focused on accessible systems.'),
  31  |             new Paragraph('EXPERIENCE'),
  32  |             new Paragraph('Senior Engineer at Analytical Engines'),
  33  |             new Paragraph('EDUCATION'),
  34  |             new Paragraph('University of London'),
  35  |             new Paragraph('SKILLS'),
  36  |             new Paragraph('TypeScript, React, Node.js'),
  37  |             new Paragraph('PROJECTS'),
  38  |             new Paragraph('ResuMind AI'),
  39  |           ],
  40  |         },
  41  |       ],
  42  |     }),
  43  |   );
  44  |   await page.getByRole('link',{name:/Create new resume/i}).click();await page.getByRole('link',{name:'Import PDF/DOCX'}).click();
  45  |   await page
  46  |     .locator('input[type=file]')
  47  |     .setInputFiles({
  48  |       name: 'phase4.docx',
  49  |       mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  50  |       buffer: fixture,
  51  |     });
> 52  |   await expect(page.getByRole('heading', { name: 'Review parsed data' })).toBeVisible({
      |                                                                           ^ Error: expect(locator).toBeVisible() failed
  53  |     timeout: 30000,
  54  |   });
  55  |   for (const section of [
  56  |     'work Experience',
  57  |     'education',
  58  |     'skills',
  59  |     'projects',
  60  |     'certifications',
  61  |     'languages',
  62  |     'achievements',
  63  |     'volunteer Experience',
  64  |     'custom Sections',
  65  |   ])
  66  |     await expect(page.getByRole('heading', { name: new RegExp(section, 'i') })).toBeVisible();
  67  |   await page.getByLabel('First name').fill('Grace');
  68  |   await page.getByRole('button', { name: 'Confirm and Create Resume' }).click();
  69  |   await expect(page).toHaveURL(/\/dashboard\/resumes\/[^/]+\/edit/, { timeout: 30000 });
  70  |   const resumeId = page.url().match(/resumes\/([^/]+)/)![1];
  71  |   const versions = await request.get(`http://localhost:5000/api/v1/resumes/${resumeId}/versions`, {
  72  |     headers: { authorization: `Bearer ${accessToken}` },
  73  |   });
  74  |   expect(versions.status()).toBe(200);
  75  |   expect((await versions.json()).data.length).toBeGreaterThan(0);
  76  |   await page.getByRole('link',{name:'Download & History'}).click();
  77  |   const downloadPromise = page.waitForEvent('download');
  78  |   await page.getByRole('button', { name: 'Generate PDF' }).click();
  79  |   const download = await downloadPromise;
  80  |   const saved = await download.path();
  81  |   expect(saved).toBeTruthy();
  82  |   expect((await readFile(saved!)).subarray(0, 5).toString()).toBe('%PDF-');
  83  |   const shareResponse = await request.post(
  84  |     `http://localhost:5000/api/v1/resumes/${resumeId}/share-links`,
  85  |     {
  86  |       headers: { authorization: `Bearer ${accessToken}`, origin: 'http://localhost:5173' },
  87  |       data: {
  88  |         confirmed: true,
  89  |         password: 'Shared@Test123',
  90  |         downloadAllowed: true,
  91  |         searchIndexing: false,
  92  |       },
  93  |     },
  94  |   );
  95  |   expect(shareResponse.status()).toBe(201);
  96  |   const share = await shareResponse.json();
  97  |   const token = share.data.token as string;
  98  |   await context.clearCookies();
  99  |   await page.goto(`/r/${token}`);
  100 |   await expect(page.getByRole('heading', { name: 'Protected resume' })).toBeVisible();
  101 |   await page.getByLabel('Password').fill('incorrect');
  102 |   await page.getByRole('button', { name: 'View resume' }).click();
  103 |   await expect(page.getByRole('alert')).toContainText('Incorrect password');
  104 |   await page.getByLabel('Password').fill('Shared@Test123');
  105 |   await page.getByRole('button', { name: 'View resume' }).click();
  106 |   await expect(page.locator('.resume-paper')).toBeVisible();
  107 |   for (const viewport of [
  108 |     { width: 375, height: 667 },
  109 |     { width: 390, height: 844 },
  110 |     { width: 768, height: 1024 },
  111 |     { width: 1024, height: 768 },
  112 |     { width: 1280, height: 800 },
  113 |     { width: 1440, height: 900 },
  114 |     { width: 1920, height: 1080 },
  115 |   ]) {
  116 |     await page.setViewportSize(viewport);
  117 |     await expect(page.locator('body')).toHaveJSProperty(
  118 |       'scrollWidth',
  119 |       await page.locator('body').evaluate((e) => e.clientWidth),
  120 |     );
  121 |     await page.screenshot({
  122 |       path: `playwright-artifacts/phase4-public-${viewport.width}x${viewport.height}.png`,
  123 |       fullPage: true,
  124 |     });
  125 |   }
  126 |   await request.delete(
  127 |     `http://localhost:5000/api/v1/resumes/${resumeId}/share-links/${share.data._id}`,
  128 |     { headers: { authorization: `Bearer ${accessToken}`, origin: 'http://localhost:5173' } },
  129 |   );
  130 |   await context.clearCookies();
  131 |   await page.goto(`/r/${token}`);
  132 |   await expect(page.getByRole('heading', { name: 'Resume unavailable' })).toBeVisible();
  133 | });
  134 | 
```