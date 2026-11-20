import { test, expect, request as pwRequest, type Browser, type Page, type APIRequestContext } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { ADMIN_EMAIL, ADMIN_PASSWORD, DEMO_EMAIL, DEMO_PASSWORD } from './helpers';

// End-to-end coverage for the MEDIUM-severity fixes (validation / mass
// assignment / authorization, transcription config, recording limits, goals,
// login hint, encrypted patient documents). Every test creates its own ZZTEST
// records through the API and removes them afterwards.

test.describe.configure({ mode: 'serial' });

const SARAH_STATE = 'test-results/medium-fixes-sarah.json';
const ADMIN_STATE = 'test-results/medium-fixes-admin.json';
const MICHAEL_STATE = 'test-results/medium-fixes-michael.json';
const MICHAEL_EMAIL = 'michael.levi@clinic.co.il';

async function saveLoginState(browser: Browser, file: string, email: string, password: string) {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  // Logins are rate limited (10/min per IP) and earlier spec files in the same
  // run may have used the budget: on a 429, wait a little and try again.
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

const MICHAEL_ID = 'user-2'; // michael.levi@clinic.co.il (seeded, not assigned to ZZTEST patients)

test.beforeAll(async ({ browser }) => {
  test.setTimeout(240_000);
  await saveLoginState(browser, SARAH_STATE, DEMO_EMAIL, DEMO_PASSWORD);
  await saveLoginState(browser, ADMIN_STATE, ADMIN_EMAIL, ADMIN_PASSWORD);
  await saveLoginState(browser, MICHAEL_STATE, MICHAEL_EMAIL, 'password123');
});

test.use({ storageState: SARAH_STATE });

const SARAH_ID = 'user-1';
const created: string[] = [];

async function apiAs(baseURL: string | undefined, state: string): Promise<APIRequestContext> {
  return pwRequest.newContext({ baseURL, storageState: state });
}

async function createPatient(api: APIRequestContext, owner: string, firstName: string): Promise<string> {
  const res = await api.post('/api/patients', {
    data: {
      idNumber: String(Math.floor(100000000 + Math.random() * 899999999)),
      encryptedData: '',
      firstName,
      lastName: 'ZZTEST',
      dateOfBirth: '1990-01-01',
      gender: 'female',
      assignedTherapists: [owner],
      status: 'active',
    },
  });
  expect(res.status()).toBe(201);
  const id = (await res.json()).data.id as string;
  created.push(id);
  return id;
}

async function createSession(api: APIRequestContext, patientId: string, status = 'scheduled'): Promise<string> {
  const res = await api.post('/api/sessions', {
    data: {
      patientId,
      therapistId: SARAH_ID,
      therapistRole: 'psychologist',
      sessionType: 'individual_therapy',
      // A week out keeps the session-reminder popup quiet.
      scheduledAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      duration: 50,
      status,
      location: 'in_person',
      notes: { subjective: '', objective: '', assessment: '', plan: '', interventionsUsed: [] },
    },
  });
  expect(res.status()).toBe(201);
  return (await res.json()).data.id as string;
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

// Raw stored rows for a patient's documents, read straight from the backend the
// server is using (JSON file, or Postgres when DATABASE_URL is set), so the
// tests can prove nothing is stored in plaintext and the cascade leaves no rows.
type RawDocument = { id: string; patientId: string; content: string; meta: string };
async function rawDocuments(patientId: string): Promise<RawDocument[]> {
  if (process.env.DATABASE_URL) {
    const prisma = new PrismaClient();
    try {
      const rows = await prisma.patientDocument.findMany({ where: { patientId } });
      return rows.map((r) => ({ id: r.id, patientId: r.patientId, content: r.content, meta: JSON.stringify(r.payload) }));
    } finally {
      await prisma.$disconnect();
    }
  }
  const file = path.join(process.cwd(), 'data', 'patient-documents.json');
  if (!fs.existsSync(file)) return [];
  const rows = JSON.parse(fs.readFileSync(file, 'utf-8')) as Record<string, string>[];
  return rows
    .filter((r) => r.patientId === patientId)
    .map((r) => ({ id: r.id, patientId: r.patientId, content: r.content, meta: JSON.stringify({ ...r, content: undefined }) }));
}
const pdfBytes = (size = 2048) => {
  const b = Buffer.alloc(size, 0x41);
  b.write('%PDF-1.4\n', 0, 'latin1');
  return b;
};

// ---------------------------------------------------------------- item 9 ----

test('9: a therapist cannot reassign a patient; only an admin can; unknown fields are stripped', async ({ page, baseURL }) => {
  const patientId = await createPatient(page.request, SARAH_ID, 'Assign');

  // Real change by a therapist: refused.
  let res = await page.request.put(`/api/patients/${patientId}`, { data: { assignedTherapists: [SARAH_ID, MICHAEL_ID] } });
  expect(res.status()).toBe(403);
  expect((await res.json()).code).toBe('ADMIN_ONLY');
  res = await page.request.put(`/api/patients/${patientId}`, { data: { assignedTherapists: [MICHAEL_ID] } });
  expect(res.status()).toBe(403);

  // Re-sending the unchanged list (e.g. a full-object form) is harmless.
  res = await page.request.put(`/api/patients/${patientId}`, { data: { assignedTherapists: [SARAH_ID], primaryDiagnosis: 'ZZTEST dx' } });
  expect(res.status()).toBe(200);

  // Unknown / protected fields are dropped; enum values are validated.
  res = await page.request.put(`/api/patients/${patientId}`, { data: { id: 'hijack', createdAt: '2000-01-01', status: 'inactive', isAdmin: true } });
  expect(res.status()).toBe(200);
  const body = (await res.json()).data;
  expect(body.id).toBe(patientId);
  expect(body.status).toBe('inactive');
  expect(body.isAdmin).toBeUndefined();
  expect(new Date(body.createdAt).getFullYear()).not.toBe(2000);
  expect((await page.request.put(`/api/patients/${patientId}`, { data: { status: 'deleted' } })).status()).toBe(400);
  expect((await page.request.put(`/api/patients/${patientId}`, { data: { gender: 'robot' } })).status()).toBe(400);
  expect((await page.request.put(`/api/patients/${patientId}`, { data: 'nope', headers: { 'content-type': 'application/json' } })).status()).toBe(400);

  // A therapist cannot create a patient assigned to someone else, nor to both.
  const base = {
    idNumber: '123456780', encryptedData: '', firstName: 'x', lastName: 'ZZTEST',
    dateOfBirth: '1990-01-01', gender: 'female', status: 'active',
  };
  expect((await page.request.post('/api/patients', { data: { ...base, assignedTherapists: [MICHAEL_ID] } })).status()).toBe(403);
  expect((await page.request.post('/api/patients', { data: { ...base, assignedTherapists: [SARAH_ID, MICHAEL_ID] } })).status()).toBe(403);

  // The admin can reassign; sarah then loses access.
  const admin = await apiAs(baseURL, ADMIN_STATE);
  res = await admin.put(`/api/patients/${patientId}`, { data: { assignedTherapists: [MICHAEL_ID] } });
  expect(res.status()).toBe(200);
  expect((await res.json()).data.assignedTherapists).toEqual([MICHAEL_ID]);
  expect((await page.request.get(`/api/patients/${patientId}`)).status()).toBe(403);
  await admin.dispose();
});

test('9: sessions cannot be moved to a foreign patient or therapist; signed sessions are frozen', async ({ page, baseURL }) => {
  const admin = await apiAs(baseURL, ADMIN_STATE);
  const mine = await createPatient(page.request, SARAH_ID, 'Mine');
  const foreign = await createPatient(admin, MICHAEL_ID, 'Foreign');
  const sessionId = await createSession(page.request, mine);

  expect((await page.request.put(`/api/sessions/${sessionId}`, { data: { patientId: foreign } })).status()).toBe(403);
  expect((await page.request.put(`/api/sessions/${sessionId}`, { data: { therapistId: MICHAEL_ID } })).status()).toBe(403);
  expect((await page.request.put(`/api/sessions/${sessionId}`, { data: { status: 'archived' } })).status()).toBe(400);
  expect((await page.request.put(`/api/sessions/${sessionId}`, { data: { duration: 5 } })).status()).toBe(400);

  // Unknown fields are not stored; a forged signer is replaced by the caller.
  let res = await page.request.put(`/api/sessions/${sessionId}`, { data: { notes: { subjective: 'ZZTEST s' }, signedBy: 'forged', evil: 1 } });
  expect(res.status()).toBe(200);
  let body = (await res.json()).data;
  expect(body.signedBy).toBeUndefined();
  expect(body.evil).toBeUndefined();

  // Sign: server stamps signer + time.
  res = await page.request.put(`/api/sessions/${sessionId}`, { data: { status: 'completed', signedAt: new Date().toISOString(), signedBy: 'forged' } });
  expect(res.status()).toBe(200);
  body = (await res.json()).data;
  expect(body.signedBy).toBe(SARAH_ID);
  expect(body.signedAt).toBeTruthy();

  // Signed => frozen for the therapist.
  res = await page.request.put(`/api/sessions/${sessionId}`, { data: { notes: { subjective: 'tampered' } } });
  expect(res.status()).toBe(409);
  expect((await res.json()).code).toBe('SESSION_SIGNED');
  expect((await page.request.put(`/api/sessions/${sessionId}`, { data: { status: 'cancelled' } })).status()).toBe(409);
  expect((await page.request.delete(`/api/sessions/${sessionId}`)).status()).toBe(409);

  // Unchanged on the server.
  const stored = (await (await page.request.get(`/api/sessions/${sessionId}`)).json()).data;
  expect(stored.notes.subjective).toBe('ZZTEST s');

  // An administrator can still correct it.
  res = await admin.put(`/api/sessions/${sessionId}`, { data: { notes: { subjective: 'admin correction' } } });
  expect(res.status()).toBe(200);
  expect((await res.json()).data.notes.subjective).toBe('admin correction');
  await admin.dispose();
});

test('9: a completed (unsigned) session can still be edited and signed, but not re-opened', async ({ page }) => {
  const patientId = await createPatient(page.request, SARAH_ID, 'Completed');
  const sessionId = await createSession(page.request, patientId);
  expect((await page.request.put(`/api/sessions/${sessionId}`, { data: { status: 'completed' } })).status()).toBe(200);
  expect((await page.request.put(`/api/sessions/${sessionId}`, { data: { notes: { subjective: 'edit before signing' } } })).status()).toBe(200);
  const reopen = await page.request.put(`/api/sessions/${sessionId}`, { data: { status: 'scheduled' } });
  expect(reopen.status()).toBe(409);
  expect((await reopen.json()).code).toBe('SESSION_COMPLETED');
  expect((await page.request.put(`/api/sessions/${sessionId}`, { data: { status: 'completed', signedAt: true } })).status()).toBe(200);
});

test('9: reports take generatedBy from the session; cannot be moved or edited once signed', async ({ page, baseURL }) => {
  const admin = await apiAs(baseURL, ADMIN_STATE);
  const mine = await createPatient(page.request, SARAH_ID, 'RepMine');
  const foreign = await createPatient(admin, MICHAEL_ID, 'RepForeign');
  const reportBody = {
    patientId: mine,
    reportType: 'progress_summary',
    generatedBy: 'someone-else',
    title: 'ZZTEST report',
    dateRange: { start: new Date().toISOString(), end: new Date().toISOString() },
    content: { summary: 'x' },
    status: 'draft',
  };
  let res = await page.request.post('/api/reports', { data: reportBody });
  expect(res.status()).toBe(201);
  const report = (await res.json()).data;
  expect(report.generatedBy).toBe(SARAH_ID);

  expect((await page.request.post('/api/reports', { data: { ...reportBody, status: 'signed' } })).status()).toBe(400);
  expect((await page.request.post('/api/reports', { data: { ...reportBody, reportType: 'nope' } })).status()).toBe(400);
  expect((await page.request.post('/api/reports', { data: { ...reportBody, patientId: foreign } })).status()).toBe(403);

  expect((await page.request.put(`/api/reports/${report.id}`, { data: { patientId: foreign } })).status()).toBe(403);
  expect((await page.request.put(`/api/reports/${report.id}`, { data: { status: 'approved' } })).status()).toBe(400);
  res = await page.request.put(`/api/reports/${report.id}`, { data: { generatedBy: 'forged', title: 'ZZTEST renamed' } });
  expect(res.status()).toBe(200);
  expect((await res.json()).data).toMatchObject({ generatedBy: SARAH_ID, title: 'ZZTEST renamed' });

  res = await page.request.put(`/api/reports/${report.id}`, { data: { status: 'signed', signedBy: 'forged' } });
  expect(res.status()).toBe(200);
  expect((await res.json()).data).toMatchObject({ status: 'signed', signedBy: SARAH_ID });
  res = await page.request.put(`/api/reports/${report.id}`, { data: { title: 'tampered' } });
  expect(res.status()).toBe(409);
  expect((await res.json()).code).toBe('REPORT_SIGNED');
  await admin.dispose();
});

test('9/13: goals take createdBy from the session and validate progress and ownership', async ({ page, baseURL }) => {
  const admin = await apiAs(baseURL, ADMIN_STATE);
  const mine = await createPatient(page.request, SARAH_ID, 'GoalMine');
  const foreign = await createPatient(admin, MICHAEL_ID, 'GoalForeign');

  const goalBody = { patientId: mine, description: 'ZZTEST goal', measurementCriteria: 'crit', createdBy: 'forged' };
  let res = await page.request.post('/api/treatment-goals', { data: goalBody });
  expect(res.status()).toBe(201);
  const goal = (await res.json()).data;
  expect(goal.createdBy).toBe(SARAH_ID);

  expect((await page.request.post('/api/treatment-goals', { data: { ...goalBody, description: '  ' } })).status()).toBe(400);
  expect((await page.request.post('/api/treatment-goals', { data: { ...goalBody, progress: 150 } })).status()).toBe(400);
  expect((await page.request.post('/api/treatment-goals', { data: { ...goalBody, patientId: foreign } })).status()).toBe(403);

  expect((await page.request.put(`/api/treatment-goals/${goal.id}`, { data: { progress: 101 } })).status()).toBe(400);
  expect((await page.request.put(`/api/treatment-goals/${goal.id}`, { data: { status: 'done' } })).status()).toBe(400);
  expect((await page.request.put(`/api/treatment-goals/${goal.id}`, { data: { patientId: foreign } })).status()).toBe(403);
  res = await page.request.put(`/api/treatment-goals/${goal.id}`, { data: { progress: 40, createdBy: 'forged', id: 'x' } });
  expect(res.status()).toBe(200);
  expect((await res.json()).data).toMatchObject({ id: goal.id, progress: 40, createdBy: SARAH_ID });
  await admin.dispose();
});

test('9/12: recordings validate type, size and session ownership; audio is immutable', async ({ page }) => {
  const patientId = await createPatient(page.request, SARAH_ID, 'Rec');
  const sessionId = await createSession(page.request, patientId);
  const other = await createPatient(page.request, SARAH_ID, 'RecOther');
  const base = {
    sessionId, patientId, duration: 1, transcriptionStatus: 'pending', consentObtained: true,
  };

  // Not audio.
  let res = await page.request.post('/api/voice-recordings', {
    data: { ...base, encryptedAudioUrl: 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==' },
  });
  expect(res.status()).toBe(400);
  let body = await res.json();
  expect(body.code).toBe('RECORDING_BAD_TYPE');
  expect(body.error).toMatch(HEBREW);

  // Over 4 MB.
  res = await page.request.post('/api/voice-recordings', {
    data: { ...base, encryptedAudioUrl: 'data:audio/webm;base64,' + 'A'.repeat(4 * 1024 * 1024 + 4) },
  });
  expect(res.status()).toBe(413);
  body = await res.json();
  expect(body.code).toBe('RECORDING_TOO_LARGE');
  expect(body.error).toMatch(HEBREW);

  // Session that belongs to a different patient.
  res = await page.request.post('/api/voice-recordings', {
    data: { ...base, patientId: other, encryptedAudioUrl: 'data:audio/webm;codecs=opus;base64,AAAA' },
  });
  expect(res.status()).toBe(400);

  // Valid.
  res = await page.request.post('/api/voice-recordings', {
    data: { ...base, encryptedAudioUrl: 'data:audio/webm;codecs=opus;base64,AAAA' },
  });
  expect(res.status()).toBe(201);
  const rec = (await res.json()).data;

  // PUT only touches transcript fields.
  res = await page.request.put(`/api/voice-recordings/${rec.id}`, {
    data: {
      encryptedTranscript: 'ZZTEST transcript', encryptedAudioUrl: 'data:audio/webm;base64,BBBB',
      patientId: other, sessionId: 'x',
    },
  });
  expect(res.status()).toBe(200);
  const updated = (await res.json()).data;
  expect(updated.encryptedTranscript).toBe('ZZTEST transcript');
  expect(updated.encryptedAudioUrl).toBe('data:audio/webm;codecs=opus;base64,AAAA');
  expect(updated.patientId).toBe(patientId);
  expect(updated.sessionId).toBe(sessionId);
  expect((await page.request.put(`/api/voice-recordings/${rec.id}`, { data: { transcriptionStatus: 'bogus' } })).status()).toBe(400);
});

test('9: AI summary and insights PATCH endpoints validate their bodies and stamp savedBy', async ({ page }) => {
  const patientId = await createPatient(page.request, SARAH_ID, 'Patch');
  const sessionId = await createSession(page.request, patientId);

  const summaryUrl = `/api/sessions/${sessionId}/summary`;
  const summary = { summary: 'ZZTEST summary', mode: 'mock', generatedAt: new Date().toISOString() };
  expect((await page.request.patch(summaryUrl, { data: { ...summary, mode: 'bogus' } })).status()).toBe(400);
  expect((await page.request.patch(summaryUrl, { data: { ...summary, summary: '' } })).status()).toBe(400);
  expect((await page.request.patch(summaryUrl, { data: { ...summary, generatedAt: 'nope' } })).status()).toBe(400);
  let res = await page.request.patch(summaryUrl, { data: { ...summary, model: null, id: 'x', aiSummary: 'evil' } });
  expect(res.status()).toBe(200);
  const stored = (await (await page.request.get(`/api/sessions/${sessionId}`)).json()).data;
  expect(stored.aiSummary).toMatchObject({ content: 'ZZTEST summary', mode: 'mock', savedBy: SARAH_ID });

  const insightsUrl = `/api/patients/${patientId}/insights`;
  const item = { content: 'ZZTEST pattern', confidence: 0.8 };
  const insights = {
    patterns: [item], progressTrends: [], riskIndicators: [], treatmentGaps: [],
    generatedAt: new Date().toISOString(), mode: 'mock',
  };
  expect((await page.request.patch(insightsUrl, { data: {} })).status()).toBe(400);
  expect((await page.request.patch(insightsUrl, { data: { insights: { ...insights, mode: 'x' } } })).status()).toBe(400);
  expect((await page.request.patch(insightsUrl, { data: { insights: { ...insights, patterns: [{ content: 'x', confidence: 7 }] } } })).status()).toBe(400);
  res = await page.request.patch(insightsUrl, { data: { insights: { ...insights, patientId: 'other', evil: 1, savedBy: 'forged' } } });
  expect(res.status()).toBe(200);
  const saved = (await res.json()).data;
  expect(saved).toMatchObject({ patientId, savedBy: SARAH_ID });
  expect(saved.evil).toBeUndefined();
});

// --------------------------------------------------------------- item 10 ----

test('10: without DEEPGRAM_API_KEY the API answers 503 with a code and Hebrew text', async ({ page }) => {
  const config = await page.request.get('/api/transcribe/config');
  expect(config.status()).toBe(200);
  expect((await config.json()).data).toEqual({ enabled: false });

  const res = await page.request.post('/api/transcribe', { data: { audioData: 'data:audio/webm;base64,AAAA' } });
  expect(res.status()).toBe(503);
  const body = await res.json();
  expect(body.code).toBe('TRANSCRIPTION_NOT_CONFIGURED');
  expect(body.error).toMatch(HEBREW);
  expect(body.error).not.toMatch(/Deepgram API key/i);

});

test('10: unauthenticated callers cannot read the config or transcribe', async ({ baseURL }) => {
  const anon = await pwRequest.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
  expect((await anon.get('/api/transcribe/config')).status()).toBe(401);
  expect((await anon.post('/api/transcribe', { data: { audioData: 'data:audio/webm;base64,AAAA' } })).status()).toBe(401);
  await anon.dispose();
});

// Chromium's fake media devices stand in for a microphone; the MediaRecorder is
// replaced so the recorded size is under test control.
async function installFakeRecorder(page: Page, bytes: number) {
  await page.addInitScript((size) => {
    class FakeRecorder {
      state = 'inactive';
      mimeType = 'audio/webm;codecs=opus';
      ondataavailable: ((e: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;
      static isTypeSupported() { return true; }
      start() { this.state = 'recording'; }
      pause() { this.state = 'paused'; }
      resume() { this.state = 'recording'; }
      stop() {
        this.state = 'inactive';
        this.ondataavailable?.({ data: new Blob([new Uint8Array(size)], { type: 'audio/webm' }) });
        this.onstop?.();
      }
    }
    (window as unknown as { MediaRecorder: unknown }).MediaRecorder = FakeRecorder;
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: async () => ({ getTracks: () => [] }) },
    });
  }, bytes);
}

async function openRecorder(page: Page, patientId: string): Promise<string> {
  const sessionId = await createSession(page.request, patientId);
  await page.goto(`/sessions/${sessionId}`);
  await dismissReminder(page);
  await page.getByRole('button', { name: 'התחל מפגש' }).click();
  await page.getByRole('button', { name: 'הערת קול' }).click();
  await page.getByLabel(/הסכמה להקלטה/).check();
  await page.getByRole('button', { name: 'התחל הקלטה' }).click();
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: /עצור/ }).first().click();
  return sessionId;
}

