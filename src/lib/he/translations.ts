// Hebrew translations for TherapyDocs

// Navigation labels
export const navigation = {
  dashboard: 'לוח בקרה',
  patients: 'מטופלים',
  sessions: 'מפגשים',
  reports: 'דוחות',
  aiInsights: 'תובנות AI',
  settings: 'הגדרות',
  helpSupport: 'עזרה ותמיכה',
  support: 'תמיכה',
};

// Dashboard
export const dashboard = {
  welcome: 'ברוך שובך',
  todaysSessions: 'מפגשים להיום',
  activePatients: 'מטופלים פעילים',
  pendingDocumentation: 'תיעוד ממתין',
  aiAlerts: 'התראות AI',
  attentionRequired: 'נדרשת תשומת לב',
  todaysSchedule: 'לוח הזמנים להיום',
  recentActivity: 'פעילות אחרונה',
  myPatients: 'המטופלים שלי',
  quickActions: 'פעולות מהירות',
  newSession: 'מפגש חדש',
  addNewPatient: 'הוסף מטופל חדש',
  generateReport: 'צור דוח',
  treatmentResources: 'משאבי טיפול',
  viewAll: 'הצג הכל',
  completeNow: 'השלם עכשיו',
  noSessionsToday: 'אין מפגשים מתוכננים להיום',
  sessionCompleted: 'מפגש הושלם עם',
  signed: 'חתום',
  pending: 'ממתין',
  next: 'הבא',
  treatmentProgress: 'התקדמות בטיפול',
  last: 'אחרון',
  scheduleNewSession: 'תזמן מפגש חדש',
  sessionSchedulingForm: 'טופס תזמון מפגש יופיע כאן...',
};

// Patient-related
export const patients = {
  patientCode: 'קוד מטופל',
  diagnosis: 'אבחנה',
  noDiagnosis: 'אין אבחנה רשומה',
  insuranceProvider: 'ספק ביטוח',
  noInsurance: 'ללא ביטוח',
  referredBy: 'הופנה ע"י',
  unknown: 'לא ידוע',
  status: {
    active: 'פעיל',
    inactive: 'לא פעיל',
    discharged: 'שוחרר',
  },
  treatmentProgress: 'התקדמות בטיפול',
  lastSession: 'מפגש אחרון',
  nextSession: 'מפגש הבא',
};

// Session-related
export const sessions = {
  sessionDocumentation: 'תיעוד מפגש',
  sessionType: 'סוג מפגש',
  voiceNote: 'הקלטה קולית',
  riskAssessment: 'הערכת סיכון',
  fromTemplate: 'מתבנית',
  clinicalNotes: 'רשומות קליניות (פורמט SOAP)',
  chiefComplaint: 'תלונה עיקרית',
  subjective: 'סובייקטיבי',
  objective: 'אובייקטיבי',
  assessment: 'הערכה',
  plan: 'תוכנית',
  interventionsUsed: 'התערבויות שנעשו',
  additionalInfo: 'מידע נוסף',
  progressTowardGoals: 'התקדמות לעבר מטרות',
  homework: 'משימות בין מפגשים',
  planForNextSession: 'תוכנית למפגש הבא',
  cancel: 'ביטול',
  saveDraft: 'שמור טיוטה',
  completeAndSign: 'סיים וחתום',

  // Placeholders
  placeholders: {
    chiefComplaint: 'הדאגה העיקרית של המטופל למפגש זה',
    subjective: 'דיווח עצמי של המטופל: מצב רוח, מחשבות, התנהגויות, תסמינים מאז המפגש האחרון',
    objective: 'תצפיות קליניות, מצב נפשי, אפקט, התנהגות, תוצאות בדיקות',
    assessment: 'פרשנות קלינית, רשמים אבחוניים, הערכת התקדמות',
    plan: 'תוכנית טיפול, מטרות, התערבויות למפגש הבא',
    progressTowardGoals: 'עדכון על התקדמות במטרות הטיפול',
    homework: 'משימות שניתנו למטופל',
    nextSessionPlan: 'נושאים והתערבויות מתוכננים למפגש הבא',
    riskNotes: 'תצפיות נוספות הקשורות לסיכון',
  },

  // Helper texts
  helperTexts: {
    subjective: 'מה המטופל מדווח על מצבו',
    objective: 'מה אתה צופה במהלך המפגש',
    assessment: 'הפרשנות המקצועית שלך',
    plan: 'מה אתה מתכנן לעשות הלאה',
  },

  // Status labels
  status: {
    scheduled: 'מתוכנן',
    in_progress: 'בתהליך',
    completed: 'הושלם',
    cancelled: 'בוטל',
    no_show: 'לא הגיע',
  },

  // Location labels
  location: {
    in_person: 'פנים אל פנים',
    telehealth: 'טלה-בריאות',
    home_visit: 'ביקור בית',
  },

  signedAt: 'נחתם',
  duration: 'משך',
  minutes: 'דקות',
};

