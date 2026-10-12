import { billLabel } from './format';

export function whatsappNumber(value) {
  const text = String(value || '').trim();
  if (!text || !/^\+?[\d\s().-]+$/.test(text)) throw new Error('Add a valid mobile number in this tenant’s details first.');
  let digits = text.replace(/\D/g, '');
  const international = text.startsWith('+') || digits.startsWith('00');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (!international && digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  if (!international && /^[6-9]\d{9}$/.test(digits)) digits = `91${digits}`;
  if (!(international ? /^[1-9]\d{7,14}$/ : /^[1-9]\d{10,14}$/).test(digits)) throw new Error('Add a valid mobile number with its country code in this tenant’s details.');
  return digits;
}

export function rentReminder(cycle, tenant, propertyName) {
  const outstanding = Number(cycle.amountDue) - Number(cycle.amountPaid);
  if (!Number.isFinite(outstanding) || outstanding <= 0) throw new Error('This bill has no payment due.');
  const phone = whatsappNumber(tenant?.phone);
  const amount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(outstanding);
  const due = new Date(cycle.dueDate);
  const dueLabel = Number.isNaN(due.getTime()) ? '' : due.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
  const message = [
    `Hi ${tenant?.name || 'there'},`,
    `This is a rent payment reminder${propertyName ? ` from ${propertyName}` : ''}.`,
    `Bill: ${billLabel(cycle)}`,
    `Amount pending: ${amount}`,
    dueLabel && `Due date: ${dueLabel}`,
    'Please make the payment and let us know once paid. Thank you.',
  ].filter(Boolean).join('\n');
  return { phone, message, url: `https://wa.me/${phone}?text=${encodeURIComponent(message)}` };
}
