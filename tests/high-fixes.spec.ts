import { test, expect, request as pwRequest, type Browser, type Page } from '@playwright/test';
import { loginViaForm, trackLogouts, ADMIN_EMAIL, ADMIN_PASSWORD, DEMO_EMAIL, DEMO_PASSWORD } from './helpers';

// End-to-end coverage for the HIGH-severity fixes. Every test creates its own
// ZZTEST records through the API and removes them afterwards (which also
// exercises the patient delete cascade), so the seeded data is left untouched.

// The JSON store has no cross-request transactions, so these tests share state
// safely only when they run one at a time.
test.describe.configure({ mode: 'serial' });

// Logins are rate limited (10/min per IP), so each role logs in once and the
// tests reuse the saved session cookie instead of logging in again.
const SARAH_STATE = 'test-results/high-fixes-sarah.json';
const ADMIN_STATE = 'test-results/high-fixes-admin.json';
const MICHAEL_STATE = 'test-results/high-fixes-michael.json';

async function saveLoginState(browser: Browser, file: string, email: string, password: string) {
  // Start from an empty state: the file-level storageState does not exist yet.
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  await loginViaForm(page, email, password);
  await context.storageState({ path: file });
  await context.close();
}

test.beforeAll(async ({ browser }) => {
  await saveLoginState(browser, SARAH_STATE, DEMO_EMAIL, DEMO_PASSWORD);
  await saveLoginState(browser, ADMIN_STATE, ADMIN_EMAIL, ADMIN_PASSWORD);
  await saveLoginState(browser, MICHAEL_STATE, 'michael.levi@clinic.co.il', 'password123');
});

// Default `page` is already logged in as the demo therapist (sarah).
test.use({ storageState: SARAH_STATE });

const THERAPIST_ID = 'user-1'; // dr.sarah.cohen@clinic.co.il (the demo login)
const created: string[] = [];

async function createPatient(page: Page, firstName: string): Promise<string> {
  const res = await page.request.post('/api/patients', {
    data: {
      idNumber: String(Math.floor(100000000 + Math.random() * 899999999)),
      encryptedData: '',
      firstName,
      lastName: 'ZZTEST',
      dateOfBirth: '1990-01-01',
      gender: 'female',
      assignedTherapists: [THERAPIST_ID],
      status: 'active',
    },
  });
  expect(res.status()).toBe(201);
  const id = (await res.json()).data.id as string;
  created.push(id);
  return id;
}

async function createSession(page: Page, patientId: string, status: string): Promise<string> {
  const res = await page.request.post('/api/sessions', {
    data: {
      patientId,
      therapistId: THERAPIST_ID,
      therapistRole: 'psychologist',
      sessionType: 'individual_therapy',
      // Upcoming sessions are a week out so the session-reminder popup stays quiet.
      scheduledAt: new Date(Date.now() + (status === 'scheduled' ? 7 : -1) * 24 * 3600 * 1000).toISOString(),
      duration: 50,
      status,
      location: 'in_person',
      notes: { subjective: '', objective: '', assessment: '', plan: '', interventionsUsed: [] },
    },
  });
  expect(res.status()).toBe(201);
  return (await res.json()).data.id as string;
}

// A seeded session close to "now" can pop the session-reminder dialog over the
// page; dismiss it so it never intercepts the clicks under test.
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

async function getSessionApi(page: Page, id: string) {
  const res = await page.request.get(`/api/sessions/${id}`);
  expect(res.status()).toBe(200);
  return (await res.json()).data;
}

test.afterEach(async ({ baseURL }) => {
  if (created.length === 0) return;
  // Use a fresh API context so cleanup works even after the logout test.
  const api = await pwRequest.newContext({ baseURL, storageState: SARAH_STATE });
  for (const id of created.splice(0)) {
    await api.delete(`/api/patients/${id}`);
  }
  await api.dispose();
});

test('session notes: save draft keeps the status, complete sets completed', async ({ page }) => {
  const patientId = await createPatient(page, 'Draft');
  const sessionId = await createSession(page, patientId, 'scheduled');

  await page.goto(`/sessions/${sessionId}`);
  await dismissReminder(page);
  await page.getByRole('button', { name: 'התחל מפגש' }).click();
  await page.getByLabel('סובייקטיבי (S)').fill('דיווח מטופל - טיוטה');

  await page.getByRole('button', { name: 'שמור טיוטה' }).click();
  await expect(page.getByTestId('session-feedback')).toContainText('הטיוטה נשמרה');
  let saved = await getSessionApi(page, sessionId);
  expect(saved.notes.subjective).toBe('דיווח מטופל - טיוטה');
  expect(saved.status).toBe('scheduled'); // draft does not change the status

  await page.getByLabel('הערכה (A)').fill('הערכה קלינית');
  await page.getByRole('button', { name: 'השלם וחתום' }).click();
  await expect(page.getByTestId('session-feedback')).toContainText('הושלם');
  saved = await getSessionApi(page, sessionId);
  expect(saved.status).toBe('completed');
  expect(saved.notes.assessment).toBe('הערכה קלינית');
  expect(saved.signedAt).toBeFalsy();

  // Persisted across a reload.
  await page.reload();
  await expect(page.getByText('דיווח מטופל - טיוטה').first()).toBeVisible();
});

