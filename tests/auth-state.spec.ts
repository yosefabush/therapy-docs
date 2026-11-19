import { test, expect } from '@playwright/test';
import { loginViaForm, loginAndSettle, expectLoggedInScreen, trackLogouts } from './helpers';

test('navigating immediately after login keeps the session', async ({ page }) => {
  const logouts = trackLogouts(page);
  await loginViaForm(page);
  await page.goto('/patients'); // no wait: dashboard requests are still in flight

  await expectLoggedInScreen(page, '/patients');
  expect(logouts.count()).toBe(0);
});

// Regression: a request aborted by navigation used to be treated as "not
// logged in", which cleared client auth and called /api/auth/logout.
test('navigating away while the current-user request is in flight keeps the session', async ({ page }) => {
  const logouts = trackLogouts(page);
  await loginAndSettle(page);

  // Hold the current-user lookup so the next navigation aborts it mid-flight.
  let sawUserRequest!: () => void;
  const userRequestStarted = new Promise<void>((resolve) => (sawUserRequest = resolve));
  await page.route('**/api/users/*', async (route) => {
    sawUserRequest();
    await new Promise((r) => setTimeout(r, 1_500));
    await route.continue().catch(() => {}); // page may have navigated away
  });

  await page.reload({ waitUntil: 'commit' });
  await userRequestStarted;
  await page.goto('/patients');
  await page.unroute('**/api/users/*');

  await expectLoggedInScreen(page, '/patients');
  expect(logouts.count()).toBe(0);
});

test('a server error on the current-user request does not log the user out', async ({ page }) => {
  const logouts = trackLogouts(page);
  await loginAndSettle(page);

  let served500 = 0;
  await page.route('**/api/users/*', (route) => {
    served500++;
    return route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"boom"}' });
  });
  await page.goto('/settings');
  await expect.poll(() => served500).toBeGreaterThan(0);
  await page.waitForTimeout(1_000); // let the failed lookup be handled
  await page.unroute('**/api/users/*');

  await page.goto('/patients');
  await expectLoggedInScreen(page, '/patients');
  expect(logouts.count()).toBe(0);
});

// Regression: client auth lived only in sessionStorage (per tab), so a new
// tab with a valid session cookie was sent to /login.
test('a new tab with a valid session cookie stays logged in', async ({ page, context }) => {
  const logouts = trackLogouts(page);
  await loginAndSettle(page);

  const newTab = await context.newPage();
  await newTab.goto('/patients');
  await expectLoggedInScreen(newTab, '/patients');
  await newTab.goto('/sessions');
  await expectLoggedInScreen(newTab, '/sessions');
  expect(logouts.count()).toBe(0);
});
