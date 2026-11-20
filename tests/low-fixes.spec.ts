import { test, expect, request as pwRequest, type Browser, type Page, type APIRequestContext } from '@playwright/test';
import { ADMIN_EMAIL, ADMIN_PASSWORD, DEMO_EMAIL, DEMO_PASSWORD } from './helpers';

// End-to-end coverage for the LOW-severity fixes: dead controls, delete UI,
// signup password rule, redirect of signed-in users, server-side logout,
// Hebrew strings / aria-labels / mobile tabs. Every test creates its own ZZTEST
// records through the API and removes them afterwards.

test.describe.configure({ mode: 'serial' });

const SARAH_STATE = 'test-results/low-fixes-sarah.json';
const ADMIN_STATE = 'test-results/low-fixes-admin.json';
const SARAH_ID = 'user-1';
// `request.newContext` inherits the file-level storageState; contexts that must start signed out opt out.
const NO_COOKIES = { cookies: [], origins: [] };

async function saveLoginState(browser: Browser, file: string, email: string, password: string) {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  // Logins are rate limited (10/min per IP): on a 429 wait a little and retry.
  let loggedIn = false;
  for (let attempt = 0; attempt < 10 && !loggedIn; attempt++) {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/auth/login')),
      page.locator('button[type="submit"]').click(),
    ]);
    if (response.status() === 429) {
      await page.waitForTimeout(10_000);
      continue;
    }
    await page.waitForURL((url) => url.pathname === '/');
    loggedIn = true;
  }
  expect(loggedIn, `login as ${email}`).toBe(true);
  await context.storageState({ path: file });
  await context.close();
}

test.beforeAll(async ({ browser }) => {
  test.setTimeout(240_000);
  await saveLoginState(browser, SARAH_STATE, DEMO_EMAIL, DEMO_PASSWORD);
  await saveLoginState(browser, ADMIN_STATE, ADMIN_EMAIL, ADMIN_PASSWORD);
});

test.use({ storageState: SARAH_STATE });

const created: string[] = [];

async function apiAs(baseURL: string | undefined, state: string): Promise<APIRequestContext> {
  return pwRequest.newContext({ baseURL, storageState: state });
}

async function createPatient(api: APIRequestContext, firstName: string): Promise<string> {
  const res = await api.post('/api/patients', {
    data: {
      idNumber: String(Math.floor(100000000 + Math.random() * 899999999)),
      encryptedData: '',
      firstName,
      lastName: 'ZZTEST',
      dateOfBirth: '1990-01-01',
      gender: 'female',
      assignedTherapists: [SARAH_ID],
      status: 'active',
    },
  });
  expect(res.status()).toBe(201);
  const id = (await res.json()).data.id as string;
  created.push(id);
  return id;
}

async function createSession(
  api: APIRequestContext,
  patientId: string,
  opts: { location?: string; daysAhead?: number } = {}
): Promise<string> {
  const res = await api.post('/api/sessions', {
    data: {
      patientId,
      therapistId: SARAH_ID,
      therapistRole: 'psychologist',
      sessionType: 'individual_therapy',
      // A week out keeps the session-reminder popup quiet.
      scheduledAt: new Date(Date.now() + (opts.daysAhead ?? 7) * 24 * 3600 * 1000).toISOString(),
      duration: 50,
      status: 'scheduled',
      location: opts.location ?? 'in_person',
      notes: { subjective: '', objective: '', assessment: '', plan: '', interventionsUsed: [] },
    },
  });
  expect(res.status()).toBe(201);
  return (await res.json()).data.id as string;
}

async function createReport(api: APIRequestContext, patientId: string, title: string, sign = false): Promise<string> {
  const res = await api.post('/api/reports', {
    data: {
      patientId,
      reportType: 'progress_summary',
      title,
      dateRange: { start: new Date().toISOString(), end: new Date().toISOString() },
      content: { summary: 'x' },
      status: 'draft',
    },
  });
  expect(res.status()).toBe(201);
  const id = (await res.json()).data.id as string;
  if (sign) {
    expect((await api.put(`/api/reports/${id}`, { data: { status: 'signed' } })).status()).toBe(200);
  }
  return id;
}