test('10: the recorder shows a Hebrew "not configured" note instead of a transcribe button', async ({ page }) => {
  await installFakeRecorder(page, 2048);
  const patientId = await createPatient(page.request, SARAH_ID, 'NoKey');
  await openRecorder(page, patientId);
  await expect(page.getByTestId('transcription-not-configured')).toContainText('אינו מוגדר');
  await expect(page.getByRole('button', { name: 'צור תמלול עם זיהוי דוברים' })).toHaveCount(0);
});

test('10: if the server answers 503 at click time the user sees Hebrew, not raw English', async ({ page }) => {
  await installFakeRecorder(page, 2048);
  await page.route('**/api/transcribe/config', (route) => route.fulfill({ json: { data: { enabled: true } } }));
  await page.route('**/api/transcribe', (route) =>
    route.fulfill({ status: 503, json: { error: 'Deepgram API key not configured', code: 'TRANSCRIPTION_NOT_CONFIGURED' } })
  );
  const patientId = await createPatient(page.request, SARAH_ID, 'Late503');
  await openRecorder(page, patientId);
  await page.getByRole('button', { name: 'צור תמלול עם זיהוי דוברים' }).click();
  await expect(page.getByText('אינו מוגדר במערכת. פנו למנהל המערכת')).toBeVisible();
  await expect(page.getByText(/Deepgram API key/)).toHaveCount(0);
});

