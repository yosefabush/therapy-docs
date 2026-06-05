import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'מדריך שימוש | TherapyDocs',
  description:
    'מדריך מלא, צעד אחר צעד, כיצד לעבוד עם TherapyDocs — מההתחברות ועד הפקת דוחות ותובנות AI.',
};

type Step = {
  id: string;
  num: string;
  title: string;
  lead: string;
  image: string;
  alt: string;
  actions: string[];
  tip?: string;
};

const steps: Step[] = [
  {
    id: 'login',
    num: '1',
    title: 'התחברות למערכת',
    lead: 'כל מפגש עבודה מתחיל בהתחברות מאובטחת. המערכת תואמת HIPAA — הנתונים מוצפנים והגישה מתועדת.',
    image: '/guide/01-login.png',
    alt: 'מסך ההתחברות של TherapyDocs',
    actions: [
      'הזינו את כתובת האימייל והסיסמה שקיבלתם מהמרפאה.',
      'סמנו «זכור אותי» כדי להישאר מחוברים במחשב אישי ומאובטח בלבד.',
      'לחצו «התחברות». אין לכם עדיין חשבון? לחצו «הירשם עכשיו» בתחתית הטופס.',
    ],
    tip: 'מטעמי אבטחה, המערכת מנתקת אתכם אוטומטית לאחר 30 דקות של חוסר פעילות.',
  },
  {
    id: 'dashboard',
    num: '2',
    title: 'לוח הבקרה — התמונה היומית',
    lead: 'מיד לאחר ההתחברות תגיעו ללוח הבקרה. זוהי נקודת המוצא של יום העבודה: כל מה שדורש את תשומת לבכם במקום אחד.',
    image: '/guide/02-dashboard.png',
    alt: 'לוח הבקרה הראשי',
    actions: [
      'הכרטיסים העליונים מציגים סיכום מהיר: התראות AI, תיעוד שממתין להשלמה, מטופלים פעילים ומפגשי היום.',
      '«לוח הזמנים להיום» מרכז את כל המפגשים המתוכננים, ו«פעילות אחרונה» מציגה את הפעולות האחרונות שלכם.',
      'בכרטיס «המטופלים שלי» תראו את ההתקדמות הטיפולית של כל מטופל — לחיצה על כרטיס פותחת את תיק המטופל.',
      'אזור «פעולות מהירות» מאפשר לתזמן מפגש, ליצור דוח או לגשת למשאבי טיפול בלחיצה אחת.',
    ],
  },
  {
    id: 'patients',
    num: '3',
    title: 'ניהול מטופלים',
    lead: 'מסך «מטופלים» הוא פנקס המטופלים הדיגיטלי שלכם. כאן מוסיפים מטופל חדש ומאתרים מטופל קיים.',
    image: '/guide/03-patients.png',
    alt: 'רשימת המטופלים',
    actions: [
      'להוספת מטופל חדש לחצו «+ מטופל חדש» בפינה העליונה ומלאו את הפרטים (שם, ת״ז, תאריך לידה, אבחנה ראשונית ומטפלים מטפלים).',
      'השתמשו בשורת החיפוש כדי לאתר מטופל לפי שם, ת״ז או אבחנה.',
      'עברו בין הלשוניות «כל המטופלים», «פעילים» ו«שוחררו» כדי לסנן לפי סטטוס.',
      'לחצו על כרטיס מטופל כדי לפתוח את התיק המלא שלו.',
    ],
    tip: 'אתם רואים אך ורק מטופלים שמשויכים אליכם. הרשאות הגישה נאכפות בשרת לשמירה על פרטיות.',
  },
  {
    id: 'patient',
    num: '4',
    title: 'תיק המטופל',
    lead: 'תיק המטופל מרכז את כל המידע הקליני: פרטים אישיים, מטרות טיפול, היסטוריית מפגשים ותובנות AI.',
    image: '/guide/04-patient-detail.png',
    alt: 'מסך תיק המטופל',
    actions: [
      'בראש העמוד מוצגים הפרטים האישיים והסטטיסטיקה: מספר מפגשים, אחוז התקדמות ומספר מטרות פעילות.',
      '«מטרות בטיפול» מציג כל מטרה עם פס התקדמות וסטטוס — עדכנו אותן ככל שהטיפול מתקדם.',
      '«מפגשים אחרונים» מרכז את תיעוד המפגשים; לחיצה על מפגש פותחת אותו לצפייה או עריכה.',
      'פאנל «תובנות AI» מציג ניתוח חכם של דפוסים, מגמות וסיכונים שזוהו לאורך הטיפול.',
    ],
  },
  {
    id: 'sessions',
    num: '5',
    title: 'תזמון וניהול מפגשים',
    lead: 'מסך «מפגשים» מציג את יומן הטיפולים שלכם ומאפשר לתזמן מפגשים חדשים.',
    image: '/guide/05-sessions.png',
    alt: 'רשימת המפגשים',
    actions: [
      'לתזמון מפגש חדש לחצו «+ מפגש חדש»: בחרו מטופל, סוג מפגש (הערכה, טיפול פרטני, טיפול משפחתי ועוד), תאריך, שעה ומיקום.',
      'המפגשים מסומנים בסטטוסים: «מתוכנן», «בתהליך», «הושלם», «בוטל» או «לא הגיע».',
      'לחצו על מפגש כדי לפתוח אותו ולתעד אותו.',
    ],
    tip: 'כל מפגש משויך אוטומטית לתבנית ה-SOAP המתאימה לתפקיד המקצועי שלכם (פסיכולוג, פסיכיאטר, עו״ס ועוד).',
  },
  {
    id: 'documentation',
    num: '6',
    title: 'תיעוד מפגש — הלב של העבודה',
    lead: 'מסך המפגש הוא המקום שבו מתבצע התיעוד הקליני: רשומת SOAP, הקלטה ותמלול, סיכום AI והערכת סיכון.',
    image: '/guide/06-session-detail.png',
    alt: 'מסך תיעוד מפגש עם רשומת SOAP וסיכום AI',
    actions: [
      'מלאו את רשומת ה-SOAP בארבעת החלקים הצבעוניים: סובייקטיבי (S), אובייקטיבי (O), הערכה (A) ותכנית (P).',
      'סמנו את «ההתערבויות בשימוש» הרלוונטיות למפגש מתוך הרשימה המותאמת לתפקידכם.',
      'הקליטו את המפגש (בהסכמת המטופל) — המערכת מתמללת אוטומטית ומזהה דוברים נפרדים (מטפל/מטופל).',
      'לחצו «צור סיכום AI» כדי לקבל טיוטת סיכום מובנית; בדקו, ערכו ולחצו «שמור» לאישור הסיכום.',
      'מלאו את «הערכת הסיכון» לתיעוד גורמי סיכון ומגן — שדה קריטי לבטיחות המטופל.',
    ],
    tip: 'הסיכום נוצר במצב «בדיקה» (Mock) כברירת מחדל לפיתוח, ובמצב «AI» אמיתי בסביבת הייצור. תמיד עברו על הסיכום לפני שמירה.',
  },
  {
    id: 'reports',
    num: '7',
    title: 'הפקת דוחות',
    lead: 'מסך «דוחות» מאפשר להפיק מסמכים קליניים רשמיים — דוח התקדמות, סיכום טיפול, דוח שחרור או דוח לגורם מבטח.',
    image: '/guide/07-reports.png',
    alt: 'מסך הדוחות',
    actions: [
      'לחצו «+ דוח חדש», בחרו את סוג הדוח, את המטופל ואת טווח התאריכים.',
      'המערכת מרכזת אוטומטית את המפגשים והמטרות בטווח שנבחר לכדי טיוטת דוח.',
      'עברו על הדוח, ערכו את ההמלצות והרשמים הקליניים, ואז סמנו אותו כ«סופי» או «חתום».',
      'השתמשו בכפתורי הצפייה וההורדה כדי לצפות בדוח או לייצא אותו כקובץ PDF.',
    ],
  },
  {
    id: 'insights',
    num: '8',
    title: 'תובנות AI',
    lead: 'מסך «תובנות AI» מנתח את כלל המפגשים של מטופל ומציג תמונה רחבה שקשה לזהות ממפגש בודד.',
    image: '/guide/08-insights.png',
    alt: 'מסך תובנות ה-AI',
    actions: [
      'התובנות מחולקות לארבעה תחומים: דפוסים חוזרים, מגמות התקדמות, סימני סיכון ופערים בטיפול.',
      'בחרו מטופל והפיקו תובנות מעודכנות בלחיצה — הניתוח מבוסס על היסטוריית התיעוד.',
      'השתמשו בתובנות כבסיס לתכנון הטיפול ולשיחה עם המטופל — הן כלי תומך החלטה, לא תחליף לשיקול הדעת הקליני.',
    ],
  },
  {
    id: 'settings',
    num: '9',
    title: 'הגדרות',
    lead: 'במסך «הגדרות» תתאימו את הפרופיל המקצועי וההעדפות האישיות שלכם.',
    image: '/guide/09-settings.png',
    alt: 'מסך ההגדרות',
    actions: [
      'עדכנו את פרטי הפרופיל שלכם, התפקיד המקצועי ושיוך המרפאה.',
      'התאימו העדפות תצוגה והתראות לאופן העבודה שלכם.',
    ],
  },
  {
    id: 'help',
    num: '10',
    title: 'עזרה ותמיכה',
    lead: 'בכל שלב, מסך «עזרה ותמיכה» זמין עבורכם עם הסברים ומענה לשאלות נפוצות.',
    image: '/guide/10-help.png',
    alt: 'מסך העזרה והתמיכה',
    actions: [
      'עיינו במאגר השאלות הנפוצות והמדריכים.',
      'פנו לתמיכה ישירות מהמסך בכל בעיה או שאלה.',
    ],
  },
];

