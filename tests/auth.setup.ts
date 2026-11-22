import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../src/pages/LoginPage';
import { env } from '../src/config/env';

/**
 * Logs in once and saves the session (cookies) to .auth/admin.json.
 * Every spec in the "chromium" project starts already authenticated,
 * which saves several seconds per test.
 */
setup('authenticate as admin', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.open();
  await loginPage.login(env.adminUser, env.adminPassword);

  await expect(page).toHaveURL(/\/dashboard\/index/);
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();

  await page.context().storageState({ path: env.authFile });
});