// --------------------------------------------------------------- item 12 ----

test('12: a recording over 4 MB is blocked in the browser with a Hebrew message and is never uploaded', async ({ page }) => {
  await installFakeRecorder(page, 4.5 * 1024 * 1024);
  let uploads = 0;
  page.on('request', (r) => {
    if (r.method() === 'POST' && r.url().endsWith('/api/voice-recordings')) uploads++;
  });
  const patientId = await createPatient(page.request, SARAH_ID, 'BigRec');
  await openRecorder(page, patientId);
  await expect(page.getByTestId('recording-too-large')).toContainText('4MB');
  await expect(page.getByRole('button', { name: 'שמור הקלטה' })).toBeDisabled();
  expect(uploads).toBe(0);
});

test('12: a normal recording is saved (201) and the recorder closes', async ({ page }) => {
  await installFakeRecorder(page, 4096);
  const patientId = await createPatient(page.request, SARAH_ID, 'OkRec');
  const sessionId = await openRecorder(page, patientId);
  await expect(page.getByTestId('recording-too-large')).toHaveCount(0);
  const upload = page.waitForResponse((r) => r.url().endsWith('/api/voice-recordings') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'שמור הקלטה' }).click();
  expect((await upload).status()).toBe(201);
  const rows = (await (await page.request.get(`/api/voice-recordings?sessionId=${sessionId}`)).json()).data;
  expect(rows).toHaveLength(1);
  expect(rows[0].encryptedAudioUrl.startsWith('data:audio/webm')).toBe(true);
});

