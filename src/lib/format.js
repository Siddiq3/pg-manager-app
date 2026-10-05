const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export const money = (value) => inr.format(Number(value) || 0);

/** '2026-10' → 'Oct 2026'. Anything else is returned as-is. */
export function monthLabel(month) {
  const [y, m] = String(month || '').split('-').map(Number);
  if (!y || !m) return month || '';
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

/** Field-level API messages first: they say exactly which input is wrong. */
export function errorMessage(error, fallback = 'Please try again.') {
  if (error?.code === 'ERR_NETWORK') return 'Cannot reach the server. Check your connection.';
  const data = error?.response?.data;
  const fieldErrors = data?.details?.fieldErrors;
  if (fieldErrors) {
    const messages = Object.values(fieldErrors).flat().filter(Boolean);
    if (messages.length) return messages.join('\n');
  }
  return data?.message || fallback;
}