async function dismissReminder(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog', { name: 'תזכורת מפגש' });
  try {
    await dialog.waitFor({ state: 'visible', timeout: 2_500 });
    await dialog.getByRole('button', { name: 'הזכר לי מאוחר יותר' }).click();
    await dialog.waitFor({ state: 'hidden' });
  } catch {
    // No reminder shown.
  }
}

test.afterEach(async ({ baseURL }) => {
  if (created.length === 0) return;
  const api = await apiAs(baseURL, ADMIN_STATE);
  for (const id of created.splice(0)) await api.delete(`/api/patients/${id}`);
  await api.dispose();
});

const HEBREW = /[\u0590-\u05FF]/;

// A tab in the page's tab strip (not e.g. the header's "התראות" bell button).
const tabButton = (page: Page, name: string) =>
  page.locator('nav[aria-label="לשוניות"]').getByRole('button', { name, exact: true });

// ------------------------------------------------------------------ item 1 --

test('1: settings: nothing is clickable-but-dead; every control is read-only with a "בקרוב" notice', async ({ page }) => {
  await page.goto('/settings');
  await expect(page.getByTestId('settings-coming-soon')).toContainText('בקרוב');
  for (const tab of ['פרופיל', 'התראות', 'אבטחה', 'העדפות']) {
    await tabButton(page, tab).click();
    const actions = page.getByRole('button', { name: /שמור|עדכן|הפעל/ });
    expect(await actions.count()).toBeGreaterThan(0);
    for (const button of await actions.all()) {
      await expect(button).toBeDisabled();
      await expect(button).toContainText('בקרוב');
    }
    const enabledFields = await page
      .locator('fieldset[disabled] input, fieldset[disabled] select, fieldset[disabled] textarea')
      .evaluateAll((els) => els.filter((e) => !e.matches(':disabled')).length);
    expect(enabledFields).toBe(0);
  }
});

test('1: help: contact form is disabled with a "בקרוב" note; guide cards open the real guide', async ({ page }) => {
  await page.goto('/help');
  await tabButton(page, 'צור קשר').click();
  await expect(page.getByTestId('contact-coming-soon')).toContainText('בקרוב');
  await expect(page.getByRole('button', { name: /שלח הודעה/ })).toBeDisabled();
  await expect(page.getByLabel('הודעה', { exact: true })).toBeDisabled();

  await tabButton(page, 'מדריכים').click();
  const cards = page.getByTestId('guide-link');
  await expect(cards).toHaveCount(4);
  await expect(cards.first()).toHaveAttribute('href', '/guide');
  await cards.filter({ hasText: 'ניהול מטופלים' }).click();
  await expect(page).toHaveURL(/\/guide#patients$/);
  await expect(page.locator('#patients')).toBeVisible();
});

test('1: forgot-password, terms and privacy are real pages (no dead "#" links)', async ({ browser }) => {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();

  await page.goto('/login');
  await expect(page.getByRole('link', { name: 'שכחת סיסמה?' })).toHaveAttribute('href', '/forgot-password');
  await page.getByRole('link', { name: 'שכחת סיסמה?' }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);
  await expect(page.getByRole('heading', { name: 'שחזור סיסמה' })).toBeVisible();
  await expect(page.getByTestId('placeholder-message')).toContainText('בקרוב');

  await page.goto('/signup');
  await expect(page.getByRole('link', { name: 'תנאי השימוש' })).toHaveAttribute('href', '/terms');
  await expect(page.getByRole('link', { name: 'מדיניות הפרטיות' })).toHaveAttribute('href', '/privacy');
  await page.getByRole('link', { name: 'תנאי השימוש' }).click();
  await expect(page).toHaveURL(/\/terms$/);
  await expect(page.getByRole('heading', { name: 'תנאי שימוש' })).toBeVisible();
  await expect(page.getByTestId('placeholder-message')).toContainText('בהכנה');
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { name: 'מדיניות פרטיות' })).toBeVisible();
  await expect(page.getByTestId('placeholder-message')).toContainText('בהכנה');
  await context.close();
});

