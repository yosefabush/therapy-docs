# Testing Patterns

**Analysis Date:** 2026-01-22

## Test Framework

**Runner:**
- Playwright v1.57.0 (installed in devDependencies)
- Config: `C:\Users\Yosefg\AI\AI PILOT\therapy-docs\therapy-docs\playwright.config.ts`

**Assertion Library:**
- Playwright built-in assertions (no separate assertion library)

**Run Commands:**
```bash
npm run test              # Run all Playwright tests
npm run test:ui           # Open Playwright test UI for interactive testing
```

## Test File Organization

**Location:**
- Tests separate from source code in `./tests` directory (configured in `playwright.config.ts`)
- Playwright configured to look for test files in `testDir: './tests'`

**Naming:**
- Test files follow `.spec.ts` or `.spec.tsx` pattern (Playwright convention)
- Not yet implemented in this codebase (no test files found in src or dedicated test directory)

**Structure:**
```
tests/
├── auth.spec.ts          # Authentication flow tests
├── sessions.spec.ts      # Session CRUD operations
├── patients.spec.ts      # Patient management
└── recording.spec.ts     # Voice recording features (future)
```

## Test Framework Configuration

**Playwright Config** (`playwright.config.ts`):
- `testDir: './tests'` - tests run from tests directory
- `fullyParallel: true` - tests run in parallel
- `forbidOnly: !!process.env.CI` - fail on `.only` in CI
- Retries: `process.env.CI ? 2 : 0` - retry failed tests 2x in CI, 0x locally
- Workers: `process.env.CI ? 1 : undefined` - single worker in CI, auto-detect locally
- Reporter: `html` - generates HTML test report
- Browser: Chromium only configured
- Base URL: `http://localhost:3000` (expects dev server running)
- Auto-start: `webServer` configured to run `npm run dev`

## Test Structure

**Suite Organization:**
No current tests exist, but recommended structure based on Playwright patterns:

```typescript
import { test, expect, Page } from '@playwright/test';

test.describe('Session Management', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    // Setup: create fresh page, login, navigate
  });

  test.afterEach(async () => {
    // Cleanup: logout, clear data
  });

  test('should create a new session', async ({ page }) => {
    // Arrange
    // Act
    // Assert
  });
});
```

**Patterns:**
- Setup: `beforeEach` hooks for test isolation
- Teardown: `afterEach` hooks for cleanup
- Assertions: Playwright locators with `expect()` (e.g., `expect(locator).toBeVisible()`)

## Test Types

**End-to-End Tests (Planned with Playwright):**
- Scope: Full user workflows (login → create session → save notes → verify display)
- Approach: Use Playwright to interact with UI in a real browser
- Coverage areas:
  - Authentication flows (login, signup)
  - Session creation and editing
  - Patient list navigation
  - Voice recording and transcription
  - Report generation and download

**Unit Tests:**
- Not implemented in this codebase
- Could be added for:
  - Utility functions (`utils.ts`, `security.ts`)
  - Data transformation functions (`ai-features.ts`)
  - Validation schemas (Zod schemas in API routes)

**Integration Tests:**
- Not implemented in this codebase
- Could test:
  - API endpoints with repositories
  - Database operations
  - Transcription service integration

## Testing Best Practices (No Current Tests)

**Setup and Teardown:**
- Each test should be independent
- Use `beforeEach` to navigate to page, set up state
- Use `afterEach` to clean up (logout, delete test data)
- Example: Login before session tests, logout after

**Locators:**
- Use role-based locators preferred: `getByRole('button', { name: /Create Session/i })`
- Use test-id attributes if role locators insufficient
- Use accessible names for interactions

**Async Handling:**
- Playwright automatically waits for elements (30s timeout default)
- Use `page.waitForURL()` for navigation assertions
- Use `page.waitForFunction()` for async operations

**Error Scenarios:**
- Test error message display
- Test form validation errors
- Test API error handling

Example test structure (future implementation):
```typescript
test('should display validation error when required fields empty', async ({ page }) => {
  // Arrange
  await page.goto('/sessions');
  await page.getByRole('button', { name: /New Session/i }).click();

  // Act
  await page.getByRole('button', { name: /Create/i }).click();

  // Assert
  const errorMessage = page.getByText(/נא למלא את כל השדות/i);
  await expect(errorMessage).toBeVisible();
});
```

## Running Tests

**Local Development:**
```bash
npm run test              # Run headless tests once
npm run test:ui           # Open interactive UI for debugging
```

**CI/CD Pipeline:**
- Runs on push with retries enabled
- Single worker (sequential execution) in CI for stability
- HTML report generated for failed tests
- Server auto-started, waits for localhost:3000

**Debug Mode:**
- Use `--debug` flag: `npx playwright test --debug`
- Opens Playwright Inspector for step-by-step execution
- `test:ui` command provides visual test runner

## Test Data and Fixtures

**Mock Data:**
- Defined in `src/lib/mock-data.ts` (mockUsers, mockPatients, mockSessions, etc.)
- Seed function in `src/lib/data/seed.ts` populates JSON store
- API `/seed` endpoint calls `seedIfEmpty()` on first request

**No Dedicated Fixtures:**
- Could add `tests/fixtures/auth.ts` for login helper
- Could add `tests/helpers/factories.ts` for test data generation

Example future fixture:
```typescript
// tests/fixtures/auth.ts
export async function loginAsTherapist(page: Page) {
  await page.goto('/login');
  await page.getByPlaceholder('Email').fill('dr.sarah.cohen@clinic.co.il');
  await page.getByPlaceholder('Password').fill('password');
  await page.getByRole('button', { name: /Login/i }).click();
  await page.waitForURL('/');
}
```

## Coverage

**Requirements:** No coverage requirements enforced

**View Coverage (When Implemented):**
```bash
npx playwright show-report    # View HTML report from last run
```

Coverage could be tracked via:
- Code coverage for unit tests (when added)
- E2E coverage as percentage of user journeys tested
- Target: >80% happy path coverage for critical flows (auth, session CRUD, reporting)

## API Testing Approach

**Manual Testing with curl/Postman:**
- API endpoints documented in Swagger: `/api-docs`
- Routes tested via Playwright by interacting with UI
- Could add API tests using Playwright's API request fixtures

**Example API test (future):**
```typescript
test('POST /api/sessions should create session', async ({ request }) => {
  const response = await request.post('/api/sessions', {
    data: {
      patientId: 'patient-1',
      therapistId: 'user-1',
      therapistRole: 'psychologist',
      sessionType: 'individual_therapy',
      scheduledAt: new Date().toISOString(),
      duration: 50,
      status: 'scheduled',
    }
  });
  expect(response.status()).toBe(201);
});
```

## Test Organization Best Practices

**Recommended File Structure:**
```
tests/
├── auth/
│   ├── login.spec.ts
│   └── signup.spec.ts
├── sessions/
│   ├── create.spec.ts
│   ├── edit.spec.ts
│   └── delete.spec.ts
├── patients/
│   ├── list.spec.ts
│   └── details.spec.ts
├── fixtures/
│   ├── auth.ts          # Login helper
│   └── data.ts          # Test data factory
└── helpers/
    └── database.ts      # DB cleanup helpers
```

## Current Test Status

**Status:** No tests currently implemented

**TODO:**
1. Create `tests/` directory structure
2. Implement authentication flow tests
3. Implement session CRUD tests
4. Implement patient list and detail tests
5. Implement voice recording/transcription tests
6. Add fixtures for setup/teardown
7. Configure CI/CD test reporting

---

*Testing analysis: 2026-01-22*
