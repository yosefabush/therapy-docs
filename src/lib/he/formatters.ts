// Hebrew date/time formatting utilities

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatShortDate(date: Date | string): string {
  return new Intl.DateTimeFormat('he-IL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('he-IL', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatWeekdayTime(date: Date | string): string {
  return new Intl.DateTimeFormat('he-IL', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatRelativeDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'היום';
  if (diffDays === 1) return 'אתמול';
  if (diffDays === -1) return 'מחר';
  if (diffDays < 0 && diffDays > -7) return `בעוד ${Math.abs(diffDays)} ימים`;
  if (diffDays > 0 && diffDays < 7) return `לפני ${diffDays} ימים`;

  return formatShortDate(date);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} דק'`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours} ש'`;
  return `${hours} ש' ${mins} דק'`;
}

export function formatMonthYear(date: Date | string): string {
  return new Intl.DateTimeFormat('he-IL', {
    year: 'numeric',
    month: 'long',
  }).format(new Date(date));
}

export function formatDateRange(start: Date | string, end: Date | string): string {
  return `${formatShortDate(start)} - ${formatShortDate(end)}`;
}
