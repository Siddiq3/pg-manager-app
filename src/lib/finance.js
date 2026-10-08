export const STAFF_ROLES = [{ label: 'Cook', value: 'COOK' }, { label: 'Cleaner', value: 'CLEANER' }, { label: 'Helper', value: 'HELPER' }, { label: 'Security', value: 'SECURITY' }, { label: 'Warden', value: 'WARDEN' }, { label: 'Other', value: 'OTHER' }];
export const EXPENSE_CATEGORIES = [{ label: 'Food / Groceries', value: 'FOOD' }, { label: 'Vegetables', value: 'VEGETABLES' }, { label: 'Milk', value: 'MILK' }, { label: 'Gas', value: 'GAS' }, { label: 'Electricity', value: 'ELECTRICITY' }, { label: 'Water', value: 'WATER' }, { label: 'Internet', value: 'INTERNET' }, { label: 'Repairs', value: 'REPAIRS' }, { label: 'Cleaning', value: 'CLEANING' }, { label: 'Other', value: 'OTHER' }];
export const PAYMENT_METHODS = [{ label: 'Cash', value: 'CASH' }, { label: 'UPI', value: 'UPI' }, { label: 'Bank', value: 'BANK_TRANSFER' }, { label: 'Other', value: 'OTHER' }];
export const labelOf = (options, value) => options.find(option => option.value === value)?.label || value;
export function paise(value) {
  const text = String(value).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) throw new Error('Enter an amount with at most two decimal places.');
  const [whole, fraction = ''] = text.split('.');
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(result) || result <= 0 || result > 100000000) throw new Error('Enter an amount between ₹0.01 and ₹10,00,000.');
  return result;
}
export function rupeeInput(value) { return `${Math.trunc(value / 100)}.${String(Math.abs(value % 100)).padStart(2, '0')}`; }
export function moneyPaise(value = 0) {
  return `${value < 0 ? '-' : ''}₹${Math.trunc(Math.abs(value) / 100).toLocaleString('en-IN')}.${String(Math.abs(value % 100)).padStart(2, '0')}`;
}
export const todayIST = () => new Date(Date.now() + 19800000).toISOString().slice(0, 10);
export const currentFinanceMonth = () => todayIST().slice(0, 7);
export function shiftMonth(month, delta) {
  const [year, m] = month.split('-').map(Number);
  return new Date(Date.UTC(year, m - 1 + delta, 1)).toISOString().slice(0, 7);
}
export function paymentDate(day) {
  if (!/^20\d{2}-\d{2}-\d{2}$/.test(day) || Number.isNaN(Date.parse(day)) || new Date(day).toISOString().slice(0, 10) !== day) throw new Error('Enter a valid date as YYYY-MM-DD.');
  return `${day}T00:00:00+05:30`;
}
export function workDays(value) {
  if (!/^\d{1,2}$/.test(String(value).trim()) || Number(value) > 31) throw new Error('Enter whole days worked between 0 and 31.');
  return Number(value);
}
export function submissionId() {
  const bytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
  const hex = bytes.map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