test('1: patient page: "מפגש חדש" opens a real form that schedules a session; dead "add team member" is disabled', async ({ page }) => {
  const patientId = await createPatient(page.request, 'NewSess');
  await page.goto(`/patients/${patientId}`);
  await dismissReminder(page);

  await expect(page.getByRole('button', { name: /הוסף חבר צוות/ })).toBeDisabled();

  await page.getByRole('button', { name: /מפגש חדש/ }).first().click();
  const dialog = page.getByRole('dialog', { name: 'תזמון מפגש' });
  await expect(dialog.getByText('יופיע כאן')).toHaveCount(0);
  const day = new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  await dialog.locator('input[type="date"]').fill(day);
  await dialog.locator('input[type="time"]').fill('10:30');
  // The patient is pre-selected: it is the only one offered.
  await expect(dialog.locator('select').first()).toHaveValue(patientId);
  await dialog.getByRole('button', { name: 'תזמן מפגש' }).click();
  await expect(dialog).toBeHidden();

  const sessions = (await (await page.request.get(`/api/sessions?patientId=${patientId}`)).json()).data;
  expect(sessions).toHaveLength(1);
  expect(sessions[0].therapistId).toBe(SARAH_ID);
});

test('1: dashboard "השלם עכשיו" opens the sessions page on the pending-signature tab', async ({ page }) => {
  const patientId = await createPatient(page.request, 'Pending');
  const sessionId = await createSession(page.request, patientId);
  expect((await page.request.put(`/api/sessions/${sessionId}`, { data: { status: 'completed' } })).status()).toBe(200);

  await page.goto('/');
  await dismissReminder(page);
  await page.getByRole('link', { name: 'השלם עכשיו' }).click();
  await expect(page).toHaveURL(/\/sessions\?tab=pending$/);
  await expect(page.getByRole('button', { name: /ממתינים לחתימה/ })).toHaveClass(/border-sage-600/);
  await expect(page.getByText('Pending ZZTEST').first()).toBeVisible();
});

test('1: patients sort and sessions location filter actually change the list', async ({ page }) => {
  const first = await createPatient(page.request, 'AAAZZ');
  const second = await createPatient(page.request, 'ZZZZZ');
  await createSession(page.request, first, { location: 'telehealth' });
  await createSession(page.request, second, { location: 'in_person' });

  await page.goto('/patients');
  await dismissReminder(page);
  const names = async () =>
    (await page.locator('a[href^="/patients/"]').allTextContents()).filter((t) => t.includes('ZZTEST'));
  // Default: most recently updated first => the one created last.
  await expect.poll(async () => (await names())[0] ?? '').toContain('ZZZZZ');
  await page.getByLabel('מיון מטופלים').selectOption('name');
  await expect.poll(async () => (await names())[0] ?? '').toContain('AAAZZ');

  await page.goto('/sessions');
  await dismissReminder(page);
  await expect(page.getByText('AAAZZ ZZTEST').first()).toBeVisible();
  await expect(page.getByText('ZZZZZ ZZTEST').first()).toBeVisible();
  await page.getByLabel('סינון לפי מיקום').selectOption('telehealth');
  await expect(page.getByText('AAAZZ ZZTEST').first()).toBeVisible();
  await expect(page.getByText('ZZZZZ ZZTEST')).toHaveCount(0);
  await page.getByLabel('סינון לפי מיקום').selectOption('in_person');
  await expect(page.getByText('ZZZZZ ZZTEST').first()).toBeVisible();
  await expect(page.getByText('AAAZZ ZZTEST')).toHaveCount(0);
});

