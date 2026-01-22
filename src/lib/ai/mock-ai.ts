// Mock AI responses for development and testing
// Returns role-appropriate summaries without making API calls

import type { SummaryResult } from './summary-generator';

/**
 * Generates a mock AI summary based on the prompts provided
 * Detects therapist role from system prompt and returns appropriate mock content
 *
 * @param systemPrompt - The system prompt (used to detect role)
 * @param userPrompt - The user prompt (used to detect language)
 * @returns SummaryResult with mock summary content
 */
export function generateMockSummary(
  systemPrompt: string,
  userPrompt: string
): SummaryResult {
  // Extract role from system prompt for role-appropriate mock
  const role = extractRoleFromPrompt(systemPrompt);

  // Generate a realistic mock summary based on role
  const summary = generateRoleSpecificMock(role, userPrompt);

  return {
    summary,
    mode: 'mock',
    model: 'mock-v1',
  };
}

/**
 * Extracts therapist role from system prompt content
 * Uses pattern matching on role-specific keywords
 */
function extractRoleFromPrompt(systemPrompt: string): string {
  const rolePatterns = [
    { pattern: /psychologist|psychological/i, role: 'psychologist' },
    { pattern: /psychiatrist|psychiatric/i, role: 'psychiatrist' },
    { pattern: /social worker/i, role: 'social_worker' },
    { pattern: /occupational therapist|OT /i, role: 'occupational_therapist' },
    { pattern: /speech therapist|speech-language/i, role: 'speech_therapist' },
    { pattern: /physical therapist|PT |physiotherapist/i, role: 'physical_therapist' },
    { pattern: /counselor/i, role: 'counselor' },
    { pattern: /art therapist/i, role: 'art_therapist' },
    { pattern: /music therapist/i, role: 'music_therapist' },
    { pattern: /family therapist/i, role: 'family_therapist' },
  ];

  for (const { pattern, role } of rolePatterns) {
    if (pattern.test(systemPrompt)) {
      return role;
    }
  }
  return 'generic';
}

/**
 * Generates role-specific mock summary content
 * Supports both Hebrew and English based on input language
 */
