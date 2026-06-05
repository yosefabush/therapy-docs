// Captures screenshots of the full therapist workflow for the guide page.
// Uses the locally-installed Playwright chromium (no network download needed).

import { chromium } from 'playwright-core';
import { mkdirSync } from 'fs';
import path from 'path';

const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const OUT = path.resolve('public/guide');
mkdirSync(OUT, { recursive: true });

const CREDS = { email: 'dr.sarah.cohen@clinic.co.il', password: 'password123' };

const run = async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    locale: 'he-IL',
  });
  const page = await context.newPage();

  const goShot = async (url, name, { full = false, waitText, waitMs = 1500 } = {}) => {
    await page.goto(`${BASE}${url}`, { waitUntil: 'domcontentloaded' });
    if (waitText) {
      await page.getByText(waitText, { exact: false }).first()
        .waitFor({ timeout: 12000 }).catch(() => console.warn('  (waitText not found:', name, ')'));
    }
    await page.waitForTimeout(waitMs);
    await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: full });
    console.log('captured', name, full ? '(full)' : '');
  };

  // 1. Login page (before authenticating)
  await goShot('/login', '01-login', { waitText: 'התחברות' });

  // Authenticate, ticking "remember me" so auth persists in localStorage.
  await page.fill('input[type="email"]', CREDS.email);
  await page.fill('input[type="password"]', CREDS.password);
  await page.getByText('זכור אותי').click().catch(() => {});
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 15000 }).catch(() => {});
  await page.getByText('ברוך שובך', { exact: false }).first()
    .waitFor({ timeout: 15000 }).catch(() => console.warn('  (dashboard welcome not found)'));
  await page.waitForTimeout(1500);

  // 2. Dashboard
  await page.screenshot({ path: path.join(OUT, '02-dashboard.png'), fullPage: true });
  console.log('captured 02-dashboard (full)');

  // 3..10
  await goShot('/patients', '03-patients', { full: true, waitText: 'מטופלים' });
  await goShot('/patients/patient-1', '04-patient-detail', { full: true, waitText: 'מטופל' });
  await goShot('/sessions', '05-sessions', { full: true, waitText: 'מפגשים' });
  await goShot('/sessions/session-1', '06-session-detail', { full: true, waitText: 'מפגש' });
  await goShot('/reports', '07-reports', { full: true, waitText: 'דוח' });
  await goShot('/insights', '08-insights', { full: true, waitText: 'תובנות' });
  await goShot('/settings', '09-settings', { full: true, waitText: 'הגדרות' });
  await goShot('/help', '10-help', { full: true, waitText: 'עזרה' });

  await browser.close();
  console.log('DONE');
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