function BrowserFrame({ src, alt }: { src: string; alt: string }) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-clinical-200 bg-white shadow-soft">
      <div className="flex items-center gap-1.5 border-b border-clinical-100 bg-clinical-50 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-clinical-300" />
        <span className="h-3 w-3 rounded-full bg-clinical-300" />
        <span className="h-3 w-3 rounded-full bg-clinical-300" />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" className="block w-full" />
    </figure>
  );
}

export default function GuidePage() {
  return (
    <div dir="rtl" className="min-h-screen bg-warm-50 text-clinical-800">
      {/* Header */}
      <header className="border-b border-clinical-100 bg-white/80 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-600 text-white shadow-glow">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-bold leading-tight text-clinical-900" style={{ fontFamily: 'Georgia, serif' }}>
                TherapyDocs
              </p>
              <p className="text-xs text-clinical-500">מדריך שימוש למטפל</p>
            </div>
          </div>
          <Link
            href="/login"
            className="rounded-lg bg-sage-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sage-700"
          >
            כניסה למערכת
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-5 pt-14 pb-10 text-center">
        <span className="inline-block rounded-full bg-sage-100 px-4 py-1 text-sm font-medium text-sage-700">
          תיעוד קליני מאובטח · תואם HIPAA
        </span>
        <h1
          className="mt-5 text-3xl font-bold leading-snug text-clinical-900 sm:text-4xl"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          איך עובדים עם TherapyDocs
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-clinical-600">
          מדריך זה ילווה אתכם צעד אחר צעד בכל חלקי המערכת — מההתחברות, דרך ניהול
          המטופלים ותיעוד המפגשים, ועד הפקת דוחות ותובנות AI. בסיומו תדעו בדיוק
          כיצד לתעד את עבודתכם הטיפולית מתחילתה ועד סופה.
        </p>
      </section>

      {/* How it works — quick overview */}
      <section className="mx-auto max-w-5xl px-5 pb-10">
        <div className="rounded-2xl border border-sage-100 bg-white p-6 shadow-soft">
          <h2 className="mb-5 text-center text-lg font-semibold text-clinical-900">
            זרימת העבודה בקצרה
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {[
              ['התחברות', 'כניסה מאובטחת למערכת'],
              ['בחירת מטופל', 'מהרשימה או מלוח הבקרה'],
              ['תיעוד מפגש', 'רשומת SOAP, הקלטה וסיכום AI'],
              ['מעקב ומטרות', 'עדכון התקדמות ותובנות'],
              ['דוחות', 'הפקה וייצוא מסמכים'],
            ].map(([t, d], i) => (
              <div key={t} className="rounded-xl bg-warm-50 p-4 text-center">
                <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-sage-600 text-sm font-bold text-white">
                  {i + 1}
                </div>
                <p className="text-sm font-semibold text-clinical-800">{t}</p>
                <p className="mt-1 text-xs text-clinical-500">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Table of contents */}
      <nav className="mx-auto max-w-5xl px-5 pb-6">
        <div className="flex flex-wrap justify-center gap-2">
          {steps.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="rounded-full border border-clinical-200 bg-white px-3 py-1.5 text-sm text-clinical-600 transition-colors hover:border-sage-300 hover:text-sage-700"
            >
              {s.num}. {s.title}
            </a>
          ))}
        </div>
      </nav>

      {/* Steps */}
      <main className="mx-auto max-w-5xl px-5 pb-8">
        <div className="space-y-8">
          {steps.map((s) => (
            <section
              key={s.id}
              id={s.id}
              className="scroll-mt-24 rounded-2xl border border-clinical-100 bg-white p-6 shadow-soft sm:p-8"
            >
              <div className="mb-5 flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sage-600 text-lg font-bold text-white">
                  {s.num}
                </div>
                <div>
                  <h2
                    className="text-2xl font-bold text-clinical-900"
                    style={{ fontFamily: 'Georgia, serif' }}
                  >
                    {s.title}
                  </h2>
                  <p className="mt-2 leading-relaxed text-clinical-600">{s.lead}</p>
                </div>
              </div>

              <BrowserFrame src={s.image} alt={s.alt} />

              <div className="mt-6">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-sage-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-sage-500" />
                  מה עושים
                </h3>
                <ol className="space-y-2.5">
                  {s.actions.map((a, i) => (
                    <li key={i} className="flex gap-3 leading-relaxed text-clinical-700">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage-100 text-xs font-bold text-sage-700">
                        {i + 1}
                      </span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {s.tip && (
                <div className="mt-5 flex gap-3 rounded-xl border border-warm-200 bg-warm-50 p-4">
                  <svg className="h-5 w-5 shrink-0 text-warm-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm leading-relaxed text-warm-900">
                    <span className="font-semibold">טיפ: </span>
                    {s.tip}
                  </p>
                </div>
              )}
            </section>
          ))}
        </div>
      </main>

      {/* Security note */}
      <section className="mx-auto max-w-5xl px-5 pb-12">
        <div className="rounded-2xl border border-sage-200 bg-sage-50 p-6 sm:p-8">
          <h2 className="flex items-center gap-2 text-xl font-bold text-sage-800">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            פרטיות ואבטחה
          </h2>
          <ul className="mt-4 space-y-2 leading-relaxed text-sage-900">
            <li>• הנתונים הרגישים מוצפנים, וכל גישה למידע רפואי מתועדת ביומן ביקורת.</li>
            <li>• אתם רואים ועורכים אך ורק מטופלים ומפגשים שמשויכים אליכם — ההרשאות נאכפות בשרת.</li>
            <li>• המערכת מנתקת אתכם אוטומטית לאחר 30 דקות של חוסר פעילות, ולכל היותר לאחר 8 שעות.</li>
            <li>• הקליטו מפגשים אך ורק לאחר קבלת הסכמת המטופל.</li>
          </ul>
        </div>
      </section>

      {/* CTA footer */}
      <footer className="border-t border-clinical-100 bg-white">
        <div className="mx-auto max-w-5xl px-5 py-10 text-center">
          <h2 className="text-xl font-bold text-clinical-900" style={{ fontFamily: 'Georgia, serif' }}>
            מוכנים להתחיל?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-clinical-600">
            התחברו למערכת והתחילו לתעד את עבודתכם הטיפולית בצורה חכמה ומאובטחת.
          </p>
          <Link
            href="/login"
            className="mt-5 inline-flex items-center justify-center rounded-lg bg-sage-600 px-6 py-3 font-medium text-white transition-colors hover:bg-sage-700"
          >
            כניסה למערכת
          </Link>
          <p className="mt-6 text-xs text-clinical-400">
            TherapyDocs · מערכת תיעוד קליני תואמת HIPAA
          </p>
        </div>
      </footer>
    </div>
  );
}
