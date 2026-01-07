# TherapyDocs: Mock Data to Real Data Persistence

## Overview
Transition from in-memory mock data to persistent JSON file storage, with architecture designed for future database migration.

## User Decisions
- **Data Location**: Project root `/data` folder (gitignored)
- **Authentication**: Simulated logged-in user for now
- **Initial Data**: Auto-seed with existing mock data

---

## Step 1: Create JSON Store Utility

**Create file: `src/lib/data/json-store.ts`**

```typescript
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

async function ensureDataDir(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Date reviver for JSON.parse - converts ISO date strings back to Date objects
function dateReviver(key: string, value: unknown): unknown {
  if (typeof value === 'string') {
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    if (dateRegex.test(value)) {
      return new Date(value);
    }
  }
  return value;
}

export async function readJsonFile<T>(filename: string): Promise<T[]> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);

  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data, dateReviver) as T[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export async function writeJsonFile<T>(filename: string, data: T[]): Promise<void> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  const tempPath = `${filePath}.tmp`;

  // Atomic write: write to temp file, then rename
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  await fs.rename(tempPath, filePath);
}

export async function fileExists(filename: string): Promise<boolean> {
  try {
    await fs.access(path.join(DATA_DIR, filename));
    return true;
  } catch {
    return false;
  }
}

export { DATA_DIR };
```

---

## Step 2: Create Repository Types

**Create file: `src/lib/data/types.ts`**

```typescript
export interface Repository<T> {
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  findMany(predicate: (item: T) => boolean): Promise<T[]>;
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}
```

---

## Step 3: Create Base Repository

**Create file: `src/lib/data/repositories/base.repository.ts`**

```typescript
import { v4 as uuidv4 } from 'uuid';
import { readJsonFile, writeJsonFile } from '../json-store';
import { Repository } from '../types';

export abstract class JsonRepository<T extends { id: string; createdAt?: Date; updatedAt?: Date }>
  implements Repository<T> {

  constructor(protected readonly filename: string) {}

  async findAll(): Promise<T[]> {
    return readJsonFile<T>(this.filename);
  }

  async findById(id: string): Promise<T | null> {
    const items = await this.findAll();
    return items.find(item => item.id === id) ?? null;
  }

  async findMany(predicate: (item: T) => boolean): Promise<T[]> {
    const items = await this.findAll();
    return items.filter(predicate);
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const items = await this.findAll();
    const now = new Date();

    const newItem = {
      ...data,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    } as T;

    items.push(newItem);
    await writeJsonFile(this.filename, items);
    return newItem;
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const items = await this.findAll();
    const index = items.findIndex(item => item.id === id);

    if (index === -1) return null;

    items[index] = {
      ...items[index],
      ...data,
      id: items[index].id, // Prevent ID change
      updatedAt: new Date(),
    };

    await writeJsonFile(this.filename, items);
    return items[index];
  }

  async delete(id: string): Promise<boolean> {
    const items = await this.findAll();
    const index = items.findIndex(item => item.id === id);

    if (index === -1) return false;

    items.splice(index, 1);
    await writeJsonFile(this.filename, items);
    return true;
  }

  protected generateId(): string {
    return uuidv4();
  }
}
```

---

## Step 4: Create Entity Repositories

**Create file: `src/lib/data/repositories/user.repository.ts`**

```typescript
import { User } from '@/types';
import { JsonRepository } from './base.repository';

class UserJsonRepository extends JsonRepository<User> {
  constructor() {
    super('users.json');
  }

  async findByEmail(email: string): Promise<User | null> {
    const users = await this.findAll();
    return users.find(u => u.email === email) ?? null;
  }

  protected generateId(): string {
    return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const userRepository = new UserJsonRepository();
```

**Create file: `src/lib/data/repositories/patient.repository.ts`**