test('12: a server-side rejection is shown inside the recorder (Hebrew), not swallowed', async ({ page }) => {
  await installFakeRecorder(page, 4096);
  await page.route('**/api/voice-recordings', (route) =>
    route.request().method() === 'POST'
      ? route.fulfill({ status: 413, body: 'Request Entity Too Large' })
      : route.continue()
  );
  const patientId = await createPatient(page.request, SARAH_ID, 'Srv413');
  await openRecorder(page, patientId);
  await page.getByRole('button', { name: 'שמור הקלטה' }).click();
  await expect(page.getByText(/גדולים מדי \(מעל 4MB\)/)).toBeVisible();
});

// --------------------------------------------------------------- item 13 ----

test('13: goals tab: add a goal, validate the form, update progress', async ({ page }) => {
  const patientId = await createPatient(page.request, SARAH_ID, 'GoalsUI');
  await page.goto(`/patients/${patientId}`);
  await dismissReminder(page);
  await page.getByRole('button', { name: /מטרות/ }).first().click();
  await expect(page.getByText('אין מטרות טיפול עדיין')).toBeVisible();

  // Validation: empty submit shows Hebrew errors and sends nothing.
  let posts = 0;
  page.on('request', (r) => {
    if (r.method() === 'POST' && r.url().endsWith('/api/treatment-goals')) posts++;
  });
  await page.getByRole('button', { name: 'הוסף מטרה חדשה' }).click();
  await page.getByRole('button', { name: 'הוסף מטרה', exact: true }).click();
  await expect(page.getByText('יש להזין תיאור מטרה')).toBeVisible();
  await expect(page.getByText('יש להזין קריטריון מדידה')).toBeVisible();
  expect(posts).toBe(0);

  await page.getByLabel('תיאור המטרה').fill('ZZTEST הפחתת חרדה');
  await page.getByLabel('קריטריון מדידה').fill('ציון GAD-7 מתחת ל-10');
  await page.getByLabel('תאריך יעד (אופציונלי)').fill('2027-06-30');
  await page.getByRole('button', { name: 'הוסף מטרה', exact: true }).click();

  await expect(page.getByTestId('goals-feedback')).toContainText('המטרה נוספה בהצלחה');
  const card = page.getByTestId('goal-card').filter({ hasText: 'ZZTEST הפחתת חרדה' });
  await expect(card).toBeVisible();
  await expect(card.getByText('פעילה')).toBeVisible();
  let goals = (await (await page.request.get(`/api/treatment-goals?patientId=${patientId}`)).json()).data;
  expect(goals).toHaveLength(1);
  expect(goals[0]).toMatchObject({
    patientId, description: 'ZZTEST הפחתת חרדה', measurementCriteria: 'ציון GAD-7 מתחת ל-10',
    progress: 0, status: 'active', createdBy: SARAH_ID,
  });
  expect(new Date(goals[0].targetDate).getUTCFullYear()).toBe(2027);

  // Update progress.
  await card.getByRole('button', { name: 'עדכן התקדמות' }).click();
  await page.getByLabel('התקדמות (%)').fill('60');
  await page.getByRole('button', { name: 'שמור התקדמות' }).click();
  await expect(page.getByTestId('goals-feedback')).toContainText('התקדמות המטרה עודכנה');
  goals = (await (await page.request.get(`/api/treatment-goals?patientId=${patientId}`)).json()).data;
  expect(goals[0].progress).toBe(60);
  expect(goals[0].status).toBe('active');

  // 100% proposes "achieved".
  await card.getByRole('button', { name: 'עדכן התקדמות' }).click();
  await page.getByLabel('התקדמות (%)').fill('100');
  await expect(page.getByLabel('סטטוס')).toHaveValue('achieved');
  await page.getByRole('button', { name: 'שמור התקדמות' }).click();
  await expect(card.getByText('הושגה')).toBeVisible();
  goals = (await (await page.request.get(`/api/treatment-goals?patientId=${patientId}`)).json()).data;
  expect(goals[0]).toMatchObject({ progress: 100, status: 'achieved' });
});

