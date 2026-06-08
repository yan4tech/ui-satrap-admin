// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * E2E جریان ادمین یکپارچه‌سازی:
 * create connector (Shahkar preset) → test connection → create action → open sendAgency1 binding
 *
 * پیش‌نیاز: UI روی PLAYWRIGHT_BASE_URL، gateway فعال، کاربر central-admin لاگین‌شده (یا AUTH_SKIP).
 */
test.describe('Integration admin flow', () => {
  test('Shahkar connector preset → test → action → sendAgency1 binding', async ({ page }) => {
    await page.goto('/dashboard/admin/integration/connectors');

    await expect(page.getByRole('heading', { name: 'کاتالوگ کانکتور' })).toBeVisible();

    await page.getByRole('button', { name: 'کانکتور جدید' }).click();
    await page.getByText('شاهکار (REST)').first().click();

    await page.getByRole('button', { name: 'ذخیره' }).click();
    await expect(page.getByText('کانکتور با موفقیت ایجاد شد', { exact: false })).toBeVisible({
      timeout: 20_000,
    });

    await page.getByRole('button', { name: 'تست اتصال' }).click();
    await expect(page.getByText('تست اتصال', { exact: false }).first()).toBeVisible();

    await page.getByRole('button', { name: 'مدیریت اکشن‌ها' }).click();
    await expect(page.getByRole('heading', { name: 'Action Builder' })).toBeVisible();

    await page.getByRole('button', { name: 'تست اتصال کانکتور' }).click();

    await page.getByRole('button', { name: 'اکشن جدید' }).click();
    const presetChip = page.getByText('الگو: شاهکار (REST)');
    if (await presetChip.isVisible()) {
      await presetChip.click();
    }
    await page.getByRole('button', { name: 'ذخیره' }).click();
    await expect(page.getByText('اکشن با موفقیت ایجاد شد', { exact: false })).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole('button', { name: /sendAgency1/ }).click();
    await expect(page.getByText('sendAgency1')).toBeVisible();
  });
});
