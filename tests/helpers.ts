import { expect, type Page } from '@playwright/test';

// Seeded demo account from data/ (JSON store). Tests only read seeded records.
export const DEMO_EMAIL = 'dr.sarah.cohen@clinic.co.il';
export const DEMO_PASSWORD = 'password123';
export const DEMO_NAME = 'שרה כהן';

// Text that the app renders when a screen fails to load.
const ERROR_TEXTS = [
  'Failed to load user data',
  'המפגש לא נמצא',
  'Application error',
  'Unhandled Runtime Error',
  'This page could not be found',
];

export const ADMIN_EMAIL = 'admin@clinic.co.il';
export const ADMIN_PASSWORD = 'admin123';

export async function loginViaForm(
  page: Page,
  email: string = DEMO_EMAIL,
  password: string = DEMO_PASSWORD
): Promise<void> {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((url) => url.pathname === '/');
}

/** Logs in and waits until the dashboard has finished loading the user. */
export async function loginAndSettle(page: Page): Promise<void> {
  await loginViaForm(page);
  await expectLoggedInScreen(page, '/');
}

/** Asserts the page is an authenticated app screen with no error state. */
export async function expectLoggedInScreen(page: Page, path: string): Promise<void> {
  await expect(page).toHaveURL(new RegExp(`${path.replace(/\//g, '\\/')}$`));
  await expect(page.getByText(DEMO_NAME).first()).toBeVisible({ timeout: 20_000 });
  for (const text of ERROR_TEXTS) {
    await expect(page.getByText(text)).toHaveCount(0);
  }
  // Re-check: a lost session redirects to /login after the first render.
  await expect(page).toHaveURL(new RegExp(`${path.replace(/\//g, '\\/')}$`));
}

/** Counts POST /api/auth/logout calls made by any page in the context. */
export function trackLogouts(page: Page): { count: () => number } {
  let logouts = 0;
  page.context().on('request', (req) => {
    if (req.url().includes('/api/auth/logout')) logouts++;
  });
  return { count: () => logouts };
}