test('13: a failed goal save shows a Hebrew error and keeps the form open', async ({ page }) => {
  const patientId = await createPatient(page.request, SARAH_ID, 'GoalsErr');
  await page.goto(`/patients/${patientId}`);
  await dismissReminder(page);
  await page.getByRole('button', { name: /מטרות/ }).first().click();
  await page.route('**/api/treatment-goals', (route) =>
    route.request().method() === 'POST' ? route.fulfill({ status: 500, json: { error: 'Failed to create goal' } }) : route.continue()
  );
  await page.getByRole('button', { name: 'הוסף מטרה חדשה' }).click();
  await page.getByLabel('תיאור המטרה').fill('ZZTEST x');
  await page.getByLabel('קריטריון מדידה').fill('y');
  await page.getByRole('button', { name: 'הוסף מטרה', exact: true }).click();
  await expect(page.getByText('שגיאה בהוספת המטרה')).toBeVisible();
  await expect(page.getByLabel('תיאור המטרה')).toHaveValue('ZZTEST x');
});

// --------------------------------------------------------------- item 14 ----

// Against `next dev` (the default webServer) the hint is shown; against a
// production build (`next start`, run with PLAYWRIGHT_PROD_SERVER=1) it must be
// absent, both from the page and from the client bundle.
test('14: the demo credentials hint is only shown outside production', async ({ browser }) => {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  const scripts: string[] = [];
  page.on('response', async (r) => {
    if (r.url().includes('/_next/static/') && r.url().endsWith('.js')) {
      scripts.push(await r.text().catch(() => ''));
    }
  });
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  if (process.env.PLAYWRIGHT_PROD_SERVER === '1') {
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.getByTestId('demo-credentials')).toHaveCount(0);
    await expect(page.getByText('password123')).toHaveCount(0);
    expect(scripts.length).toBeGreaterThan(0);
    expect(scripts.some((t) => t.includes('password123') || t.includes('לצורך הדגמה'))).toBe(false);
  } else {
    await expect(page.getByTestId('demo-credentials')).toContainText('password123');
  }
  await context.close();
});

