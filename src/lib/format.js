const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export const money = (value) => inr.format(Number(value) || 0);

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
