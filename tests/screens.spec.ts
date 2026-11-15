import { test, expect } from '@playwright/test';
import { loginViaForm, expectLoggedInScreen } from './helpers';

const AUTHED_SCREENS = [
  '/',
  '/patients',
  '/patients/patient-1',
  '/sessions',
  '/sessions/session-3',
  '/reports',
  '/insights',
  '/settings',
  '/help',
];

test('public screens load', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));

  await page.goto('/guide');
  await expect(page.getByText('מדריך שימוש למטפל')).toBeVisible();

  await page.goto('/signup');
  await expect(page.getByText('יצירת חשבון').first()).toBeVisible();

  expect(pageErrors).toEqual([]);
});

test('login via the form, then every main screen loads without an error state', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));

  await loginViaForm(page);

  for (const path of AUTHED_SCREENS) {
    await page.goto(path);
    await expectLoggedInScreen(page, path);
  }

  expect(pageErrors).toEqual([]);
});
