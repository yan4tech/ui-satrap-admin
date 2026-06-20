// @ts-check
const { test, expect } = require('@playwright/test');

const {
  installDashboardSession,
  mockEngineAtStage1,
  mockOptionalDashboardApis,
} = require('./helpers/service-stage1-smoke');

/**
 * E2E smoke — service2 page1 (form1 / stage1 applicant data).
 * پیش‌نیاز: UI روی PLAYWRIGHT_BASE_URL (پیش‌فرض localhost:3033).
 */
const PROCESS_ID = 92001;
const SERVICE_PATH = '/dashboard/services/two';
const DEFINITION_KEY = 'service2';
const STAGE1_ELEMENT = 'form1';

test.describe('Service2 page1 stage1 smoke', () => {
  test.beforeEach(async ({ page }) => {
    await installDashboardSession(page, { servicePermission: 'ui.services.two' });
    await mockOptionalDashboardApis(page);
    await mockEngineAtStage1(page, {
      processId: PROCESS_ID,
      definitionKey: DEFINITION_KEY,
      elementId: STAGE1_ELEMENT,
    });
  });

  test('renders stage1 applicant form at form1 task', async ({ page }) => {
    await page.goto(`${SERVICE_PATH}?processId=${PROCESS_ID}&definitionKey=${DEFINITION_KEY}`);

    await expect(page.getByRole('heading', { name: 'اطلاعات اولیه' })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByLabel('کد ملی متقاضی')).toBeVisible();
    await expect(page.getByLabel('شماره تلفن')).toBeVisible();
    await expect(page.getByText('اطلاعات شخصی', { exact: true })).toBeVisible();
    await expect(page.getByText('اطلاعات ادعا', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'ثبت نهایی' })).toBeVisible();
  });
});
