// @ts-check
const { test, expect } = require('@playwright/test');

const {
  installDashboardSession,
  mockEngineAtStage1,
  mockOptionalDashboardApis,
} = require('./helpers/service-stage1-smoke');

/**
 * E2E smoke — service4 page1 (stage1_initial / applicant + claim data).
 * کپی/adapt از e2e/service2-page1-stage1.spec.js — تفاوت: مسیر، elementId، عنوان فرم.
 * پیش‌نیاز: UI روی PLAYWRIGHT_BASE_URL (پیش‌فرض localhost:3033).
 */
const PROCESS_ID = 94001;
const SERVICE_PATH = '/dashboard/services/four';
const DEFINITION_KEY = 'service4';
const STAGE1_ELEMENT = 'stage1_initial';

test.describe('Service4 page1 stage1 smoke', () => {
  test.beforeEach(async ({ page }) => {
    await installDashboardSession(page, { servicePermission: 'ui.services.four' });
    await mockOptionalDashboardApis(page);
    await mockEngineAtStage1(page, {
      processId: PROCESS_ID,
      definitionKey: DEFINITION_KEY,
      elementId: STAGE1_ELEMENT,
    });
  });

  test('renders stage1 applicant and claim form at stage1_initial task', async ({ page }) => {
    await page.goto(`${SERVICE_PATH}?processId=${PROCESS_ID}&definitionKey=${DEFINITION_KEY}`);

    await expect(
      page.getByRole('heading', { name: 'ارسال داده‌های اولیه متقاضی و ادعا' }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByLabel('کد ملی متقاضی')).toBeVisible();
    await expect(page.getByLabel('شماره تلفن')).toBeVisible();
    await expect(page.getByText('اطلاعات شخصی', { exact: true })).toBeVisible();
    await expect(page.getByText('اطلاعات ادعا', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'ثبت نهایی' })).toBeVisible();
  });
});
