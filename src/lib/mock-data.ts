// Mock database for demonstration
// In production, replace with PostgreSQL, MongoDB, or other HIPAA-compliant database

import {
  User,
  Patient,
  Session,
  TreatmentPlan,
  Report,
  TherapistRole,
  SessionType,
  TreatmentGoal
} from '@/types';

// Helper to generate unique IDs
function generateId(): string {
  return `patient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Mock Users (Therapists)
export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'dr.sarah.cohen@clinic.co.il',
    name: 'ד"ר שרה כהן',
    role: 'therapist',
    therapistRole: 'psychologist',
    licenseNumber: 'PSY-2024-1234',
    organization: 'מרכז הרמוניה לבריאות הנפש',
    createdAt: new Date('2023-01-15'),
    lastLogin: new Date(),
  },
  {
    id: 'user-2',
    email: 'michael.levi@clinic.co.il',
    name: 'מיכאל לוי, עו"ס',
    role: 'therapist',
    therapistRole: 'social_worker',
    licenseNumber: 'LCSW-2022-5678',
    organization: 'מרכז הרמוניה לבריאות הנפש',
    createdAt: new Date('2023-03-20'),
    lastLogin: new Date(),
  },
  {
    id: 'user-3',
    email: 'emma.israeli@clinic.co.il',
    name: 'אמה ישראלי, מרפאה בעיסוק',
    role: 'therapist',
    therapistRole: 'occupational_therapist',
    licenseNumber: 'OT-2021-9012',
    organization: 'מרכז הרמוניה לבריאות הנפש',
    createdAt: new Date('2023-05-10'),
    lastLogin: new Date(),
  },
  {
    id: 'user-4',
    email: 'dr.david.mizrachi@clinic.co.il',
    name: 'ד"ר דוד מזרחי',
    role: 'therapist',
    therapistRole: 'psychiatrist',
    licenseNumber: 'MD-2019-3456',
    organization: 'מרכז הרמוניה לבריאות הנפש',
    createdAt: new Date('2022-11-01'),
    lastLogin: new Date(),
  },
  {
    id: 'user-5',
    email: 'admin@clinic.co.il',
    name: 'מנהל מערכת',
    role: 'admin',
    organization: 'מרכז הרמוניה לבריאות הנפש',
    createdAt: new Date('2022-01-01'),
    lastLogin: new Date(),
  },
];

// Mock Patients
export const mockPatients: Patient[] = [
  {
    id: 'patient-1',
    idNumber: '012345678',
    encryptedData: 'encrypted-patient-data-1',
    firstName: 'אביגיל',
    lastName: 'ברקוביץ',
    dateOfBirth: '1985-03-15',
    gender: 'female',
    primaryDiagnosis: 'הפרעת דיכאון מז\'ורי, חוזרת',
    referralSource: 'רופא משפחה',
    insuranceProvider: 'כללית',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date(),
    assignedTherapists: ['user-1', 'user-2', 'user-4'],
    status: 'active',
  },
  {
    id: 'patient-2',
    idNumber: '023456789',
    encryptedData: 'encrypted-patient-data-2',
    firstName: 'גל',
    lastName: 'דוידוב',
    dateOfBirth: '1992-07-22',
    gender: 'male',
    primaryDiagnosis: 'הפרעת חרדה כללית',
    referralSource: 'פנייה עצמית',
    insuranceProvider: 'מכבי',
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date(),
    assignedTherapists: ['user-1', 'user-3'],
    status: 'active',
  },
  {
    id: 'patient-3',
    idNumber: '034567890',
    encryptedData: 'encrypted-patient-data-3',
    firstName: 'ורד',
    lastName: 'זהבי',
    dateOfBirth: '1978-11-30',
    gender: 'female',
    primaryDiagnosis: 'הפרעת דחק פוסט-טראומטית (PTSD)',
    referralSource: 'מרכז בריאות קהילתי',
    insuranceProvider: 'לאומית',
    createdAt: new Date('2024-03-12'),
    updatedAt: new Date(),
    assignedTherapists: ['user-1', 'user-2'],
    status: 'active',
  },
  {
    id: 'patient-4',
    idNumber: '045678901',
    encryptedData: 'encrypted-patient-data-4',
    firstName: 'חיים',
    lastName: 'טל',
    dateOfBirth: '2010-05-18',
    gender: 'male',
    primaryDiagnosis: 'הפרעת קשב וריכוז (ADHD), סוג משולב',
    referralSource: 'יועצת בית ספר',
    insuranceProvider: 'מאוחדת',
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date(),
    assignedTherapists: ['user-3', 'user-4'],
    status: 'active',
  },
  {
    id: 'patient-5',
    idNumber: '056789012',
    encryptedData: 'encrypted-patient-data-5',
    firstName: 'יוסי',
    lastName: 'כהן',
    dateOfBirth: '1965-09-08',
    gender: 'male',
    primaryDiagnosis: 'הפרעה דו-קוטבית סוג II',
    referralSource: 'שחרור מאשפוז',
    insuranceProvider: 'כללית',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date(),
    assignedTherapists: ['user-1', 'user-4'],
    status: 'active',
  },
];

// Mock Sessions
export const mockSessions: Session[] = [
  {
    id: 'session-1',
    patientId: 'patient-1',
    therapistId: 'user-1',
    therapistRole: 'psychologist',
    sessionType: 'individual_therapy',
    scheduledAt: new Date('2024-12-20T10:00:00'),
    startedAt: new Date('2024-12-20T10:02:00'),
    endedAt: new Date('2024-12-20T10:55:00'),
    duration: 53,
    status: 'completed',
    location: 'in_person',
    notes: {
      chiefComplaint: 'המשך תחושות עצב ואנרגיה נמוכה',
      subjective: 'המטופלת מדווחת על שיפור בדפוסי השינה מאז המפגש האחרון. עדיין חווה עייפות בוקר אך מסוגלת להשלים פעילויות יומיות. ציינה כמה אינטראקציות חברתיות חיוביות השבוע.',
      objective: 'המטופלת נראתה מטופחת עם קשר עין משופר בהשוואה למפגשים קודמים. דיבור בקצב ובריתמוס תקינים. אפקט תואם למצב רוח מדווח (4/10). לא נצפה פיגור פסיכומוטורי.',
      assessment: 'המטופלת מראה שיפור הדרגתי בתסמיני דיכאון. התערבויות היגיינת שינה נראות אפקטיביות. נדרשת המשך עבודת CBT לעיוותים קוגניטיביים.',
      plan: 'המשך מפגשי CBT שבועיים. התמקדות בהפעלה התנהגותית ואתגור מחשבות אוטומטיות שליליות. מעקב על היענות לטיפול תרופתי עם הפסיכיאטר.',
      interventionsUsed: ['ארגון מחדש קוגניטיבי', 'הפעלה התנהגותית', 'תרגיל מיינדפולנס'],
      progressTowardGoals: 'מטרה 1 (שיפור שינה): 60% התקדמות. מטרה 2 (מעורבות חברתית): 40% התקדמות.',
      riskAssessment: {
        suicidalIdeation: 'none',
        homicidalIdeation: 'none',
        selfHarm: 'history',
        substanceUse: 'none',
        safetyPlanReviewed: false,
      },
      homework: 'השלמת יומן מחשבות יומי. השתתפות בפעילות חברתית אחת.',
      nextSessionPlan: 'סקירת יומן מחשבות. הכנסת תכנון פעילויות.',
    },
    createdAt: new Date('2024-12-20'),
    updatedAt: new Date('2024-12-20'),
    signedAt: new Date('2024-12-20T11:30:00'),
    signedBy: 'user-1',
  },
  {
    id: 'session-2',
    patientId: 'patient-1',
    therapistId: 'user-2',
    therapistRole: 'social_worker',
    sessionType: 'individual_therapy',
    scheduledAt: new Date('2024-12-22T14:00:00'),
    startedAt: new Date('2024-12-22T14:00:00'),
    endedAt: new Date('2024-12-22T14:50:00'),
    duration: 50,
    status: 'completed',
    location: 'telehealth',
    notes: {
      chiefComplaint: 'לחץ הקשור למצב הדיור',
      subjective: 'המטופלת הביעה דאגה לגבי חידוש החוזה הקרוב. מדווחת על לחץ כלכלי המשפיע על מצב הרוח. חקרה משאבים קהילתיים.',
      objective: 'המטופלת מעורבת ומבטאת את עצמה היטב. הפגינה כישורי פתרון בעיות בעת דיון באפשרויות. נראתה חרדה בעת דיון בענייני כספים.',
      assessment: 'גורמי לחץ סביבתיים תורמים לתסמיני דיכאון. המטופלת מפגינה חוסן ונכונות לגשת למשאבים.',
      plan: 'חיבור לתוכניות סיוע בדיור. סקירת תקציב ומשאבים כלכליים. תיאום עם פסיכולוגיה לטיפול משולב.',
      interventionsUsed: ['חיבור למשאבים', 'טיפול בפתרון בעיות', 'תיאום טיפול'],
      progressTowardGoals: 'מטרה 3 (יציבות דיור): 30% התקדמות - חוקרת אפשרויות באופן פעיל.',
      homework: 'יצירת קשר עם רשות הדיור להגשת בקשה. יצירת גיליון תקציב חודשי.',
      nextSessionPlan: 'מעקב על מצב בקשת הדיור. סקירת תקציב.',
    },
    createdAt: new Date('2024-12-22'),
    updatedAt: new Date('2024-12-22'),
    signedAt: new Date('2024-12-22T15:30:00'),
    signedBy: 'user-2',
  },
  {
    id: 'session-3',
    patientId: 'patient-2',
    therapistId: 'user-1',
    therapistRole: 'psychologist',
    sessionType: 'individual_therapy',
    scheduledAt: new Date('2024-12-23T11:00:00'),
    startedAt: new Date('2024-12-23T11:05:00'),
    endedAt: new Date('2024-12-23T11:55:00'),
    duration: 50,
    status: 'completed',
    location: 'in_person',
    notes: {
      chiefComplaint: 'חרדה מוגברת לקראת מצגת בעבודה',
      subjective: 'המטופל מדווח על חרדת ציפייה משמעותית לקראת מצגת קרובה. נמנע מהכנה. שינה מופרעת ב-3 הלילות האחרונים.',
      objective: 'המטופל נראה חסר מנוחה, מתפתל לאורך כל המפגש. דיבור מעט לחוץ. דיווח על מתח שרירים בכתפיים ובצוואר.',
      assessment: 'תסמיני חרדה מסלימים בתגובה לגורם לחץ ספציפי. התנהגות הימנעותית מחזקת את מעגל החרדה.',
      plan: 'יישום היררכיית חשיפה לחרדת מצגות. המשך אימון הרפיה. שקילת התאמת תרופות לטווח קצר עם פסיכיאטריה.',
      interventionsUsed: ['תכנון חשיפה', 'הרפיית שרירים מתקדמת', 'ניתוק קוגניטיבי'],
      progressTowardGoals: 'מטרה 1 (הפחתת הימנעות): נסיגה השבוע, יש לטפל.',
      riskAssessment: {
        suicidalIdeation: 'none',
        homicidalIdeation: 'none',
        selfHarm: 'none',
        substanceUse: 'none',
        safetyPlanReviewed: false,
      },
      homework: 'תרגול טכניקת הרפיה יומית. התחלת הכנת המצגת בצעדים קטנים.',
      nextSessionPlan: 'סקירת התקדמות בחשיפה. תרגול חלקי מצגת.',
    },
    createdAt: new Date('2024-12-23'),
    updatedAt: new Date('2024-12-23'),
    signedAt: new Date('2024-12-23T12:30:00'),
    signedBy: 'user-1',
  },
  {
    id: 'session-4',
    patientId: 'patient-2',
    therapistId: 'user-3',
    therapistRole: 'occupational_therapist',
    sessionType: 'evaluation',
    scheduledAt: new Date('2024-12-24T09:00:00'),
    startedAt: new Date('2024-12-24T09:00:00'),
    endedAt: new Date('2024-12-24T10:00:00'),
    duration: 60,
    status: 'completed',
    location: 'in_person',
    notes: {
      chiefComplaint: 'קושי בניהול שגרה יומית עקב חרדה',
      subjective: 'המטופל מדווח על קושי לשמור על לוח זמנים בעבודה ושגרות טיפול עצמי. שגרות בוקר מאתגרות במיוחד. מרגיש מוצף ממשימות.',
      objective: 'הושלמה הערכת COPM. זוהו בעיות ביצוע תעסוקתי מרכזיות בהכנה לעבודה, ניהול זמן ופעילויות פנאי.',
      assessment: 'חרדה משפיעה משמעותית על ביצוע תעסוקתי במספר תחומי חיים. אתגרים בתפקודים ניהוליים בולטים ביזימת משימות.',
      plan: 'פיתוח שגרה יומית מובנית. הכנסת שינויים סביבתיים לסביבת העבודה. טיפול באסטרטגיות ניהול זמן.',
      interventionsUsed: ['הערכת COPM', 'ניתוח פעילות', 'תכנון שינויים סביבתיים'],
      progressTowardGoals: 'נקבע קו בסיס להתערבות ריפוי בעיסוק.',
      homework: 'מעקב אחר פעילויות יומיות ורמות אנרגיה באמצעות יומן שסופק.',
      nextSessionPlan: 'סקירת יומן פעילות. התחלת בניית שגרה.',
    },
    createdAt: new Date('2024-12-24'),
    updatedAt: new Date('2024-12-24'),
    signedAt: new Date('2024-12-24T11:00:00'),
    signedBy: 'user-3',
  },
  {
    id: 'session-5',
    patientId: 'patient-1',
    therapistId: 'user-4',
    therapistRole: 'psychiatrist',
    sessionType: 'follow_up',
    scheduledAt: new Date('2024-12-26T15:00:00'),
    startedAt: new Date('2024-12-26T15:05:00'),
    endedAt: new Date('2024-12-26T15:30:00'),
    duration: 25,
    status: 'completed',
    location: 'telehealth',
    notes: {
      chiefComplaint: 'מעקב תרופות',
      subjective: 'המטופלת מדווחת על סבילות טובה לתרופות הנוכחיות. אין תופעות לוואי משמעותיות. מצב הרוח יציב יותר בשבועיים האחרונים.',
      objective: 'בדיקת מצב נפשי בטווח התקין. אין סימנים לתופעות לוואי של תרופות. ציון PHQ-9: 12 (שיפור מ-18).',
      assessment: 'תגובה חיובית למשטר התרופות הנוכחי. תסמיני דיכאון מראים שיפור.',
      plan: 'המשך תרופות נוכחיות: סרטרלין 100 מ"ג יומי. מעקב בעוד 4 שבועות או מוקדם יותר אם נדרש.',
      interventionsUsed: ['ניהול תרופות', 'מתן PHQ-9'],
      medications: [
        {
          name: 'סרטרלין',
          dosage: '100 מ"ג',
          frequency: 'יומי, בבוקר',
          prescribedBy: 'ד"ר דוד מזרחי',
          sideEffects: 'בחילה קלה ראשונית, חלפה',
        },
      ],
      nextSessionPlan: 'מעקב תרופות שגרתי.',
    },
    createdAt: new Date('2024-12-26'),
    updatedAt: new Date('2024-12-26'),
    signedAt: new Date('2024-12-26T16:00:00'),
    signedBy: 'user-4',
  },
  {
    id: 'session-6',
    patientId: 'patient-3',
    therapistId: 'user-1',
    therapistRole: 'psychologist',
    sessionType: 'individual_therapy',
    scheduledAt: new Date('2024-12-27T13:00:00'),
    status: 'scheduled',
    duration: 50,
    location: 'in_person',
    notes: {
      subjective: '',
      objective: '',
      assessment: '',
      plan: '',
      interventionsUsed: [],
    },
    createdAt: new Date('2024-12-20'),
    updatedAt: new Date('2024-12-20'),
  },
];

// Mock Treatment Goals
export const mockTreatmentGoals: TreatmentGoal[] = [
  {
    id: 'goal-1',
    patientId: 'patient-1',
    description: 'שיפור איכות השינה וקביעת לוח זמנים עקבי לשינה',
    targetDate: new Date('2025-03-01'),
    status: 'active',
    progress: 60,
    measurementCriteria: 'שינה 7-8 שעות בלילה, 5+ לילות בשבוע',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-12-20'),
    createdBy: 'user-1',
  },
  {
    id: 'goal-2',
    patientId: 'patient-1',
    description: 'הגברת מעורבות חברתית והפחתת בידוד',
    targetDate: new Date('2025-04-01'),
    status: 'active',
    progress: 40,
    measurementCriteria: 'השתתפות ב-2+ פעילויות חברתיות בשבוע',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-12-20'),
    createdBy: 'user-1',
  },
  {
    id: 'goal-3',
    patientId: 'patient-1',
    description: 'השגת יציבות דיור',
    targetDate: new Date('2025-06-01'),
    status: 'active',
    progress: 30,
    measurementCriteria: 'הבטחת הסדר דיור יציב',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-12-22'),
    createdBy: 'user-2',
  },
  {
    id: 'goal-4',
    patientId: 'patient-2',
    description: 'הפחתת התנהגויות הימנעות הקשורות לחרדה',
    targetDate: new Date('2025-03-15'),
    status: 'active',
    progress: 45,
    measurementCriteria: 'השלמה מוצלחת של פריטים בהיררכיית החשיפה',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-12-23'),
    createdBy: 'user-1',
  },
  {
    id: 'goal-5',
    patientId: 'patient-2',
    description: 'ביסוס ניהול שגרה יומית אפקטיבי',
    targetDate: new Date('2025-04-01'),
    status: 'active',
    progress: 20,
    measurementCriteria: 'מעקב עקבי אחרי שגרות בוקר וערב 5+ ימים בשבוע',
    createdAt: new Date('2024-12-24'),
    updatedAt: new Date('2024-12-24'),
    createdBy: 'user-3',
  },
];

// Mock Reports
export const mockReports: Report[] = [
  {
    id: 'report-1',
    patientId: 'patient-1',
    reportType: 'progress_summary',
    generatedBy: 'user-1',
    generatedAt: new Date('2024-12-15'),
    dateRange: {
      start: new Date('2024-10-01'),
      end: new Date('2024-12-15'),
    },
    content: {
      summary: 'המטופלת הראתה שיפור יציב בתסמיני דיכאון לאורך תקופת הדיווח. איכות השינה השתפרה משמעותית עם יישום אסטרטגיות היגיינת שינה. מעורבות חברתית נותרה תחום מיקוד.',
      sessionsSummary: [
        {
          date: new Date('2024-12-20'),
          therapistRole: 'psychologist',
          sessionType: 'individual_therapy',
          keyPoints: 'טכניקות CBT, ארגון מחדש קוגניטיבי',
          progress: 'המשך שיפור במצב הרוח',
        },
      ],
      goalsProgress: [
        {
          goalDescription: 'שיפור איכות השינה',
          initialStatus: 'שינה 4-5 שעות, לוח זמנים לא סדיר',
          currentStatus: 'שינה 6-7 שעות, יותר עקבית',
          progressPercentage: 60,
          notes: 'תגובה טובה להתערבויות היגיינת שינה',
        },
      ],
      recommendations: 'המשך תוכנית הטיפול הנוכחית. שקילת טיפול קבוצתי למטרות מעורבות חברתית.',
      clinicalImpressions: 'הפרוגנוזה חיובית עם המשך מעורבות בטיפול.',
    },
    status: 'finalized',
    signedBy: 'user-1',
    signedAt: new Date('2024-12-15T16:00:00'),
  },
];

// Helper functions to simulate database operations
export function getPatientById(id: string): Patient | undefined {
  return mockPatients.find(p => p.id === id);
}

export function getSessionsByPatient(patientId: string): Session[] {
  return mockSessions.filter(s => s.patientId === patientId);
}

export function getSessionsByTherapist(therapistId: string): Session[] {
  return mockSessions.filter(s => s.therapistId === therapistId);
}

export function getUserById(id: string): User | undefined {
  return mockUsers.find(u => u.id === id);
}

export function getGoalsByPatient(patientId: string): TreatmentGoal[] {
  return mockTreatmentGoals.filter(g => g.patientId === patientId);
}

export function getReportsByPatient(patientId: string): Report[] {
  return mockReports.filter(r => r.patientId === patientId);
}

// Patient creation interface
export interface CreatePatientData {
  idNumber: string; // Israeli ID number (תעודת זהות)
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  diagnosis?: string;
  referralSource?: string;
  insurance?: string;
  assignedTherapistId: string;
}

// Add new patient to the mock database
export function addPatient(data: CreatePatientData): Patient {
  const newPatient: Patient = {
    id: generateId(),
    idNumber: data.idNumber,
    encryptedData: `encrypted-${data.firstName}-${data.lastName}`, // Simulated encryption
    firstName: data.firstName,
    lastName: data.lastName,
    dateOfBirth: data.dateOfBirth,
    gender: data.gender,
    primaryDiagnosis: data.diagnosis || undefined,
    referralSource: data.referralSource || undefined,
    insuranceProvider: data.insurance || undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    assignedTherapists: [data.assignedTherapistId],
    status: 'active',
  };

  mockPatients.push(newPatient);
  return newPatient;
}

// Get all patients (for reactive updates)
export function getPatients(): Patient[] {
  return mockPatients;
}

// Therapist role display names
export const therapistRoleLabels: Record<TherapistRole, string> = {
  psychologist: 'פסיכולוג',
  psychiatrist: 'פסיכיאטר',
  social_worker: 'עובד סוציאלי',
  occupational_therapist: 'מרפא בעיסוק',
  speech_therapist: 'קלינאי תקשורת',
  physical_therapist: 'פיזיותרפיסט',
  counselor: 'יועץ',
  art_therapist: 'מטפל באמנות',
  music_therapist: 'מטפל במוזיקה',
  family_therapist: 'מטפל משפחתי',
};

// Session type display names
export const sessionTypeLabels: Record<SessionType, string> = {
  initial_assessment: 'הערכה ראשונית',
  individual_therapy: 'טיפול פרטני',
  group_therapy: 'טיפול קבוצתי',
  family_therapy: 'טיפול משפחתי',
  evaluation: 'אבחון',
  follow_up: 'מעקב',
  crisis_intervention: 'התערבות במשבר',
  discharge_planning: 'תכנון שחרור',
};