// --------------------------------------------------------------- item 11 ----

async function uploadApi(api: APIRequestContext, patientId: string, name: string, mimeType: string, buffer: Buffer) {
  return api.post(`/api/patients/${patientId}/documents`, { multipart: { file: { name, mimeType, buffer } } });
}

test('11: documents API: upload, list, download (exact bytes), view, delete', async ({ page }) => {
  const patientId = await createPatient(page.request, SARAH_ID, 'Docs');
  const bytes = pdfBytes(5000);
  const name = 'הסכמה חתומה ZZTEST.pdf';

  let res = await uploadApi(page.request, patientId, name, 'application/pdf', bytes);
  expect(res.status()).toBe(201);
  const doc = (await res.json()).data;
  expect(doc).toMatchObject({ patientId, name, mimeType: 'application/pdf', size: 5000, uploadedBy: SARAH_ID });
  expect(doc.content).toBeUndefined();

  // At rest: ciphertext only, for both the content and the file name.
  const raw = await rawDocuments(patientId);
  expect(raw).toHaveLength(1);
  expect(raw[0].content.startsWith('enc:v1:')).toBe(true);
  expect(raw[0].content).not.toContain(bytes.toString('base64').slice(0, 64));
  expect(raw[0].content).not.toContain('JVBERi0'); // base64 of "%PDF-"
  expect(raw[0].meta).not.toContain('הסכמה');
  expect(raw[0].meta).not.toContain('ZZTEST');
  expect(raw[0].meta).toContain('enc:v1:');

  const list = (await (await page.request.get(`/api/patients/${patientId}/documents`)).json()).data;
  expect(list).toHaveLength(1);
  expect(list[0].name).toBe(name);

  res = await page.request.get(`/api/patients/${patientId}/documents/${doc.id}`);
  expect(res.status()).toBe(200);
  expect(Buffer.compare(await res.body(), bytes)).toBe(0);
  expect(res.headers()['content-type']).toBe('application/pdf');
  expect(res.headers()['content-disposition']).toMatch(/^attachment;/);
  expect(res.headers()['content-disposition']).toContain(encodeURIComponent(name));
  expect(res.headers()['x-content-type-options']).toBe('nosniff');
  expect(res.headers()['cache-control']).toContain('no-store');

  res = await page.request.get(`/api/patients/${patientId}/documents/${doc.id}?inline=1`);
  expect(res.headers()['content-disposition']).toMatch(/^inline;/);

  res = await page.request.delete(`/api/patients/${patientId}/documents/${doc.id}`);
  expect(res.status()).toBe(200);
  expect((await page.request.get(`/api/patients/${patientId}/documents/${doc.id}`)).status()).toBe(404);
  expect((await (await page.request.get(`/api/patients/${patientId}/documents`)).json()).data).toHaveLength(0);
});