// ------------------------------------------------------------------ item 2 --

test('2: delete a patient from its page: Hebrew confirm, cancel keeps it, confirm deletes everything', async ({ page }) => {
  const patientId = await createPatient(page.request, 'DelPatient');
  const sessionId = await createSession(page.request, patientId);
  const reportId = await createReport(page.request, patientId, 'ZZTEST cascade report');

  await page.goto(`/patients/${patientId}`);
  await dismissReminder(page);
  await page.getByTestId('delete-patient').click();
  const dialog = page.getByTestId('confirm-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('מחיקת מטופל');
  await expect(dialog).toContainText('DelPatient ZZTEST');
  await expect(dialog).toContainText('אינה הפיכה');

  await dialog.getByRole('button', { name: 'ביטול' }).click();
  await expect(dialog).toBeHidden();
  expect((await page.request.get(`/api/patients/${patientId}`)).status()).toBe(200);

  await page.getByTestId('delete-patient').click();
  await page.getByTestId('confirm-dialog').getByRole('button', { name: 'מחק' }).click();
  await expect(page).toHaveURL(/\/patients$/);
  expect((await page.request.get(`/api/patients/${patientId}`)).status()).toBe(404);
  expect((await page.request.get(`/api/sessions/${sessionId}`)).status()).toBe(404);
  expect((await page.request.get(`/api/reports/${reportId}`)).status()).toBe(404);
});

test('2: a failed patient delete shows a Hebrew error and keeps the dialog open', async ({ page }) => {
  const patientId = await createPatient(page.request, 'DelFail');
  await page.goto(`/patients/${patientId}`);
  await dismissReminder(page);
  await page.route(`**/api/patients/${patientId}`, (route) =>
    route.request().method() === 'DELETE'
      ? route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"Failed to delete patient"}' })
      : route.continue()
  );
  await page.getByTestId('delete-patient').click();
  await page.getByTestId('confirm-dialog').getByRole('button', { name: 'מחק' }).click();
  const error = page.getByTestId('confirm-dialog-error');
  await expect(error).toBeVisible();
  expect(await error.textContent()).toMatch(HEBREW);
  expect(await error.textContent()).not.toContain('Failed');
  await expect(page).toHaveURL(new RegExp(`/patients/${patientId}$`));
  await page.unroute(`**/api/patients/${patientId}`);
});

test('2: delete a session from its page; a signed session has no delete button for a therapist but does for an admin', async ({ page, baseURL, browser }) => {
  const patientId = await createPatient(page.request, 'DelSession');
  const openId = await createSession(page.request, patientId);
  const signedId = await createSession(page.request, patientId, { daysAhead: 8 });
  expect(
    (await page.request.put(`/api/sessions/${signedId}`, { data: { status: 'completed', signedAt: new Date().toISOString() } })).status()
  ).toBe(200);

  // Signed: locked for the therapist (UI and API).
  await page.goto(`/sessions/${signedId}`);
  await dismissReminder(page);
  await expect(page.getByText('✓ חתום')).toBeVisible();
  await expect(page.getByTestId('delete-session')).toHaveCount(0);
  expect((await page.request.delete(`/api/sessions/${signedId}`)).status()).toBe(409);

  // Unsigned: Hebrew confirm, cancel keeps it, confirm deletes it.
  await page.goto(`/sessions/${openId}`);
  await dismissReminder(page);
  await page.getByTestId('delete-session').click();
  const dialog = page.getByTestId('confirm-dialog');
  await expect(dialog).toContainText('מחיקת מפגש');
  await dialog.getByRole('button', { name: 'ביטול' }).click();
  await expect(dialog).toBeHidden();
  expect((await page.request.get(`/api/sessions/${openId}`)).status()).toBe(200);
  await page.getByTestId('delete-session').click();
  await page.getByTestId('confirm-dialog').getByRole('button', { name: 'מחק' }).click();
  await expect(page).toHaveURL(/\/sessions$/);
  expect((await page.request.get(`/api/sessions/${openId}`)).status()).toBe(404);

  // An administrator may still remove the signed one, after a stronger warning.
  const adminContext = await browser.newContext({ storageState: ADMIN_STATE, baseURL });
  const adminPage = await adminContext.newPage();
  await adminPage.goto(`/sessions/${signedId}`);
  await adminPage.getByTestId('delete-session').click();
  await expect(adminPage.getByTestId('confirm-dialog')).toContainText('חתום');
  await adminPage.getByTestId('confirm-dialog').getByRole('button', { name: 'מחק' }).click();
  await expect(adminPage).toHaveURL(/\/sessions$/);
  expect((await page.request.get(`/api/sessions/${signedId}`)).status()).toBe(404);
  await adminContext.close();
});

