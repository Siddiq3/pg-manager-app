export const SIGNIN_STEPS = [
  { label: 'Your account', title: 'Welcome back', subtitle: 'Enter the email or mobile number linked to your PG.', icon: 'mail-outline' },
  { label: 'Password', title: 'Secure sign in', subtitle: 'Enter your password to open your PG dashboard.', icon: 'lock-closed-outline' },
];

export function signinErrors(step, form) {
  const errors = {};
  if (step === 0 && !form.identifier.trim()) errors.identifier = 'Enter your email or mobile number.';
  if (step === 1 && !form.password) errors.password = 'Enter your password.';
  return errors;
}

export function signinPayload(form) {
  return { identifier: form.identifier.trim(), password: form.password };
}