test('11: documents API: size, type and content are enforced with Hebrew errors', async ({ page }) => {
  const patientId = await createPatient(page.request, SARAH_ID, 'DocsBad');

  // Exactly 4 MB is fine; one byte more is 413.
  let res = await uploadApi(page.request, patientId, 'edge.pdf', 'application/pdf', pdfBytes(4 * 1024 * 1024));
  expect(res.status()).toBe(201);
  res = await uploadApi(page.request, patientId, 'big.pdf', 'application/pdf', pdfBytes(4 * 1024 * 1024 + 1));
  expect(res.status()).toBe(413);
  let body = await res.json();
  expect(body.code).toBe('DOCUMENT_TOO_LARGE');
  expect(body.error).toMatch(HEBREW);
  res = await uploadApi(page.request, patientId, 'huge.pdf', 'application/pdf', pdfBytes(6 * 1024 * 1024));
  expect(res.status()).toBe(413);

  // Wrong type / wrong extension / content that does not match.
  const exe = Buffer.concat([Buffer.from([0x4d, 0x5a, 0x90, 0x00]), Buffer.alloc(100)]);
  for (const [name, mime, buf, code] of [
    ['evil.exe', 'application/x-msdownload', exe, 'DOCUMENT_BAD_TYPE'],
    ['page.html', 'text/html', Buffer.from('<script>alert(1)</script>'), 'DOCUMENT_BAD_TYPE'],
    ['vector.svg', 'image/svg+xml', Buffer.from('<svg/>'), 'DOCUMENT_BAD_TYPE'],
    ['disguised.pdf', 'application/pdf', exe, 'DOCUMENT_CONTENT_MISMATCH'],
    ['mime-lie.pdf', 'text/html', pdfBytes(100), 'DOCUMENT_BAD_TYPE'],
    ['empty.txt', 'text/plain', Buffer.alloc(0), 'DOCUMENT_EMPTY'],
  ] as const) {
    res = await uploadApi(page.request, patientId, name, mime, Buffer.from(buf));
    expect(res.status(), name).toBe(400);
    body = await res.json();
    expect(body.code, name).toBe(code);
    expect(body.error, name).toMatch(HEBREW);
  }

  // Not multipart / no file field.
  res = await page.request.post(`/api/patients/${patientId}/documents`, { data: { file: 'x' } });
  expect(res.status()).toBe(400);
  res = await page.request.post(`/api/patients/${patientId}/documents`, { multipart: { other: 'x' } });
  expect(res.status()).toBe(400);

  // Only the 4 MB edge file was stored.
  expect((await (await page.request.get(`/api/patients/${patientId}/documents`)).json()).data).toHaveLength(1);
});

test('11: documents API: only assigned therapists and admins; ids are scoped to the patient in the URL', async ({ page, baseURL }) => {
  const admin = await apiAs(baseURL, ADMIN_STATE);
  const michael = await apiAs(baseURL, MICHAEL_STATE);
  const anon = await pwRequest.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
  const patientId = await createPatient(page.request, SARAH_ID, 'DocsAuthz');
  const otherPatient = await createPatient(page.request, SARAH_ID, 'DocsAuthz2');
  const doc = (await (await uploadApi(page.request, patientId, 'a.txt', 'text/plain', Buffer.from('hello'))).json()).data;
  const url = `/api/patients/${patientId}/documents`;

  // Not assigned (michael): no list, upload, download or delete.
  expect((await michael.get(url)).status()).toBe(403);
  expect((await uploadApi(michael, patientId, 'x.txt', 'text/plain', Buffer.from('x'))).status()).toBe(403);
  expect((await michael.get(`${url}/${doc.id}`)).status()).toBe(403);
  expect((await michael.delete(`${url}/${doc.id}`)).status()).toBe(403);
  // Not logged in.
  expect((await anon.get(url)).status()).toBe(401);
  expect((await anon.get(`${url}/${doc.id}`)).status()).toBe(401);
  // A document id never resolves through a different patient's path.
  expect((await page.request.get(`/api/patients/${otherPatient}/documents/${doc.id}`)).status()).toBe(404);
  expect((await page.request.delete(`/api/patients/${otherPatient}/documents/${doc.id}`)).status()).toBe(404);
  // Unknown patient.
  expect((await page.request.get('/api/patients/nope/documents')).status()).toBe(404);

  // Admin can read, upload and delete.
  expect((await admin.get(`${url}/${doc.id}`)).status()).toBe(200);
  const adminUpload = await uploadApi(admin, patientId, 'b.txt', 'text/plain', Buffer.from('from admin'));
  expect(adminUpload.status()).toBe(201);
  expect((await admin.delete(`${url}/${(await adminUpload.json()).data.id}`)).status()).toBe(200);

  // Still intact for the owner.
  expect((await page.request.get(`${url}/${doc.id}`)).status()).toBe(200);
  await Promise.all([admin.dispose(), michael.dispose(), anon.dispose()]);
});