test('2: delete a report from the reports page; a signed report is locked for the therapist (UI and API) but not the admin', async ({ page, baseURL, browser }) => {
  const patientId = await createPatient(page.request, 'DelReport');
  const draftId = await createReport(page.request, patientId, 'ZZTEST draft to delete');
  const signedId = await createReport(page.request, patientId, 'ZZTEST signed report', true);

  await page.goto('/reports');
  await dismissReminder(page);
  const card = (title: string) => page.locator('[class*="cursor-pointer"]').filter({ hasText: title });

  await expect(card('ZZTEST signed report').getByText('חתום')).toBeVisible();
  await expect(card('ZZTEST signed report').getByTestId('delete-report')).toHaveCount(0);
  const locked = await page.request.delete(`/api/reports/${signedId}`);
  expect(locked.status()).toBe(409);
  expect((await locked.json()).code).toBe('REPORT_SIGNED');

  await card('ZZTEST draft to delete').getByTestId('delete-report').click();
  const dialog = page.getByTestId('confirm-dialog');
  await expect(dialog).toContainText('מחיקת דוח');
  await dialog.getByRole('button', { name: 'ביטול' }).click();
  expect((await page.request.get(`/api/reports/${draftId}`)).status()).toBe(200);
  await card('ZZTEST draft to delete').getByTestId('delete-report').click();
  await page.getByTestId('confirm-dialog').getByRole('button', { name: 'מחק' }).click();
  await expect(card('ZZTEST draft to delete')).toHaveCount(0);
  expect((await page.request.get(`/api/reports/${draftId}`)).status()).toBe(404);

  const adminContext = await browser.newContext({ storageState: ADMIN_STATE, baseURL });
  const adminPage = await adminContext.newPage();
  await adminPage.goto('/reports');
  await adminPage
    .locator('[class*="cursor-pointer"]')
    .filter({ hasText: 'ZZTEST signed report' })
    .getByTestId('delete-report')
    .click();
  await adminPage.getByTestId('confirm-dialog').getByRole('button', { name: 'מחק' }).click();
  await expect(adminPage.locator('[class*="cursor-pointer"]').filter({ hasText: 'ZZTEST signed report' })).toHaveCount(0);
  expect((await page.request.get(`/api/reports/${signedId}`)).status()).toBe(404);
  await adminContext.close();
});