// Session types
export const sessionTypeLabels: Record<string, string> = {
  initial_assessment: 'הערכה ראשונית',
  individual_therapy: 'טיפול פרטני',
  group_therapy: 'טיפול קבוצתי',
  family_therapy: 'טיפול משפחתי',
  evaluation: 'אבחון',
  follow_up: 'מעקב',
  crisis_intervention: 'התערבות במשבר',
  discharge_planning: 'תכנון שחרור',
};

// Therapist roles
export const therapistRoleLabels: Record<string, string> = {
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

// Risk Assessment
export const riskAssessment = {
  title: 'הערכת סיכון',
  important: 'חשוב:',
  crisisWarning: 'אם המטופל מדווח על מחשבות אובדניות או רציחניות פעילות עם תוכנית, יש לפעול מיד לפי פרוטוקול ההתערבות במשבר של המוסד.',
  suicidalIdeation: 'מחשבות אובדניות',
  homicidalIdeation: 'מחשבות רציחניות',
  selfHarm: 'פגיעה עצמית',
  substanceUse: 'שימוש בחומרים',
  safetyPlanReviewed: 'תוכנית בטיחות נסקרה עם המטופל',
  additionalNotes: 'הערות נוספות',
  save: 'שמור הערכה',

  options: {
    suicidal: {
      none: 'אין',
      passive: 'מחשבות פסיביות',
      active_no_plan: 'פעיל - ללא תוכנית',
      active_with_plan: 'פעיל - עם תוכנית',
    },
    homicidal: {
      none: 'אין',
      present: 'קיים',
    },
    selfHarm: {
      none: 'אין',
      history: 'היסטוריה בלבד',
      current: 'נוכחי',
    },
    substance: {
      none: 'אין',
      active: 'שימוש פעיל',
      in_recovery: 'בהחלמה',
    },
  },
};

// Voice Recorder
export const voiceRecorder = {
  title: 'הקלטת הערה קולית',
  clickToStart: 'לחץ להתחלת הקלטה',
  recording: 'מקליט...',
  startRecording: 'התחל הקלטה',
  stopRecording: 'עצור הקלטה',
  transcription: 'תמלול',
  discard: 'בטל',
  addToNotes: 'הוסף לרשומות',
  hipaaCompliant: 'כל ההקלטות מוצפנות ותואמות HIPAA',
};

// Reports
export const reports = {
  generateReport: 'צור דוח טיפולי',
  reportType: 'סוג דוח',
  startDate: 'תאריך התחלה',
  endDate: 'תאריך סיום',
  generateWithAI: 'צור דוח עם AI',
  aiInsights: 'תובנות AI',
  confidence: 'רמת ביטחון',
  preview: 'תצוגה מקדימה',
  saveReport: 'שמור דוח',
  exportReport: 'ייצא דוח',
  view: 'הצג',
  export: 'ייצא',

  types: {
    progress_summary: 'סיכום התקדמות',
    discharge_summary: 'סיכום שחרור',
    insurance_report: 'דוח לביטוח',
    referral_report: 'דוח הפניה',
    evaluation_report: 'דוח אבחון',
    treatment_summary: 'סיכום טיפול',
    multidisciplinary_summary: 'סיכום רב-מקצועי',
  },

  status: {
    draft: 'טיוטה',
    finalized: 'סופי',
    signed: 'חתום',
  },
};

// Common UI elements
export const common = {
  search: 'חיפוש',
  searchPlaceholder: 'חפש מטופלים, מפגשים...',
  save: 'שמור',
  cancel: 'ביטול',
  delete: 'מחק',
  edit: 'ערוך',
  close: 'סגור',
  loading: 'טוען...',
  error: 'שגיאה',
  success: 'הצלחה',
  patient: 'מטופל',
  therapist: 'מטפל',
  date: 'תאריך',
  time: 'שעה',
  duration: 'משך',
  hipaaCompliant: 'תואם HIPAA',
  clinicalDocumentation: 'תיעוד קליני',
  viewAll: 'הצג הכל',
  noData: 'אין נתונים',
};

// Application metadata
export const appMeta = {
  title: 'TherapyDocs | מערכת תיעוד קליני',
  description: 'מערכת תיעוד טיפולי מאובטחת ואינטואיטיבית לאנשי מקצוע בתחום הבריאות',
  appName: 'TherapyDocs',
  tagline: 'תיעוד קליני',
};

// Interventions
export const interventions = {
  psychologist: [
    'ארגון מחדש קוגניטיבי',
    'הפעלה התנהגותית',
    'טיפול בחשיפה',
    'מיינדפולנס',
    'ריאיון מוטיבציוני',
    'פסיכו-חינוך',
    'אימון הרפיה',
    'טיפול בפתרון בעיות',
    'טיפול בין-אישי',
    'טיפול קבלה ומחויבות',
    'מיומנויות DBT',
  ],
  socialWorker: [
    'ניהול מקרה',
    'חיבור למשאבים',
    'סנגור',
    'התערבות במשבר',
    'טיפול בפתרון בעיות',
    'ריאיון מוטיבציוני',
    'התערבות משפחתית',
    'תיאום טיפול',
    'תכנון שחרור',
    'פנייה לקהילה',
  ],
  occupationalTherapist: [
    'אימון ADL',
    'אימון IADL',
    'שיקום קוגניטיבי',
    'ויסות חושי',
    'מיומנויות מוטוריות',
    'מיומנויות חברתיות',
    'מיומנויות עבודה/לימודים',
    'חקירת פנאי',
    'התאמת סביבה',
  ],
  common: [
    'פסיכו-חינוך',
    'הקשבה פעילה',
    'ולידציה',
    'הקשבה רפלקטיבית',
    'הצבת מטרות',
    'סקירת התקדמות',
    'תיאום טיפול',
    'תיעוד',
  ],
};

// Assessment scales
export const assessmentScales = {
  psychologist: ['PHQ-9', 'GAD-7', 'BDI-II', 'BAI', 'PCL-5', 'OCI-R'],
  psychiatrist: ['PHQ-9', 'GAD-7', 'AIMS', 'CGI'],
  socialWorker: ['PRAPARE', 'PHQ-9'],
  occupationalTherapist: ['COPM', 'MOHOST', 'רמה קוגניטיבית של אלן'],
};

// Social determinants
export const socialDeterminants = [
  'דיור',
  'ביטחון תזונתי',
  'תחבורה',
  'תעסוקה',
  'השכלה',
  'טיפול בילדים',
  'גישה לשירותי בריאות',
  'תמיכה חברתית',
  'בטיחות',
  'סוגיות משפטיות',
];

// AI insights
export const aiInsights = {
  positiveTrend: 'מגמה חיובית זוהתה: מפגשים אחרונים מצביעים על שיפור בתסמינים ובתפקוד המטופל.',
  attentionNeeded: 'נדרשת תשומת לב: מפגשים אחרונים מרמזים על הידרדרות אפשרית במצב המטופל. יש לשקול סקירת תוכנית הטיפול.',
  stable: 'התקדמות הטיפול נראית יציבה. יש להמשיך לעקוב אחר שינויים.',
  elevatedRisk: 'סיכון מוגבר: הערכה אחרונה מצביעה על גורמי סיכון פעילים. יש לוודא שתוכנית הבטיחות עדכנית ולשקול מעקב מוגבר.',
  riskEscalation: 'זוהה דפוס הסלמת סיכון: יש לשקול תגובת צוות מתואמת וסקירת תוכנית בטיחות.',
  engagementConcern: 'דאגה למעורבות: שיעור גבוה מהרגיל של מפגשים שהוחמצו. יש לשקול פנייה יזומה והערכת מחסומים.',
  strongEngagement: 'מעורבות חזקה: המטופל מפגין נוכחות עקבית והשתתפות בטיפול.',

  // Report headers
  multidisciplinarySummary: 'סיכום טיפולי רב-מקצועי',
  patient: 'מטופל',
  period: 'תקופה',
  totalSessions: 'סה"כ מפגשים',
  treatmentByDiscipline: 'טיפול לפי תחום מקצועי',
  treatmentGoalsProgress: 'התקדמות במטרות הטיפול',
  riskAssessmentLatest: 'הערכת סיכון (עדכנית ביותר)',
};