function generateRoleSpecificMock(role: string, userPrompt: string): string {
  // Check if Hebrew content (for bilingual support)
  const isHebrew = /[\u0590-\u05FF]/.test(userPrompt);

  const mockTemplates: Record<string, { en: string; he: string }> = {
    psychologist: {
      en: `**Clinical Session Summary**

The patient presented with moderate anxiety symptoms during today's session. Cognitive patterns observed include negative self-talk and catastrophic thinking, particularly around work-related stressors.

**Key Observations:**
- Patient demonstrated insight into anxiety triggers
- Successfully practiced grounding techniques during session
- Homework from previous session was partially completed

**Clinical Impression:**
The patient is showing gradual progress in identifying and challenging automatic negative thoughts. CBT interventions continue to be appropriate for the presenting concerns.

**Next Steps:**
Continue cognitive restructuring work; assign thought record for tracking anxiety episodes.`,
      he: `**סיכום מפגש קליני**

המטופל/ת הציג/ה סימפטומים של חרדה ברמה בינונית במהלך המפגש. דפוסי חשיבה שנצפו כוללים שיח עצמי שלילי וחשיבה קטסטרופלית, במיוחד סביב מתחים הקשורים לעבודה.

**תצפיות עיקריות:**
- המטופל/ת הפגין/ה תובנה לגבי טריגרים לחרדה
- תרגול מוצלח של טכניקות הארקה במהלך המפגש
- שיעורי בית מהמפגש הקודם הושלמו חלקית

**התרשמות קלינית:**
המטופל/ת מראה התקדמות הדרגתית בזיהוי ואתגור מחשבות אוטומטיות שליליות. התערבויות CBT ממשיכות להיות מתאימות לבעיות המוצגות.

**צעדים הבאים:**
המשך עבודה על ארגון מחדש קוגניטיבי; מתן יומן מחשבות למעקב אחר אירועי חרדה.`
    },
    psychiatrist: {
      en: `**Psychiatric Consultation Summary**

Current medication regimen reviewed and patient reports adherence. Mood has shown improvement since last adjustment.

**Mental Status Examination:**
- Appearance: Appropriately dressed, good hygiene
- Mood/Affect: Euthymic with reactive affect
- Thought Process: Linear and goal-directed
- No current suicidal or homicidal ideation

**Medication Notes:**
Current medications well-tolerated. No significant side effects reported. Sleep quality has improved.

**Plan:**
Continue current regimen. Follow-up in 4 weeks. Labs ordered for routine monitoring.`,
      he: `**סיכום התייעצות פסיכיאטרית**

נסקר משטר התרופות הנוכחי והמטופל/ת מדווח/ת על היענות. מצב הרוח הראה שיפור מאז ההתאמה האחרונה.

**בחינת מצב נפשי:**
- מראה: לבוש/ה בהתאם, היגיינה תקינה
- מצב רוח/אפקט: אאוטימי עם אפקט תגובתי
- תהליך חשיבה: ליניארי ומכוון מטרה
- אין אידאציה אובדנית או רצחנית נוכחית

**הערות תרופות:**
התרופות הנוכחיות נסבלות היטב. לא דווחו תופעות לוואי משמעותיות. איכות השינה השתפרה.

**תוכנית:**
המשך משטר נוכחי. מעקב בעוד 4 שבועות. בדיקות מעבדה הוזמנו לניטור שגרתי.`
    },
    social_worker: {
      en: `**Social Work Session Summary**

Conducted comprehensive psychosocial assessment addressing patient's current needs and resources.

**Areas Addressed:**
- Housing stability: Stable, no current concerns
- Financial resources: Connected to community assistance programs
- Family support: Moderate family involvement
- Access to care: Coordinated with medical team

**Interventions:**
Case management services provided including resource connection and advocacy for benefits application.

**Plan:**
Follow up on pending benefit applications. Continue care coordination with treatment team.`,
      he: `**סיכום מפגש עבודה סוציאלית**

בוצעה הערכה פסיכו-סוציאלית מקיפה המתייחסת לצרכים ולמשאבים הנוכחיים של המטופל/ת.

**תחומים שטופלו:**
- יציבות דיור: יציב, אין חששות נוכחיים
- משאבים כלכליים: חובר לתוכניות סיוע קהילתיות
- תמיכה משפחתית: מעורבות משפחתית בינונית
- גישה לטיפול: תואם עם הצוות הרפואי

**התערבויות:**
סופקו שירותי ניהול מקרה כולל חיבור למשאבים וסנגור לבקשות קצבאות.

**תוכנית:**
מעקב אחר בקשות קצבאות תלויות ועומדות. המשך תיאום טיפול עם צוות הטיפול.`
    },
    occupational_therapist: {
      en: `**Occupational Therapy Session Summary**

Session focused on functional performance in daily living activities and work-related tasks.

**Areas Assessed:**
- ADL Performance: Independent in basic ADLs, requires support for IADLs
- Fine Motor Skills: Within functional limits
- Cognitive Function: Mild attention difficulties noted
- Work Readiness: Progressing toward vocational goals

**Interventions Applied:**
- Activity modification strategies for energy conservation
- Adaptive equipment training
- Cognitive rehabilitation exercises

**Progress:**
Patient demonstrating improved task completion with compensatory strategies. Continue focus on work-related skill development.`,
      he: `**סיכום מפגש ריפוי בעיסוק**

המפגש התמקד בביצועים תפקודיים בפעילויות חיי היום-יום ובמשימות הקשורות לעבודה.

**תחומים שנבדקו:**
- ביצוע ADL: עצמאי ב-ADL בסיסי, דורש תמיכה ב-IADL
- מיומנויות מוטוריקה עדינה: בגבולות תפקודיים
- תפקוד קוגניטיבי: צוינו קשיי קשב קלים
- מוכנות לעבודה: מתקדם לעבר יעדים תעסוקתיים

**התערבויות שהופעלו:**
- אסטרטגיות התאמת פעילות לשימור אנרגיה
- הדרכה על ציוד מותאם
- תרגילי שיקום קוגניטיבי

**התקדמות:**
המטופל/ת מפגין/ה השלמת משימות משופרת עם אסטרטגיות מפצות. המשך התמקדות בפיתוח מיומנויות הקשורות לעבודה.`
    },
    speech_therapist: {
      en: `**Speech-Language Therapy Session Summary**

Session addressed communication and language goals with focus on functional communication strategies.

**Areas Treated:**
- Articulation: Targeted /r/ and /l/ sounds
- Language Processing: Auditory comprehension exercises
- Voice: Vocal hygiene education provided
- Fluency: Strategies for managing speech rate

**Session Activities:**
Structured practice with minimal pair contrasts, narrative retelling tasks, and conversation practice.

**Progress:**
Improved accuracy noted on targeted sounds in structured tasks. Carryover to conversational speech continues to develop.`,
      he: `**סיכום מפגש קלינאות תקשורת**

המפגש התייחס ליעדי תקשורת ושפה עם התמקדות באסטרטגיות תקשורת תפקודית.

**תחומים שטופלו:**
- היגוי: מיקוד בהגיים /ר/ ו-/ל/
- עיבוד שפה: תרגילי הבנה שמיעתית
- קול: ניתן חינוך להיגיינה קולית
- שטף: אסטרטגיות לניהול קצב דיבור

**פעילויות המפגש:**
תרגול מובנה עם ניגודים מינימליים, משימות סיפור מחדש נרטיבי ותרגול שיחה.

**התקדמות:**
צוין דיוק משופר בהגיים ממוקדים במשימות מובנות. העברה לדיבור שיחתי ממשיכה להתפתח.`
    },
    physical_therapist: {
      en: `**Physical Therapy Session Summary**

Session focused on improving mobility, strength, and functional movement patterns.

**Assessment Findings:**
- Range of Motion: Slight limitations in shoulder flexion
- Strength: 4/5 in lower extremities
- Gait: Steady, no assistive device needed
- Balance: Good static balance, dynamic balance improving

**Interventions:**
- Therapeutic exercises for strengthening
- Manual therapy for mobility
- Gait training with progression
- Balance activities

**Progress:**
Patient showing improved functional mobility. Continue progressive strengthening program.`,
      he: `**סיכום מפגש פיזיותרפיה**

המפגש התמקד בשיפור ניידות, כוח ודפוסי תנועה תפקודיים.

**ממצאי הערכה:**
- טווח תנועה: מגבלות קלות בכיפוף כתף
- כוח: 4/5 בגפיים תחתונות
- הליכה: יציבה, אין צורך במכשיר עזר
- שיווי משקל: שיווי משקל סטטי טוב, שיווי משקל דינמי משתפר

**התערבויות:**
- תרגילים טיפוליים לחיזוק
- טיפול ידני לניידות
- אימון הליכה עם התקדמות
- פעילויות שיווי משקל

**התקדמות:**
המטופל/ת מראה ניידות תפקודית משופרת. המשך תוכנית חיזוק פרוגרסיבית.`
    },
    counselor: {
      en: `**Counseling Session Summary**

Supportive counseling session addressing current life stressors and coping strategies.

**Topics Discussed:**
- Current stressors: Work-life balance challenges
- Emotional processing: Explored feelings of overwhelm
- Coping skills: Reviewed and practiced stress management techniques
- Support system: Discussed ways to strengthen social connections

**Therapeutic Approach:**
Person-centered approach with active listening and reflection. Validated patient's experiences while exploring strengths and resources.

**Plan:**
Continue weekly sessions. Practice identified coping strategies between sessions.`,
      he: `**סיכום מפגש ייעוץ**

מפגש ייעוץ תומך המתייחס ללחצים נוכחיים בחיים ואסטרטגיות התמודדות.

**נושאים שנדונו:**
- לחצים נוכחיים: אתגרי איזון עבודה-חיים
- עיבוד רגשי: נחקרו רגשות של עומס
- מיומנויות התמודדות: נסקרו ותורגלו טכניקות ניהול מתח
- מערכת תמיכה: נדונו דרכים לחיזוק קשרים חברתיים

**גישה טיפולית:**
גישה ממוקדת אדם עם הקשבה פעילה והשתקפות. אימות חוויות המטופל/ת תוך חקירת חוזקות ומשאבים.

**תוכנית:**
המשך מפגשים שבועיים. תרגול אסטרטגיות התמודדות שזוהו בין מפגשים.`
    },
    art_therapist: {
      en: `**Art Therapy Session Summary**

Creative expression session utilizing visual arts as therapeutic medium for emotional exploration.

**Media Used:**
- Drawing materials
- Mixed media collage

**Themes Explored:**
Patient created imagery representing feelings of transition and change. Artwork reflected both anxiety about uncertainty and hope for new possibilities.

**Process Observations:**
Patient engaged thoughtfully with materials, demonstrating increased comfort with creative expression. Verbal processing of artwork content facilitated insight.

**Therapeutic Gains:**
Improved ability to externalize and communicate complex emotions through visual representation.`,
      he: `**סיכום מפגש טיפול באמנות**

מפגש ביטוי יצירתי המשתמש באמנות חזותית כמדיום טיפולי לחקירה רגשית.

**מדיה שנעשה בה שימוש:**
- חומרי ציור
- קולאז' מדיה מעורבת

**נושאים שנחקרו:**
המטופל/ת יצר/ה דימויים המייצגים רגשות של מעבר ושינוי. היצירה שיקפה הן חרדה מאי-ודאות והן תקווה לאפשרויות חדשות.

**תצפיות תהליך:**
המטופל/ת התעסק/ה בהרהור עם החומרים, והפגין/ה נוחות מוגברת עם ביטוי יצירתי. עיבוד מילולי של תוכן היצירה הקל על תובנה.

**רווחים טיפוליים:**
יכולת משופרת להחצנה ותקשורת של רגשות מורכבים באמצעות ייצוג חזותי.`
    },
    music_therapist: {
      en: `**Music Therapy Session Summary**

Therapeutic engagement through musical intervention focusing on emotional regulation and expression.

**Interventions Used:**
- Active music making (drumming)
- Receptive music listening
- Lyric analysis and discussion

**Session Focus:**
Used rhythmic activities to support grounding and present-moment awareness. Song selection reflected patient's current emotional state.

**Observations:**
Patient demonstrated increased engagement and affect regulation through musical participation. Rhythmic activities particularly effective for anxiety reduction.

**Progress:**
Continuing to develop musical skills as coping tools. Patient reports using music for self-regulation between sessions.`,
      he: `**סיכום מפגש טיפול במוזיקה**

מעורבות טיפולית באמצעות התערבות מוזיקלית המתמקדת בוויסות רגשי וביטוי.

**התערבויות שנעשה בהן שימוש:**
- יצירת מוזיקה פעילה (תיפוף)
- האזנה למוזיקה רצפטיבית
- ניתוח מילות שיר ודיון

**מיקוד המפגש:**
שימוש בפעילויות קצביות לתמיכה בהארקה ומודעות לרגע הנוכחי. בחירת השירים שיקפה את המצב הרגשי הנוכחי של המטופל/ת.

**תצפיות:**
המטופל/ת הפגין/ה מעורבות מוגברת וויסות אפקט באמצעות השתתפות מוזיקלית. פעילויות קצביות היו יעילות במיוחד להפחתת חרדה.

**התקדמות:**
ממשיך/ה לפתח מיומנויות מוזיקליות ככלי התמודדות. המטופל/ת מדווח/ת על שימוש במוזיקה לוויסות עצמי בין מפגשים.`
    },
    family_therapist: {
      en: `**Family Therapy Session Summary**

Family session addressing relationship dynamics, communication patterns, and shared concerns.

**Family Members Present:**
- Patient
- Spouse/Partner
- [Other family members as applicable]

**Topics Addressed:**
- Communication patterns within the family
- Role expectations and boundaries
- Conflict resolution strategies
- Shared goals for family functioning

**Observations:**
Family demonstrated willingness to engage in difficult conversations. Identified patterns of escalation that could be modified with new communication skills.

**Interventions:**
Facilitated structured dialogue, taught active listening techniques, and assigned communication exercises for home practice.

**Plan:**
Continue family sessions bi-weekly. Practice new communication strategies between sessions.`,
      he: `**סיכום מפגש טיפול משפחתי**

מפגש משפחתי המתייחס לדינמיקות יחסים, דפוסי תקשורת ודאגות משותפות.

**בני משפחה נוכחים:**
- המטופל/ת
- בן/בת זוג
- [בני משפחה נוספים לפי הרלוונטיות]

**נושאים שטופלו:**
- דפוסי תקשורת בתוך המשפחה
- ציפיות תפקיד וגבולות
- אסטרטגיות לפתרון קונפליקטים
- יעדים משותפים לתפקוד משפחתי

**תצפיות:**
המשפחה הפגינה נכונות לעסוק בשיחות קשות. זוהו דפוסי הסלמה שניתן לשנות עם מיומנויות תקשורת חדשות.

**התערבויות:**
הנחיית דיאלוג מובנה, הוראת טכניקות הקשבה פעילה והקצאת תרגילי תקשורת לתרגול בבית.

**תוכנית:**
המשך מפגשים משפחתיים דו-שבועיים. תרגול אסטרטגיות תקשורת חדשות בין מפגשים.`
    },
    generic: {
      en: `**Session Summary**

Session completed successfully. Patient engaged appropriately throughout the session.

**Key Points:**
- Patient presented with ongoing concerns
- Therapeutic interventions were applied
- Progress noted toward treatment goals

**Observations:**
Patient demonstrated engagement with the therapeutic process. Areas for continued focus were identified.

**Plan:**
Continue current treatment approach. Schedule follow-up session.`,
      he: `**סיכום מפגש**

המפגש הושלם בהצלחה. המטופל/ת היה/תה מעורב/ת לאורך כל המפגש.

**נקודות מפתח:**
- המטופל/ת הציג/ה דאגות מתמשכות
- הופעלו התערבויות טיפוליות
- צוינה התקדמות לקראת יעדי הטיפול

**תצפיות:**
המטופל/ת הפגין/ה מעורבות בתהליך הטיפולי. זוהו תחומים להתמקדות מתמשכת.

**תוכנית:**
המשך גישת הטיפול הנוכחית. לקבוע מפגש מעקב.`
    }
  };

  const template = mockTemplates[role] || mockTemplates.generic;
  return isHebrew ? template.he : template.en;
}