test('2: patient page reports tab: Hebrew report cards with a working delete', async ({ page }) => {
  const patientId = await createPatient(page.request, 'RepTab');
  const reportId = await createReport(page.request, patientId, 'ZZTEST tab report');
  await page.goto(`/patients/${patientId}`);
  await dismissReminder(page);
  await page.getByRole('button', { name: /דוחות/ }).first().click();
  const card = page.locator('[class*="hover"]').filter({ hasText: 'ZZTEST tab report' }).last();
  await expect(card).toContainText('טיוטה');
  await expect(page.getByText('View', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Export', { exact: true })).toHaveCount(0);
  await page.getByTestId('delete-report').click();
  await page.getByTestId('confirm-dialog').getByRole('button', { name: 'מחק' }).click();
  await expect(page.getByText('ZZTEST tab report')).toHaveCount(0);
  expect((await page.request.get(`/api/reports/${reportId}`)).status()).toBe(404);
});

// ------------------------------------------------------------------ item 3 --

test('3: signup enforces the server\'s 8-character password rule in the browser', async ({ browser }) => {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  let signups = 0;
  await page.route('**/api/auth/signup', (route) => {
    signups++;
    return route.fulfill({ status: 400, contentType: 'application/json', body: '{"error":"stub"}' });
  });
  await page.goto('/signup');
  await page.getByLabel('שם מלא').fill('ZZTEST Signup');
  await page.getByLabel('אימייל').fill('zztest-signup@example.com');
  const passwords = page.locator('input[autocomplete="new-password"]');

  await passwords.nth(0).fill('abc1234'); // 7 characters
  await passwords.nth(1).fill('abc1234');
  await page.getByRole('button', { name: 'יצירת חשבון' }).click();
  await expect(page.getByText('הסיסמה חייבת להכיל לפחות 8 תווים')).toBeVisible();
  expect(signups).toBe(0);

  await passwords.nth(0).fill('abc12345'); // 8 characters: accepted by the client, so it is sent
  await passwords.nth(1).fill('abc12345');
  await page.getByRole('button', { name: 'יצירת חשבון' }).click();
  await expect.poll(() => signups).toBe(1);
  await expect(page.getByText('לפחות 8 תווים')).toHaveCount(0);
  await context.close();
});

// ------------------------------------------------------------------ item 4 --

test('4: a signed-in user visiting /login or /signup lands on the dashboard; signed-out visitors still see them', async ({ page, browser }) => {
  for (const path of ['/login', '/signup']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/$/);
  }
  const guest = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const guestPage = await guest.newPage();
  for (const path of ['/login', '/signup']) {
    await guestPage.goto(path);
    await expect(guestPage).toHaveURL(new RegExp(`${path}$`));
  }
  await guest.close();
});

// ------------------------------------------------------------------ item 5 --

async function apiLogin(baseURL: string | undefined, email: string, password: string): Promise<APIRequestContext> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const api = await pwRequest.newContext({ baseURL, storageState: NO_COOKIES });
    const res = await api.post('/api/auth/login', { data: { email, password } });
    if (res.status() === 200) return api;
    await api.dispose();
    if (res.status() !== 429) throw new Error(`login failed: ${res.status()}`);
    await new Promise((r) => setTimeout(r, 10_000));
  }
  throw new Error('login rate-limited');
}

test('5: logout revokes the token server-side: a copied cookie stops working, other sessions are unaffected', async ({ baseURL }) => {
  test.setTimeout(120_000);
  const sessionA = await apiLogin(baseURL, DEMO_EMAIL, DEMO_PASSWORD);
  const sessionB = await apiLogin(baseURL, DEMO_EMAIL, DEMO_PASSWORD);
  const cookieA = (await sessionA.storageState()).cookies.find((c) => c.name === 'therapydocs_session')!.value;
  const cookieB = (await sessionB.storageState()).cookies.find((c) => c.name === 'therapydocs_session')!.value;
  expect(cookieA).not.toBe(cookieB);

  // A copy of A's cookie, as an attacker (or another device) would hold it.
  const stolen = await pwRequest.newContext({ baseURL, storageState: NO_COOKIES, extraHTTPHeaders: { cookie: `therapydocs_session=${cookieA}` } });
  expect((await stolen.get('/api/auth/me')).status()).toBe(200);
  expect((await stolen.get('/api/patients')).status()).toBe(200);

  const logout = await sessionA.post('/api/auth/logout');
  expect(logout.status()).toBe(200);
  expect(logout.headers()['set-cookie']).toContain('therapydocs_session=;');

  // The signature is still valid, but the token is revoked everywhere.
  expect((await stolen.get('/api/auth/me')).status()).toBe(401);
  expect((await stolen.get('/api/patients')).status()).toBe(401);
  expect((await stolen.get('/api/users')).status()).toBe(401);
  const page = await stolen.get('/patients', { maxRedirects: 0 });
  expect([302, 307]).toContain(page.status());
  expect(page.headers()['location']).toContain('/login');
  // ...and a revoked cookie does not count as "signed in" on /login (no redirect loop).
  expect((await stolen.get('/login', { maxRedirects: 0 })).status()).toBe(200);

  // A second session of the same user keeps working, and logs out on its own.
  expect((await sessionB.get('/api/auth/me')).status()).toBe(200);
  expect((await sessionB.post('/api/auth/logout')).status()).toBe(200);
  const stolenB = await pwRequest.newContext({ baseURL, storageState: NO_COOKIES, extraHTTPHeaders: { cookie: `therapydocs_session=${cookieB}` } });
  expect((await stolenB.get('/api/auth/me')).status()).toBe(401);

  // Logging out without a session is harmless.
  const anon = await pwRequest.newContext({ baseURL, storageState: NO_COOKIES });
  expect((await anon.post('/api/auth/logout')).status()).toBe(200);

  await Promise.all([sessionA, sessionB, stolen, stolenB, anon].map((c) => c.dispose()));
});