test('session notes: a failed save shows an error and keeps the form', async ({ page }) => {
  const patientId = await createPatient(page, 'SaveErr');
  const sessionId = await createSession(page, patientId, 'scheduled');

  await page.goto(`/sessions/${sessionId}`);
  await dismissReminder(page);
  await page.getByRole('button', { name: 'התחל מפגש' }).click();
  await page.route(`**/api/sessions/${sessionId}`, (route) =>
    route.request().method() === 'PUT' ? route.fulfill({ status: 500, json: { error: 'boom' } }) : route.continue()
  );
  await page.getByLabel('סובייקטיבי (S)').fill('לא יישמר');
  await page.getByRole('button', { name: 'שמור טיוטה' }).click();
  await expect(page.getByTestId('session-feedback')).toContainText('נכשלה');
  await expect(page.getByLabel('סובייקטיבי (S)')).toHaveValue('לא יישמר');
});

test('signing persists the signature and completed status, then navigates', async ({ page }) => {
  const patientId = await createPatient(page, 'Sign');
  const sessionId = await createSession(page, patientId, 'completed');
  expect((await getSessionApi(page, sessionId)).signedAt).toBeFalsy();

  await page.goto(`/sessions/${sessionId}`);
  await dismissReminder(page);
  await page.getByRole('button', { name: 'חתימה והשלמה' }).click();
  await page.getByRole('button', { name: 'חתום על התיעוד' }).click();
  await page.waitForURL((url) => url.pathname === '/sessions');

  const signed = await getSessionApi(page, sessionId);
  expect(signed.status).toBe('completed');
  expect(signed.signedAt).toBeTruthy();
  expect(signed.signedBy).toBe(THERAPIST_ID);

  await page.goto(`/sessions/${sessionId}`);
  await dismissReminder(page);
  await expect(page.getByText('✓ חתום')).toBeVisible();
  await expect(page.getByRole('button', { name: 'חתימה והשלמה' })).toHaveCount(0);
});

test('admin sees all patients and sessions, a therapist only their own', async ({ page, browser }) => {
  const patientId = await createPatient(page, 'AdminSees');
  await createSession(page, patientId, 'completed');

  const adminContext = await browser.newContext({ storageState: ADMIN_STATE });
  const adminPage = await adminContext.newPage();

  await adminPage.goto('/patients');
  await expect(adminPage.getByText('AdminSees ZZTEST').first()).toBeVisible({ timeout: 20_000 });
  await expect(adminPage.getByText('אין מטופלים')).toHaveCount(0);

  await adminPage.goto('/sessions');
  await adminPage.getByRole('button', { name: /ממתינים לחתימה/ }).click();
  await expect(adminPage.getByText('AdminSees ZZTEST').first()).toBeVisible({ timeout: 20_000 });
  await adminContext.close();

  // Another therapist (not assigned to this patient) must NOT see it.
  const otherContext = await browser.newContext({ storageState: MICHAEL_STATE });
  const otherPage = await otherContext.newPage();
  await otherPage.goto('/patients');
  await expect(otherPage.getByText('חיפוש').first().or(otherPage.locator('main')).first()).toBeVisible({ timeout: 20_000 });
  await expect(otherPage.getByText('AdminSees ZZTEST')).toHaveCount(0);
  await otherContext.close();
});

test('header logout calls /api/auth/logout and invalidates API access', async ({ browser }) => {
  // Logout now really revokes the token, so use a login of its own instead of the shared state.
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  await loginViaForm(page, DEMO_EMAIL, DEMO_PASSWORD);
  const logouts = trackLogouts(page);
  await page.goto('/patients');
  await dismissReminder(page);
  expect((await page.request.get('/api/patients')).status()).toBe(200);

  await page.getByRole('button', { name: 'תפריט פרופיל' }).click();
  const logoutResponse = page.waitForResponse(
    (r) => r.url().includes('/api/auth/logout') && r.request().method() === 'POST'
  );
  await page.getByRole('button', { name: 'התנתקות' }).click();
  expect((await logoutResponse).ok()).toBe(true);
  await page.waitForURL((url) => url.pathname === '/login');

  await expect.poll(() => logouts.count()).toBe(1);
  expect((await page.request.get('/api/patients')).status()).toBe(401);
  expect((await page.request.get('/api/auth/me')).status()).toBe(401);

  // Protected pages bounce back to the login screen.
  await page.goto('/patients');
  await page.waitForURL((url) => url.pathname === '/login');
  await context.close();
});