```typescript
import { Patient } from '@/types';
import { JsonRepository } from './base.repository';

class PatientJsonRepository extends JsonRepository<Patient> {
  constructor() {
    super('patients.json');
  }

  async findByTherapist(therapistId: string): Promise<Patient[]> {
    return this.findMany(p => p.assignedTherapists.includes(therapistId));
  }

  async findByStatus(status: Patient['status']): Promise<Patient[]> {
    return this.findMany(p => p.status === status);
  }

  protected generateId(): string {
    return `patient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const patientRepository = new PatientJsonRepository();
```

**Create file: `src/lib/data/repositories/session.repository.ts`**

```typescript
import { Session } from '@/types';
import { JsonRepository } from './base.repository';

class SessionJsonRepository extends JsonRepository<Session> {
  constructor() {
    super('sessions.json');
  }

  async findByPatient(patientId: string): Promise<Session[]> {
    return this.findMany(s => s.patientId === patientId);
  }

  async findByTherapist(therapistId: string): Promise<Session[]> {
    return this.findMany(s => s.therapistId === therapistId);
  }

  async findByDateRange(start: Date, end: Date): Promise<Session[]> {
    return this.findMany(s => {
      const sessionDate = new Date(s.scheduledAt);
      return sessionDate >= start && sessionDate <= end;
    });
  }

  protected generateId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const sessionRepository = new SessionJsonRepository();
```

**Create file: `src/lib/data/repositories/treatment-goal.repository.ts`**

```typescript
import { TreatmentGoal } from '@/types';
import { JsonRepository } from './base.repository';

class TreatmentGoalJsonRepository extends JsonRepository<TreatmentGoal> {
  constructor() {
    super('treatment-goals.json');
  }

  async findByPatient(patientId: string): Promise<TreatmentGoal[]> {
    return this.findMany(g => g.patientId === patientId);
  }