test('5: logging out from the UI ends the session and lands on /login', async ({ browser, baseURL }) => {
  test.setTimeout(120_000);
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] }, baseURL });
  const page = await context.newPage();
  let loggedIn = false;
  for (let attempt = 0; attempt < 10 && !loggedIn; attempt++) {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(DEMO_EMAIL);
    await page.locator('input[type="password"]').fill(DEMO_PASSWORD);
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/auth/login')),
      page.locator('button[type="submit"]').click(),
    ]);
    if (response.status() === 429) {
      await page.waitForTimeout(10_000);
      continue;
    }
    await page.waitForURL((url) => url.pathname === '/');
    loggedIn = true;
  }
  expect(loggedIn).toBe(true);
  const cookie = (await context.cookies()).find((c) => c.name === 'therapydocs_session')!.value;

  await dismissReminder(page);
  await page.getByRole('button', { name: /התנתק/ }).first().click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator('input[type="email"]')).toBeVisible();

  const replay = await pwRequest.newContext({ baseURL, storageState: NO_COOKIES, extraHTTPHeaders: { cookie: `therapydocs_session=${cookie}` } });
  expect((await replay.get('/api/auth/me')).status()).toBe(401);
  await replay.dispose();
  await context.close();
});

// ------------------------------------------------------------------ item 6 --

test('6: statuses and labels are Hebrew (patient badge, goal status, report status)', async ({ page }) => {
  const patientId = await createPatient(page.request, 'Hebrew');
  const goalRes = await page.request.post('/api/treatment-goals', {
    data: { patientId, description: 'ZZTEST goal', measurementCriteria: 'x', targetDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString() },
  });
  expect(goalRes.status()).toBe(201);
  await createReport(page.request, patientId, 'ZZTEST hebrew report');
  await page.goto(`/patients/${patientId}`);
  await dismissReminder(page);
  await expect(page.getByText('פעיל', { exact: true }).first()).toBeVisible();
  for (const raw of ['active', 'inactive', 'discharged', 'achieved']) {
    await expect(page.getByText(raw, { exact: true })).toHaveCount(0);
  }
  await expect(page.getByText('פעילה', { exact: true }).first()).toBeVisible(); // goal status
  await expect(page.getByText(/^יעד:/)).toBeVisible();
  await expect(page.getByText(/^Target:/)).toHaveCount(0);

  await page.getByRole('button', { name: /דוחות/ }).first().click();
  await expect(page.getByRole('heading', { name: 'יצירת דוח טיפול' })).toBeVisible();
  await expect(page.getByText('Generate Treatment Report')).toHaveCount(0);
  await expect(page.getByText('Start Date')).toHaveCount(0);

  await page.goto('/reports');
  await expect(page.getByText('finalized', { exact: true })).toHaveCount(0);
});

