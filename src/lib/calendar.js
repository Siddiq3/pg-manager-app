export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Date-only values stay strings: converting local midnight to ISO can shift the day.
export function validDay(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function calendarDays(month) {
  const [year, number] = month.split('-').map(Number);
  const start = new Date(Date.UTC(year, number - 1, 1)).getUTCDay();
  const count = new Date(Date.UTC(year, number, 0)).getUTCDate();
  return Array.from({ length: Math.ceil((start + count) / 7) * 7 }, (_, i) =>
    i < start || i >= start + count ? null : `${month}-${String(i - start + 1).padStart(2, '0')}`);
}
export function dateLabel(value, monthOnly = false) {
  const [year, month, day] = String(value || '').split('-').map(Number);
  if (!year || !MONTH_NAMES[month - 1]) return '';
  return monthOnly ? `${MONTH_NAMES[month - 1]} ${year}` : `${day} ${MONTH_NAMES[month - 1]} ${year}`;
}