test('11: deleting a patient also deletes its documents', async ({ page, baseURL }) => {
  const patientId = await createPatient(page.request, SARAH_ID, 'DocsCascade');
  const doc = (await (await uploadApi(page.request, patientId, 'a.txt', 'text/plain', Buffer.from('hello'))).json()).data;
  await uploadApi(page.request, patientId, 'b.txt', 'text/plain', Buffer.from('world'));
  expect(await rawDocuments(patientId)).toHaveLength(2);
  expect((await page.request.delete(`/api/patients/${patientId}`)).status()).toBe(200);
  created.splice(created.indexOf(patientId), 1);
  expect(await rawDocuments(patientId)).toHaveLength(0);

  // Re-create a patient with the same id is impossible, so look the document up
  // through a fresh patient path as admin: it must not resolve anywhere.
  const admin = await apiAs(baseURL, ADMIN_STATE);
  const probe = await createPatient(admin, SARAH_ID, 'DocsProbe');
  expect((await admin.get(`/api/patients/${probe}/documents/${doc.id}`)).status()).toBe(404);
  expect((await admin.get(`/api/patients/${patientId}/documents`)).status()).toBe(404);
  await admin.dispose();
});

test('11: documents tab: upload, list, download, view link and delete', async ({ page }) => {
  const patientId = await createPatient(page.request, SARAH_ID, 'DocsUI');
  await page.goto(`/patients/${patientId}`);
  await dismissReminder(page);
  await page.getByRole('button', { name: /מסמכים/ }).first().click();
  await expect(page.getByTestId('documents-empty')).toBeVisible();

  const bytes = pdfBytes(3000);
  await page.getByTestId('document-file-input').setInputFiles({ name: 'intake ZZTEST.pdf', mimeType: 'application/pdf', buffer: bytes });
  await expect(page.getByTestId('documents-feedback')).toContainText('המסמך הועלה בהצלחה');
  const row = page.getByTestId('document-row').filter({ hasText: 'intake ZZTEST.pdf' });
  await expect(row).toBeVisible();
  await expect(row).toContainText('2.9 KB');

  // Download returns the exact bytes.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    row.getByRole('link', { name: 'הורדה' }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('intake ZZTEST.pdf');
  const path = await download.path();
  expect(Buffer.compare(require('fs').readFileSync(path), bytes)).toBe(0);

  // View link opens the inline URL.
  await expect(row.getByRole('link', { name: 'צפייה' })).toHaveAttribute('href', /\?inline=1$/);

  // The document survives a reload.
  await page.reload();
  await page.getByRole('button', { name: /מסמכים/ }).first().click();
  await expect(page.getByTestId('document-row')).toHaveCount(1);

  // Delete (confirm dialog).
  page.once('dialog', (d) => d.accept());
  await page.getByTestId('document-row').getByRole('button', { name: 'מחיקה' }).click();
  await expect(page.getByTestId('documents-empty')).toBeVisible();
  expect((await (await page.request.get(`/api/patients/${patientId}/documents`)).json()).data).toHaveLength(0);
});

test('11: documents tab: over 4 MB and wrong type are rejected in the browser with Hebrew text, nothing is sent', async ({ page }) => {
  const patientId = await createPatient(page.request, SARAH_ID, 'DocsUIBad');
  let uploads = 0;
  page.on('request', (r) => {
    if (r.method() === 'POST' && r.url().includes('/documents')) uploads++;
  });
  await page.goto(`/patients/${patientId}`);
  await dismissReminder(page);
  await page.getByRole('button', { name: /מסמכים/ }).first().click();

  const input = page.getByTestId('document-file-input');
  await input.setInputFiles({ name: 'big.pdf', mimeType: 'application/pdf', buffer: pdfBytes(4 * 1024 * 1024 + 1) });
  await expect(page.getByTestId('documents-feedback')).toContainText('גדול מדי');
  await expect(page.getByTestId('documents-feedback')).toContainText('4MB');

  await input.setInputFiles({ name: 'run.exe', mimeType: 'application/x-msdownload', buffer: Buffer.from([0x4d, 0x5a, 0, 0]) });
  await expect(page.getByTestId('documents-feedback')).toContainText('סוג הקובץ אינו נתמך');

  expect(uploads).toBe(0);
  await expect(page.getByTestId('documents-empty')).toBeVisible();
});

test('11: documents tab: a server-side rejection is shown as Hebrew text', async ({ page }) => {
  const patientId = await createPatient(page.request, SARAH_ID, 'DocsUISrv');
  await page.goto(`/patients/${patientId}`);
  await dismissReminder(page);
  await page.getByRole('button', { name: /מסמכים/ }).first().click();
  // A file that passes the client check (right extension and MIME) but whose
  // content is not a PDF: the server's magic-byte check must catch it.
  await page.getByTestId('document-file-input').setInputFiles({
    name: 'fake.pdf', mimeType: 'application/pdf', buffer: Buffer.from('MZ-not-a-pdf'),
  });
  await expect(page.getByTestId('documents-feedback')).toContainText('תוכן הקובץ אינו תואם');
  await expect(page.getByTestId('documents-empty')).toBeVisible();
});
