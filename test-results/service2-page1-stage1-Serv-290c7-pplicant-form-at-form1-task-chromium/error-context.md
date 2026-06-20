# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: service2-page1-stage1.spec.js >> Service2 page1 stage1 smoke >> renders stage1 applicant form at form1 task
- Location: e2e\service2-page1-stage1.spec.js:30:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'اطلاعات اولیه' })
Expected: visible
Timeout: 20000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 20000ms
  - waiting for getByRole('heading', { name: 'اطلاعات اولیه' })

```

```yaml
- text: Internal Server Error
```

# Test source

```ts
  1  | // @ts-check
  2  | const { test, expect } = require('@playwright/test');
  3  | 
  4  | const {
  5  |   installDashboardSession,
  6  |   mockEngineAtStage1,
  7  |   mockOptionalDashboardApis,
  8  | } = require('./helpers/service-stage1-smoke');
  9  | 
  10 | /**
  11 |  * E2E smoke — service2 page1 (form1 / stage1 applicant data).
  12 |  * پیش‌نیاز: UI روی PLAYWRIGHT_BASE_URL (پیش‌فرض localhost:3033).
  13 |  */
  14 | const PROCESS_ID = 92001;
  15 | const SERVICE_PATH = '/dashboard/services/two';
  16 | const DEFINITION_KEY = 'service2';
  17 | const STAGE1_ELEMENT = 'form1';
  18 | 
  19 | test.describe('Service2 page1 stage1 smoke', () => {
  20 |   test.beforeEach(async ({ page }) => {
  21 |     await installDashboardSession(page, { servicePermission: 'ui.services.two' });
  22 |     await mockOptionalDashboardApis(page);
  23 |     await mockEngineAtStage1(page, {
  24 |       processId: PROCESS_ID,
  25 |       definitionKey: DEFINITION_KEY,
  26 |       elementId: STAGE1_ELEMENT,
  27 |     });
  28 |   });
  29 | 
  30 |   test('renders stage1 applicant form at form1 task', async ({ page }) => {
  31 |     await page.goto(`${SERVICE_PATH}?processId=${PROCESS_ID}&definitionKey=${DEFINITION_KEY}`);
  32 | 
> 33 |     await expect(page.getByRole('heading', { name: 'اطلاعات اولیه' })).toBeVisible({
     |                                                                        ^ Error: expect(locator).toBeVisible() failed
  34 |       timeout: 20_000,
  35 |     });
  36 |     await expect(page.getByLabel('کد ملی متقاضی')).toBeVisible();
  37 |     await expect(page.getByLabel('شماره تلفن')).toBeVisible();
  38 |     await expect(page.getByText('اطلاعات شخصی', { exact: true })).toBeVisible();
  39 |     await expect(page.getByText('اطلاعات ادعا', { exact: true })).toBeVisible();
  40 |     await expect(page.getByRole('button', { name: 'ثبت نهایی' })).toBeVisible();
  41 |   });
  42 | });
  43 | 
```