async function unnamedControls(page: Page): Promise<string[]> {
  await page.waitForTimeout(800);
  return page.evaluate(() => {
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const nameOf = (el: Element): string => {
      const e = el as HTMLInputElement;
      const aria = el.getAttribute('aria-label');
      if (aria) return aria;
      const by = el.getAttribute('aria-labelledby');
      if (by) return by.split(' ').map((id) => document.getElementById(id)?.textContent ?? '').join(' ');
      if (el.getAttribute('title')) return el.getAttribute('title')!;
      if (e.labels && e.labels.length) return [...e.labels].map((l) => l.textContent).join(' ');
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return el.getAttribute('placeholder') ?? '';
      return (el.textContent ?? '').trim();
    };
    return [...document.querySelectorAll('button, a[href], [role=button], input:not([type=hidden]), select, textarea')]
      .filter((el) => visible(el) && !el.closest('[aria-hidden="true"]') && el.getAttribute('aria-hidden') !== 'true')
      .filter((el) => !nameOf(el).trim())
      .map((el) => `${el.tagName}.${String(el.className).slice(0, 40)}`);
  });
}

test('6: icon-only buttons and form controls have accessible names on the main screens', async ({ page }) => {
  test.setTimeout(150_000);
  const patientId = await createPatient(page.request, 'Aria');
  await createSession(page.request, patientId);
  await createReport(page.request, patientId, 'ZZTEST aria report');
  for (const path of ['/', '/patients', `/patients/${patientId}`, '/sessions', '/reports', '/insights', '/settings', '/help']) {
    await page.goto(path);
    await dismissReminder(page);
    expect(await unnamedControls(page), `unnamed controls on ${path}`).toEqual([]);
  }
  await page.goto('/settings');
  for (const tab of ['התראות', 'אבטחה', 'העדפות']) {
    await tabButton(page, tab).click();
    expect(await unnamedControls(page), `unnamed controls on settings/${tab}`).toEqual([]);
  }
  await page.goto('/help');
  await tabButton(page, 'צור קשר').click();
  expect(await unnamedControls(page), 'unnamed controls on help/contact').toEqual([]);
});

test('6: login/signup password toggles are labelled in Hebrew; the notification bell and menus too', async ({ page, browser }) => {
  const guest = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const guestPage = await guest.newPage();
  await guestPage.goto('/login');
  await guestPage.getByRole('button', { name: 'הצג סיסמה' }).click();
  await expect(guestPage.getByRole('button', { name: 'הסתר סיסמה' })).toBeVisible();
  await guestPage.goto('/signup');
  await expect(guestPage.getByRole('button', { name: 'הצג סיסמה' })).toBeVisible();
  await expect(guestPage.getByRole('button', { name: 'הצג אימות סיסמה' })).toBeVisible();
  await guest.close();

  await page.goto('/patients');
  await dismissReminder(page);
  await expect(page.getByRole('button', { name: /^התראות/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'תפריט פרופיל' })).toBeVisible();
  await expect(page.locator('[aria-label="Profile menu"], [aria-label="Search"], [aria-label="Close menu"]')).toHaveCount(0);
});

test('6: on a phone the tabs wrap instead of being clipped off-screen; the page does not scroll sideways', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  const patientId = await createPatient(page.request, 'Mobile');
  for (const path of [`/patients/${patientId}`, '/sessions', '/reports']) {
    await page.goto(path);
    await dismissReminder(page);
    const tabs = page.locator('nav[aria-label="לשוניות"] button');
    await expect(tabs.first()).toBeVisible();
    for (const tab of await tabs.all()) {
      const box = (await tab.boundingBox())!;
      expect(box.x, `${path}: tab starts inside the screen`).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width, `${path}: tab ends inside the screen`).toBeLessThanOrEqual(375.5);
    }
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth, `${path}: no horizontal page scroll`).toBeLessThanOrEqual(375);
  }
});
