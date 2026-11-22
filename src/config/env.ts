import 'dotenv/config';

/**
 * Central place for environment settings.
 * Values come from environment variables (or a local .env file) and fall back
 * to the credentials OrangeHRM publishes on its public demo login page.
 */
export const env = {
  baseUrl: process.env.BASE_URL ?? 'https://opensource-demo.orangehrmlive.com',
  adminUser: process.env.ORANGEHRM_USER ?? 'Admin',
  adminPassword: process.env.ORANGEHRM_PASSWORD ?? 'admin123',
  authFile: '.auth/admin.json',
} as const;