  protected generateId(): string {
    return `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const treatmentGoalRepository = new TreatmentGoalJsonRepository();
```

**Create file: `src/lib/data/repositories/report.repository.ts`**

```typescript
import { Report } from '@/types';
import { JsonRepository } from './base.repository';

class ReportJsonRepository extends JsonRepository<Report> {
  constructor() {
    super('reports.json');
  }

  async findByPatient(patientId: string): Promise<Report[]> {
    return this.findMany(r => r.patientId === patientId);
  }

  protected generateId(): string {
    return `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const reportRepository = new ReportJsonRepository();
```

**Create file: `src/lib/data/repositories/index.ts`**

```typescript
export { userRepository } from './user.repository';
export { patientRepository } from './patient.repository';
export { sessionRepository } from './session.repository';
export { treatmentGoalRepository } from './treatment-goal.repository';
export { reportRepository } from './report.repository';
```

---

## Step 5: Create Seed Utility

**Create file: `src/lib/data/seed.ts`**

```typescript
import { writeJsonFile, fileExists } from './json-store';
import {
  mockUsers,
  mockPatients,
  mockSessions,
  mockTreatmentGoals,
  mockReports,
} from '@/lib/mock-data';

export async function seedIfEmpty(): Promise<boolean> {
  // Check if data already exists
  const usersExist = await fileExists('users.json');
  const patientsExist = await fileExists('patients.json');

  if (usersExist && patientsExist) {
    return false; // Already seeded
  }

  // Seed all collections
  await writeJsonFile('users.json', mockUsers);
  await writeJsonFile('patients.json', mockPatients);
  await writeJsonFile('sessions.json', mockSessions);
  await writeJsonFile('treatment-goals.json', mockTreatmentGoals);
  await writeJsonFile('reports.json', mockReports);

  console.log('Database seeded with mock data');
  return true;
}

export async function resetData(): Promise<void> {
  await writeJsonFile('users.json', mockUsers);
  await writeJsonFile('patients.json', mockPatients);
  await writeJsonFile('sessions.json', mockSessions);
  await writeJsonFile('treatment-goals.json', mockTreatmentGoals);
  await writeJsonFile('reports.json', mockReports);
  console.log('Database reset to mock data');
}
```

---

## Step 6: Create API Routes

**Create file: `src/app/api/seed/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import { seedIfEmpty, resetData } from '@/lib/data/seed';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reset = searchParams.get('reset') === 'true';

    if (reset) {
      await resetData();
      return NextResponse.json({ message: 'Data reset successfully' });
    }

    const seeded = await seedIfEmpty();
    return NextResponse.json({
      message: seeded ? 'Data seeded successfully' : 'Data already exists'
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 });
  }
}
```

**Create file: `src/app/api/users/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { userRepository } from '@/lib/data/repositories';
import { seedIfEmpty } from '@/lib/data/seed';

export async function GET() {
  try {
    await seedIfEmpty(); // Auto-seed on first request
    const users = await userRepository.findAll();
    return NextResponse.json({ data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
```

**Create file: `src/app/api/users/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { userRepository } from '@/lib/data/repositories';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await userRepository.findById(id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}
```

**Create file: `src/app/api/patients/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { patientRepository } from '@/lib/data/repositories';
import { seedIfEmpty } from '@/lib/data/seed';
import { z } from 'zod';

const createPatientSchema = z.object({
  encryptedData: z.string(),
  patientCode: z.string(),
  dateOfBirth: z.string(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  primaryDiagnosis: z.string().optional(),
  referralSource: z.string().optional(),
  insuranceProvider: z.string().optional(),
  assignedTherapists: z.array(z.string()).min(1),
  status: z.enum(['active', 'inactive', 'discharged']).default('active'),
});

export async function GET(request: NextRequest) {
  try {
    await seedIfEmpty();
    const { searchParams } = new URL(request.url);
    const therapistId = searchParams.get('therapistId');
    const status = searchParams.get('status');

    let patients;
    if (therapistId) {
      patients = await patientRepository.findByTherapist(therapistId);
    } else if (status) {
      patients = await patientRepository.findByStatus(status as 'active' | 'inactive' | 'discharged');
    } else {
      patients = await patientRepository.findAll();
    }

    return NextResponse.json({ data: patients });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createPatientSchema.parse(body);

    const patient = await patientRepository.create(validatedData);
    return NextResponse.json({ data: patient }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error creating patient:', error);
    return NextResponse.json({ error: 'Failed to create patient' }, { status: 500 });
  }
}
```

**Create file: `src/app/api/patients/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { patientRepository } from '@/lib/data/repositories';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const patient = await patientRepository.findById(id);

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json({ data: patient });
  } catch (error) {
    console.error('Error fetching patient:', error);
    return NextResponse.json({ error: 'Failed to fetch patient' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const patient = await patientRepository.update(id, body);

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json({ data: patient });
  } catch (error) {
    console.error('Error updating patient:', error);
    return NextResponse.json({ error: 'Failed to update patient' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await patientRepository.delete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting patient:', error);
    return NextResponse.json({ error: 'Failed to delete patient' }, { status: 500 });
  }
}
```

**Create file: `src/app/api/patients/[id]/sessions/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { sessionRepository } from '@/lib/data/repositories';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessions = await sessionRepository.findByPatient(id);
    return NextResponse.json({ data: sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}
```

**Create file: `src/app/api/patients/[id]/goals/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { treatmentGoalRepository } from '@/lib/data/repositories';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const goals = await treatmentGoalRepository.findByPatient(id);
    return NextResponse.json({ data: goals });
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}
```

**Create file: `src/app/api/patients/[id]/reports/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { reportRepository } from '@/lib/data/repositories';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reports = await reportRepository.findByPatient(id);
    return NextResponse.json({ data: reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}
```

**Create file: `src/app/api/sessions/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { sessionRepository } from '@/lib/data/repositories';
import { seedIfEmpty } from '@/lib/data/seed';
import { z } from 'zod';

const createSessionSchema = z.object({
  patientId: z.string(),
  therapistId: z.string(),
  therapistRole: z.enum([
    'psychologist', 'psychiatrist', 'social_worker',
    'occupational_therapist', 'speech_therapist', 'physical_therapist',
    'counselor', 'art_therapist', 'music_therapist', 'family_therapist'
  ]),
  sessionType: z.enum([
    'initial_assessment', 'individual_therapy', 'group_therapy',
    'family_therapy', 'evaluation', 'follow_up',
    'crisis_intervention', 'discharge_planning'
  ]),
  scheduledAt: z.string(),
  duration: z.number().min(15).max(180).optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show']).default('scheduled'),
  location: z.enum(['in_person', 'telehealth', 'home_visit']).default('in_person'),
  notes: z.object({
    chiefComplaint: z.string().optional(),
    subjective: z.string().optional(),
    objective: z.string().optional(),
    assessment: z.string().optional(),
    plan: z.string().optional(),
    interventionsUsed: z.array(z.string()).optional(),
    progressTowardGoals: z.string().optional(),
    homework: z.string().optional(),
    nextSessionPlan: z.string().optional(),
  }).optional(),
});

export async function GET(request: NextRequest) {
  try {
    await seedIfEmpty();
    const { searchParams } = new URL(request.url);
    const therapistId = searchParams.get('therapistId');
    const patientId = searchParams.get('patientId');

    let sessions;
    if (therapistId) {
      sessions = await sessionRepository.findByTherapist(therapistId);
    } else if (patientId) {
      sessions = await sessionRepository.findByPatient(patientId);
    } else {
      sessions = await sessionRepository.findAll();
    }

    return NextResponse.json({ data: sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createSessionSchema.parse(body);

    const session = await sessionRepository.create(validatedData);
    return NextResponse.json({ data: session }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
```

**Create file: `src/app/api/sessions/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { sessionRepository } from '@/lib/data/repositories';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await sessionRepository.findById(id);

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ data: session });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const session = await sessionRepository.update(id, body);

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ data: session });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await sessionRepository.delete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
```

**Create file: `src/app/api/treatment-goals/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { treatmentGoalRepository } from '@/lib/data/repositories';
import { seedIfEmpty } from '@/lib/data/seed';
import { z } from 'zod';

const createGoalSchema = z.object({
  patientId: z.string(),
  description: z.string(),
  targetDate: z.string(),
  status: z.enum(['active', 'achieved', 'modified', 'discontinued']).default('active'),
  progress: z.number().min(0).max(100).default(0),
  measurementCriteria: z.string(),
  createdBy: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    await seedIfEmpty();
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    let goals;
    if (patientId) {
      goals = await treatmentGoalRepository.findByPatient(patientId);
    } else {
      goals = await treatmentGoalRepository.findAll();
    }

    return NextResponse.json({ data: goals });
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createGoalSchema.parse(body);

    const goal = await treatmentGoalRepository.create(validatedData);
    return NextResponse.json({ data: goal }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error creating goal:', error);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}
```

**Create file: `src/app/api/treatment-goals/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { treatmentGoalRepository } from '@/lib/data/repositories';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const goal = await treatmentGoalRepository.findById(id);

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    return NextResponse.json({ data: goal });
  } catch (error) {
    console.error('Error fetching goal:', error);
    return NextResponse.json({ error: 'Failed to fetch goal' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const goal = await treatmentGoalRepository.update(id, body);

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    return NextResponse.json({ data: goal });
  } catch (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await treatmentGoalRepository.delete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
  }
}
```

**Create file: `src/app/api/reports/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { reportRepository } from '@/lib/data/repositories';
import { seedIfEmpty } from '@/lib/data/seed';
import { z } from 'zod';

const createReportSchema = z.object({
  patientId: z.string(),
  reportType: z.enum([
    'progress_summary', 'discharge_summary', 'insurance_report',
    'referral_report', 'evaluation_report', 'treatment_summary', 'multidisciplinary_summary'
  ]),
  generatedBy: z.string(),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }),
  content: z.object({
    summary: z.string(),
    sessionsSummary: z.array(z.any()).optional(),
    goalsProgress: z.array(z.any()).optional(),
    recommendations: z.string().optional(),
    clinicalImpressions: z.string().optional(),
  }),
  status: z.enum(['draft', 'finalized', 'signed']).default('draft'),
});

export async function GET(request: NextRequest) {
  try {
    await seedIfEmpty();
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    let reports;
    if (patientId) {
      reports = await reportRepository.findByPatient(patientId);
    } else {
      reports = await reportRepository.findAll();
    }

    return NextResponse.json({ data: reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createReportSchema.parse(body);

    const report = await reportRepository.create({
      ...validatedData,
      generatedAt: new Date(),
    });
    return NextResponse.json({ data: report }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error creating report:', error);
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}
```

**Create file: `src/app/api/reports/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { reportRepository } from '@/lib/data/repositories';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const report = await reportRepository.findById(id);

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({ data: report });
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const report = await reportRepository.update(id, body);

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({ data: report });
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await reportRepository.delete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
  }
}
```

---

## Step 7: Create API Client

**Create file: `src/lib/api/client.ts`**

```typescript
interface ApiResponse<T> {
  data?: T;
  error?: string;
  details?: unknown;
}

class ApiClient {
  private baseUrl = '/api';

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    return response.json();
  }

  async post<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async put<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async delete(endpoint: string): Promise<ApiResponse<{ success: boolean }>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
    });
    return response.json();
  }
}

export const apiClient = new ApiClient();
```

---

## Step 8: Create React Hooks

**Create file: `src/lib/hooks/use-patients.ts`**

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Patient } from '@/types';
import { apiClient } from '@/lib/api/client';

interface CreatePatientData {
  encryptedData: string;
  patientCode: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  primaryDiagnosis?: string;
  referralSource?: string;
  insuranceProvider?: string;
  assignedTherapists: string[];
  status?: 'active' | 'inactive' | 'discharged';
}

export function usePatients(therapistId?: string) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = therapistId
        ? `/patients?therapistId=${therapistId}`
        : '/patients';
      const response = await apiClient.get<Patient[]>(endpoint);

      if (response.error) {
        setError(response.error);
      } else {
        setPatients(response.data ?? []);
      }
    } catch (err) {
      setError('Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  }, [therapistId]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const createPatient = async (data: CreatePatientData): Promise<Patient> => {
    const response = await apiClient.post<Patient>('/patients', data);
    if (response.error) throw new Error(response.error);
    await fetchPatients();
    return response.data!;
  };

  const updatePatient = async (id: string, data: Partial<Patient>): Promise<Patient> => {
    const response = await apiClient.put<Patient>(`/patients/${id}`, data);
    if (response.error) throw new Error(response.error);
    await fetchPatients();
    return response.data!;
  };

  const deletePatient = async (id: string): Promise<boolean> => {
    const response = await apiClient.delete(`/patients/${id}`);
    if (response.error) throw new Error(response.error);
    await fetchPatients();
    return true;
  };

  return {
    patients,
    loading,
    error,
    refetch: fetchPatients,
    createPatient,
    updatePatient,
    deletePatient,
  };
}

export function usePatient(id: string) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPatient() {
      setLoading(true);
      try {
        const response = await apiClient.get<Patient>(`/patients/${id}`);
        if (response.error) {
          setError(response.error);
        } else {
          setPatient(response.data ?? null);
        }
      } catch (err) {
        setError('Failed to fetch patient');
      } finally {
        setLoading(false);
      }
    }
    fetchPatient();
  }, [id]);

  return { patient, loading, error };
}
```

**Create file: `src/lib/hooks/use-sessions.ts`**

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Session } from '@/types';
import { apiClient } from '@/lib/api/client';

export function useSessions(filters?: { therapistId?: string; patientId?: string }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let endpoint = '/sessions';
      const params = new URLSearchParams();
      if (filters?.therapistId) params.set('therapistId', filters.therapistId);
      if (filters?.patientId) params.set('patientId', filters.patientId);
      if (params.toString()) endpoint += `?${params.toString()}`;

      const response = await apiClient.get<Session[]>(endpoint);

      if (response.error) {
        setError(response.error);
      } else {
        setSessions(response.data ?? []);
      }
    } catch (err) {
      setError('Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  }, [filters?.therapistId, filters?.patientId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const createSession = async (data: Partial<Session>): Promise<Session> => {
    const response = await apiClient.post<Session>('/sessions', data);
    if (response.error) throw new Error(response.error);
    await fetchSessions();
    return response.data!;
  };

  const updateSession = async (id: string, data: Partial<Session>): Promise<Session> => {
    const response = await apiClient.put<Session>(`/sessions/${id}`, data);
    if (response.error) throw new Error(response.error);
    await fetchSessions();
    return response.data!;
  };

  const deleteSession = async (id: string): Promise<boolean> => {
    const response = await apiClient.delete(`/sessions/${id}`);
    if (response.error) throw new Error(response.error);
    await fetchSessions();
    return true;
  };

  return {
    sessions,
    loading,
    error,
    refetch: fetchSessions,
    createSession,
    updateSession,
    deleteSession,
  };
}

export function useSession(id: string) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSession() {
      setLoading(true);
      try {
        const response = await apiClient.get<Session>(`/sessions/${id}`);
        if (response.error) {
          setError(response.error);
        } else {
          setSession(response.data ?? null);
        }
      } catch (err) {
        setError('Failed to fetch session');
      } finally {
        setLoading(false);
      }
    }
    fetchSession();
  }, [id]);

  return { session, loading, error };
}
```

**Create file: `src/lib/hooks/use-treatment-goals.ts`**

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { TreatmentGoal } from '@/types';
import { apiClient } from '@/lib/api/client';

export function useTreatmentGoals(patientId?: string) {
  const [goals, setGoals] = useState<TreatmentGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = patientId
        ? `/treatment-goals?patientId=${patientId}`
        : '/treatment-goals';
      const response = await apiClient.get<TreatmentGoal[]>(endpoint);

      if (response.error) {
        setError(response.error);
      } else {
        setGoals(response.data ?? []);
      }
    } catch (err) {
      setError('Failed to fetch goals');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const createGoal = async (data: Partial<TreatmentGoal>): Promise<TreatmentGoal> => {
    const response = await apiClient.post<TreatmentGoal>('/treatment-goals', data);
    if (response.error) throw new Error(response.error);
    await fetchGoals();
    return response.data!;
  };

  const updateGoal = async (id: string, data: Partial<TreatmentGoal>): Promise<TreatmentGoal> => {
    const response = await apiClient.put<TreatmentGoal>(`/treatment-goals/${id}`, data);
    if (response.error) throw new Error(response.error);
    await fetchGoals();
    return response.data!;
  };

  const deleteGoal = async (id: string): Promise<boolean> => {
    const response = await apiClient.delete(`/treatment-goals/${id}`);
    if (response.error) throw new Error(response.error);
    await fetchGoals();
    return true;
  };

  return {
    goals,
    loading,
    error,
    refetch: fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
  };
}
```

**Create file: `src/lib/hooks/use-reports.ts`**

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Report } from '@/types';
import { apiClient } from '@/lib/api/client';

export function useReports(patientId?: string) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = patientId
        ? `/reports?patientId=${patientId}`
        : '/reports';
      const response = await apiClient.get<Report[]>(endpoint);

      if (response.error) {
        setError(response.error);
      } else {
        setReports(response.data ?? []);
      }
    } catch (err) {
      setError('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const createReport = async (data: Partial<Report>): Promise<Report> => {
    const response = await apiClient.post<Report>('/reports', data);
    if (response.error) throw new Error(response.error);
    await fetchReports();
    return response.data!;
  };

  const updateReport = async (id: string, data: Partial<Report>): Promise<Report> => {
    const response = await apiClient.put<Report>(`/reports/${id}`, data);
    if (response.error) throw new Error(response.error);
    await fetchReports();
    return response.data!;
  };

  return {
    reports,
    loading,
    error,
    refetch: fetchReports,
    createReport,
    updateReport,
  };
}
```

**Create file: `src/lib/hooks/use-users.ts`**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types';
import { apiClient } from '@/lib/api/client';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        const response = await apiClient.get<User[]>('/users');
        if (response.error) {
          setError(response.error);
        } else {
          setUsers(response.data ?? []);
        }
      } catch (err) {
        setError('Failed to fetch users');
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  return { users, loading, error };
}

// Simulated current user - returns first user (therapist)
export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCurrentUser() {
      setLoading(true);
      try {
        const response = await apiClient.get<User[]>('/users');
        if (response.error) {
          setError(response.error);
        } else if (response.data && response.data.length > 0) {
          // Simulate logged in user - use first therapist
          const therapist = response.data.find(u => u.role === 'therapist');
          setUser(therapist ?? response.data[0]);
        }
      } catch (err) {
        setError('Failed to fetch current user');
      } finally {
        setLoading(false);
      }
    }
    fetchCurrentUser();
  }, []);

  return { user, loading, error };
}
```

**Create file: `src/lib/hooks/index.ts`**

```typescript
export { usePatients, usePatient } from './use-patients';
export { useSessions, useSession } from './use-sessions';
export { useTreatmentGoals } from './use-treatment-goals';
export { useReports } from './use-reports';
export { useUsers, useCurrentUser } from './use-users';
```

---

## Step 9: Create UI Components

**Create file: `src/components/ui/LoadingSpinner.tsx`**

```typescript
export function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600"></div>
    </div>
  );
}
```

**Create file: `src/components/ui/ErrorMessage.tsx`**

```typescript
interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
      <p className="text-red-600 mb-2">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-red-600 underline hover:text-red-800"
        >
          נסה שוב
        </button>
      )}
    </div>
  );
}
```

---

## Step 10: Update .gitignore

**Add to `.gitignore`:**

```
# Local data files
/data
```

---

## Step 11: Update Pages to Use Hooks

### Update `src/app/page.tsx` (Dashboard)

**Replace mock data imports with hooks:**

```typescript
// REMOVE these imports:
// import { mockUsers, mockPatients, mockSessions, mockTreatmentGoals } from '@/lib/mock-data';

// ADD these imports:
import { useCurrentUser, usePatients, useSessions, useTreatmentGoals } from '@/lib/hooks';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

// In component body, REPLACE:
// const currentUser = mockUsers[0];
// const todaysSessions = mockSessions.filter(...)
// etc.

// WITH:
const { user: currentUser, loading: userLoading, error: userError } = useCurrentUser();
const { patients, loading: patientsLoading } = usePatients(currentUser?.id);
const { sessions, loading: sessionsLoading } = useSessions({ therapistId: currentUser?.id });
const { goals, loading: goalsLoading } = useTreatmentGoals();

if (userLoading || patientsLoading || sessionsLoading || goalsLoading) {
  return <LoadingSpinner className="h-screen" />;
}

if (userError || !currentUser) {
  return <ErrorMessage message="Failed to load user data" />;
}

// Rest of the component logic remains the same, but use:
// - patients instead of mockPatients
// - sessions instead of mockSessions
// - goals instead of mockTreatmentGoals
```

### Update `src/app/patients/page.tsx`

**Replace mock data with hooks:**

```typescript
// REMOVE:
// import { mockUsers, mockPatients, addPatient, CreatePatientData } from '@/lib/mock-data';

// ADD:
import { useCurrentUser, usePatients } from '@/lib/hooks';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

// In component, REPLACE state and mock data:
// const [patients, setPatients] = useState<Patient[]>(mockPatients);

// WITH:
const { user: currentUser, loading: userLoading } = useCurrentUser();
const { patients, loading, error, createPatient, refetch } = usePatients();

// For creating patients, REPLACE:
// const newPatient = addPatient(patientData);
// setPatients(prev => [...prev, newPatient]);

// WITH:
await createPatient(patientData);
// Hook automatically refetches after create
```

### Update `src/app/patients/[id]/page.tsx`

```typescript
// REMOVE mock imports
// ADD:
import { usePatient, useSessions, useTreatmentGoals, useReports } from '@/lib/hooks';

// In component:
const { patient, loading: patientLoading, error: patientError } = usePatient(params.id);
const { sessions, loading: sessionsLoading } = useSessions({ patientId: params.id });
const { goals, loading: goalsLoading } = useTreatmentGoals(params.id);
const { reports, loading: reportsLoading } = useReports(params.id);

// Show loading state
if (patientLoading || sessionsLoading || goalsLoading || reportsLoading) {
  return <LoadingSpinner className="h-screen" />;
}

// Handle not found
if (!patient) {
  return <ErrorMessage message="Patient not found" />;
}
```

### Update `src/app/sessions/page.tsx`

```typescript
// REMOVE mock imports
// ADD:
import { useCurrentUser, usePatients, useSessions } from '@/lib/hooks';

// In component:
const { user: currentUser, loading: userLoading } = useCurrentUser();
const { patients, loading: patientsLoading } = usePatients();
const { sessions, loading: sessionsLoading } = useSessions({ therapistId: currentUser?.id });

// Create patient code lookup from patients array
const patientCodes = patients.reduce((acc, p) => {
  acc[p.id] = p.patientCode;
  return acc;
}, {} as Record<string, string>);
```

### Update `src/app/sessions/[id]/page.tsx`

```typescript
// REMOVE mock imports
// ADD:
import { useSession, usePatient, useCurrentUser } from '@/lib/hooks';

// In component:
const { session, loading: sessionLoading } = useSession(params.id);
const { patient, loading: patientLoading } = usePatient(session?.patientId ?? '');
const { user: currentUser } = useCurrentUser();
```

---

## Summary: Files to Create

```
src/lib/data/
  json-store.ts
  types.ts
  seed.ts
  repositories/
    index.ts
    base.repository.ts
    user.repository.ts
    patient.repository.ts
    session.repository.ts
    treatment-goal.repository.ts
    report.repository.ts

src/lib/api/
  client.ts

src/lib/hooks/
  index.ts
  use-patients.ts
  use-sessions.ts
  use-treatment-goals.ts
  use-reports.ts
  use-users.ts

src/app/api/
  seed/route.ts
  users/route.ts
  users/[id]/route.ts
  patients/route.ts
  patients/[id]/route.ts
  patients/[id]/sessions/route.ts
  patients/[id]/goals/route.ts
  patients/[id]/reports/route.ts
  sessions/route.ts
  sessions/[id]/route.ts
  treatment-goals/route.ts
  treatment-goals/[id]/route.ts
  reports/route.ts
  reports/[id]/route.ts

src/components/ui/
  LoadingSpinner.tsx
  ErrorMessage.tsx
```

## Files to Modify

```
src/app/page.tsx
src/app/patients/page.tsx
src/app/patients/[id]/page.tsx
src/app/sessions/page.tsx
src/app/sessions/[id]/page.tsx
.gitignore
```

## Implementation Order

1. Create `src/lib/data/json-store.ts`
2. Create `src/lib/data/types.ts`
3. Create `src/lib/data/repositories/base.repository.ts`
4. Create all entity repositories
5. Create `src/lib/data/repositories/index.ts`
6. Create `src/lib/data/seed.ts`
7. Create all API routes
8. Create `src/lib/api/client.ts`
9. Create all hooks
10. Create `src/lib/hooks/index.ts`
11. Create UI components (LoadingSpinner, ErrorMessage)
12. Update `.gitignore`
13. Update pages one by one
14. Test the application
