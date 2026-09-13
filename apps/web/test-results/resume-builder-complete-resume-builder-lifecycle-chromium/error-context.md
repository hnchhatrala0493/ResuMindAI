# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: resume-builder.spec.ts >> complete resume builder lifecycle
- Location: e2e\resume-builder.spec.ts:11:1

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.selectOption: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('select').filter({ hasText: 'Professional Summary' })
    - locator resolved to <select class="input mb-6 lg:hidden">…</select>
  - attempting select option action
    2 × waiting for element to be visible and enabled
      - element is not visible
    - retrying select option action
    - waiting 20ms
    2 × waiting for element to be visible and enabled
      - element is not visible
    - retrying select option action
      - waiting 100ms
    107 × waiting for element to be visible and enabled
        - element is not visible
      - retrying select option action
        - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=f1e2]:
  - generic [ref=f1e3]:
    - banner [ref=f1e4]:
      - link "Back to dashboard" [ref=f1e5] [cursor=pointer]:
        - /url: /dashboard
      - textbox [ref=f1e8]
      - status [ref=f1e9]: Save failed — retry
      - button "Retry" [ref=f1e10]
      - combobox [ref=f1e11]:
        - option "Modern" [selected]
        - option "Professional"
        - option "Minimal"
        - option "Executive"
        - option "Creative"
        - option "Technical"
    - generic [ref=f1e12]:
      - complementary [ref=f1e13]:
        - generic [ref=f1e14]: "% complete"
        - button "Personal Details" [ref=f1e17]
        - button "Professional Summary" [ref=f1e20]
        - button "Work Experience" [ref=f1e23]
        - button "Education" [ref=f1e26]
        - button "Skills" [ref=f1e29]
        - button "Projects" [ref=f1e32]
        - button "Certifications" [ref=f1e35]
        - button "Languages" [ref=f1e38]
        - button "Achievements" [ref=f1e41]
        - button "Volunteer Experience" [ref=f1e44]
        - button "Custom Sections" [ref=f1e47]
        - button "Template & Styling" [ref=f1e50]
        - button "Preview" [ref=f1e53]
      - main [ref=f1e56]:
        - heading "Personal Details" [level=1] [ref=f1e57]
        - paragraph [ref=f1e58]: Changes save automatically after you pause typing.
        - generic [ref=f1e59]:
          - generic [ref=f1e60]:
            - text: First name
            - textbox "First name" [ref=f1e61]: Playwright
          - generic [ref=f1e62]:
            - text: Last name
            - textbox "Last name" [ref=f1e63]: Tester
          - generic [ref=f1e64]:
            - text: Professional title
            - textbox "Professional title" [ref=f1e65]
          - generic [ref=f1e66]:
            - text: Email
            - textbox "Email" [active] [ref=f1e67]: test@example.com
          - generic [ref=f1e68]:
            - text: Phone
            - textbox "Phone" [ref=f1e69]
          - generic [ref=f1e70]:
            - text: Country
            - textbox "Country" [ref=f1e71]
          - generic [ref=f1e72]:
            - text: State
            - textbox "State" [ref=f1e73]
          - generic [ref=f1e74]:
            - text: City
            - textbox "City" [ref=f1e75]
          - generic [ref=f1e76]:
            - text: Postal code
            - textbox "Postal code" [ref=f1e77]
          - generic [ref=f1e78]:
            - text: Address
            - textbox "Address" [ref=f1e79]
          - generic [ref=f1e80]:
            - text: LinkedIn
            - textbox "LinkedIn" [ref=f1e81]
          - generic [ref=f1e82]:
            - text: GitHub
            - textbox "GitHub" [ref=f1e83]
          - generic [ref=f1e84]:
            - text: Portfolio
            - textbox "Portfolio" [ref=f1e85]
          - generic [ref=f1e86]:
            - text: Website
            - textbox "Website" [ref=f1e87]
          - generic [ref=f1e88]:
            - text: Profile image URL
            - textbox "Profile image URL" [ref=f1e89]
      - complementary [ref=f1e90]:
        - generic [ref=f1e91]:
          - button [ref=f1e92]
          - button "Fit" [ref=f1e94]
          - button [ref=f1e95]
        - article [ref=f1e98]:
          - generic [ref=f1e99]:
            - heading "Playwright Tester" [level=1] [ref=f1e100]
            - strong
            - paragraph [ref=f1e101]: test@example.com
  - region "Notifications alt+T"
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | const email = 'test@example.com',
  3  |   password = 'Test@Resume123';
  4  | async function login(page: import('@playwright/test').Page) {
  5  |   await page.goto('/login');
  6  |   await page.getByLabel('Email address').fill(email);
  7  |   await page.locator('input[name="password"]').fill(password);
  8  |   await page.getByRole('button', { name: 'Sign in' }).click();
  9  |   await expect(page).toHaveURL(/dashboard/);
  10 | }
  11 | test('complete resume builder lifecycle', async ({ page }) => {
  12 |   await login(page);
  13 |   await page.goto('/dashboard/resumes');
  14 |   await page.getByRole('button', { name: /Create resume/i }).click();
  15 |   await page.getByPlaceholder('Resume title').fill('Playwright QA Resume');
  16 |   await page.getByPlaceholder('Target role').fill('Senior Engineer');
  17 |   await page.getByRole('button', { name: 'Start from blank' }).click();
  18 |   await expect(page).toHaveURL(/\/edit/);
  19 |   await page.getByLabel('First name').fill('Playwright');
  20 |   await page.getByLabel('Last name').fill('Tester');
  21 |   await page.getByLabel('Email').fill(email);
  22 |   await page
  23 |     .getByRole('combobox')
  24 |     .filter({ has: page.locator('option') })
  25 |     .first();
  26 |   await page
  27 |     .locator('select')
  28 |     .filter({ hasText: 'Professional Summary' })
> 29 |     .selectOption('professionalSummary');
     |      ^ Error: locator.selectOption: Test timeout of 60000ms exceeded.
  30 |   await page
  31 |     .getByLabel('Summary')
  32 |     .fill(
  33 |       'Experienced engineer delivering measurable, accessible and reliable products for global customers.',
  34 |     );
  35 |   await expect(page.getByRole('status')).toContainText(/Saved/, { timeout: 10000 });
  36 |   await page.reload();
  37 |   await expect(page.getByText(/Playwright QA Resume/)).toBeVisible();
  38 |   await page.locator('select').filter({ hasText: 'Modern' }).first().selectOption('technical');
  39 |   await expect(page.getByRole('status')).toContainText(/Saved/, { timeout: 10000 });
  40 |   await page.goto('/dashboard/resumes');
  41 |   const card = page.locator('article').filter({ hasText: 'Playwright QA Resume' });
  42 |   await card.getByLabel('Duplicate').click();
  43 |   await expect(
  44 |     page.locator('article').filter({ hasText: 'Playwright QA Resume Copy' }),
  45 |   ).toBeVisible();
  46 |   const copy = page.locator('article').filter({ hasText: 'Playwright QA Resume Copy' });
  47 |   await copy.getByLabel('Archive').click();
  48 |   await page.locator('select').filter({ hasText: 'Archived' }).selectOption('archived');
  49 |   await expect(
  50 |     page.locator('article').filter({ hasText: 'Playwright QA Resume Copy' }),
  51 |   ).toBeVisible();
  52 |   await page
  53 |     .locator('article')
  54 |     .filter({ hasText: 'Playwright QA Resume Copy' })
  55 |     .getByLabel('Restore')
  56 |     .click();
  57 |   await page.locator('select').filter({ hasText: 'All active' }).selectOption('');
  58 |   page.once('dialog', (d) => d.accept());
  59 |   await page
  60 |     .locator('article')
  61 |     .filter({ hasText: 'Playwright QA Resume' })
  62 |     .getByLabel('Delete')
  63 |     .click();
  64 | });
  65 | for (const [name, width, height] of [
  66 |   ['375x667', 375, 667],
  67 |   ['390x844', 390, 844],
  68 |   ['768x1024', 768, 1024],
  69 |   ['1024x768', 1024, 768],
  70 |   ['1280x800', 1280, 800],
  71 |   ['1440x900', 1440, 900],
  72 |   ['1920x1080', 1920, 1080],
  73 | ] as const)
  74 |   test(`responsive screenshots ${name}`, async ({ page }, info) => {
  75 |     await page.setViewportSize({ width, height });
  76 |     await page.goto('/');
  77 |     await expect(page.getByRole('heading', { name: /Build a Resume That/i })).toBeVisible();
  78 |     await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
  79 |     await page.screenshot({ path: info.outputPath(`landing-${name}.png`), fullPage: true });
  80 |     await page.goto('/login');
  81 |     await expect(page.getByRole('heading', { name: /Sign in to ResuMind/i })).toBeVisible();
  82 |     await page.screenshot({ path: info.outputPath(`login-${name}.png`), fullPage: true });
  83 |   });
  84 | 
```