test('/reports: "צור דוח" creates a report with the title and shows it', async ({ page }) => {
  const patientId = await createPatient(page, 'RepNew');
  await createSession(page, patientId, 'completed');

  await page.goto('/reports');
  await dismissReminder(page);
  await page.getByRole('button', { name: 'דוח חדש' }).first().click();
  await page.getByLabel('סוג דוח').selectOption('progress_summary');
  await page.getByLabel('מטופל', { exact: true }).selectOption(patientId);
  await page.getByLabel('כותרת', { exact: true }).fill('ZZTEST דוח רבעוני');
  await page.getByRole('button', { name: 'צור דוח' }).click();

  await expect(page.getByText('ZZTEST דוח רבעוני').first()).toBeVisible({ timeout: 20_000 });
  const res = await page.request.get(`/api/reports?patientId=${patientId}`);
  const reports = (await res.json()).data;
  expect(reports).toHaveLength(1);
  expect(reports[0]).toMatchObject({
    patientId,
    reportType: 'progress_summary',
    title: 'ZZTEST דוח רבעוני',
    generatedBy: THERAPIST_ID,
    status: 'draft',
  });
  expect(reports[0].content.summary.length).toBeGreaterThan(0);
});

test('patient page: generate + "שמור דוח" persists the report', async ({ page }) => {
  const patientId = await createPatient(page, 'RepSave');
  await createSession(page, patientId, 'completed');

  await page.goto(`/patients/${patientId}`);
  await dismissReminder(page);
  await page.getByRole('button', { name: 'דוחות' }).click();
  await page.getByRole('button', { name: 'צור דוח באמצעות AI' }).click();
  await page.getByRole('button', { name: 'שמור דוח' }).click();
  await expect(page.getByRole('button', { name: 'שמור דוח' })).toHaveCount(0, { timeout: 20_000 });

  const res = await page.request.get(`/api/reports?patientId=${patientId}`);
  const reports = (await res.json()).data;
  expect(reports).toHaveLength(1);
  expect(reports[0]).toMatchObject({ patientId, reportType: 'progress_summary', status: 'draft' });
  await expect(page.getByText('דוחות קודמים')).toBeVisible();
});

test('session summary route works on the active backend (no 404)', async ({ page }) => {
  const patientId = await createPatient(page, 'Summary');
  const sessionId = await createSession(page, patientId, 'completed');
  const res = await page.request.get(`/api/sessions/${sessionId}/summary`);
  expect(res.status()).toBe(200);
});

test('deleting a patient removes its sessions, goals, reports and recordings', async ({ page, browser }) => {
  const patientId = await createPatient(page, 'Cascade');
  const sessionId = await createSession(page, patientId, 'completed');
  const post = async (url: string, data: unknown) => {
    const res = await page.request.post(url, { data });
    expect(res.status(), url).toBe(201);
  };
  await post('/api/treatment-goals', {
    patientId, description: 'ZZTEST goal', measurementCriteria: 'x', createdBy: THERAPIST_ID,
  });
  await post('/api/reports', {
    patientId, reportType: 'progress_summary', generatedBy: THERAPIST_ID,
    dateRange: { start: new Date().toISOString(), end: new Date().toISOString() },
    content: { summary: 'x' }, status: 'draft',
  });
  await post('/api/voice-recordings', {
    sessionId, patientId, duration: 1, encryptedAudioUrl: 'data:audio/webm;base64,AAAA',
    transcriptionStatus: 'completed', encryptedTranscript: 'ZZTEST transcript', consentObtained: true,
  });

  expect((await page.request.delete(`/api/patients/${patientId}`)).status()).toBe(200);
  created.splice(created.indexOf(patientId), 1);

  // An admin sees every row, so a leftover orphan would show up here.
  const adminContext = await browser.newContext({ storageState: ADMIN_STATE });
  const admin = await adminContext.newPage();
  for (const url of ['/api/sessions', '/api/treatment-goals', '/api/reports', '/api/voice-recordings']) {
    const rows = (await (await admin.request.get(url)).json()).data as { patientId: string }[];
    expect(rows.filter((r) => r.patientId === patientId), url).toHaveLength(0);
  }
  await adminContext.close();
});
