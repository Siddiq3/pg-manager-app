export const ROOM_TYPES = Array.from({ length: 10 }, (_, i) => ({ label: `${i + 1} sharing`, value: `${i + 1} sharing` }));

export function floorLabel(value) {
  if (value === '' || value == null) return '';
  if (String(value) === '0' || value === 'Ground') return 'Ground floor';
  if (!/^\d+$/.test(String(value))) return String(value);
  const number = Number(value);
  const suffix = number % 100 >= 11 && number % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[number % 10] || 'th');
  return `${number}${suffix} floor`;
}
export const FLOORS = [{ label: 'Basement', value: 'Basement' }, { label: 'Ground floor', value: '0' }, ...Array.from({ length: 20 }, (_, i) => ({ label: floorLabel(String(i + 1)), value: String(i + 1) }))];
