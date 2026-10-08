export const SIGNUP_STEPS = [
  { title: 'Start with your email', subtitle: 'Your PG journey begins here.', label: 'Email', icon: 'mail-outline', fields: ['email'] },
  { title: 'What should we call you?', subtitle: 'Let’s set up your owner profile.', label: 'Your name', icon: 'person-outline', fields: ['name'] },
  { title: 'Your mobile number', subtitle: 'Use a number you can sign in with.', label: 'Mobile', icon: 'call-outline', fields: ['phone'] },
  { title: 'Make it yours. Keep it safe.', subtitle: 'Create a password for your account.', label: 'Password', icon: 'shield-checkmark-outline', fields: ['password', 'confirmPassword'] },
];

export function signupErrors(step, form) {
  const errors = {};
  if (step === 0 && (form.email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))) errors.email = 'Enter a valid email address.';
  if (step === 1 && (form.name.trim().length < 2 || form.name.trim().length > 100 || !/^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u.test(form.name.trim()))) errors.name = 'Enter your full name using letters.';
  if (step === 2) {
    const phone = form.phone.trim().replace(/[\s().-]/g, '');
    if (!/^(?:[6-9]\d{9}|0[6-9]\d{9}|91[6-9]\d{9}|\+[1-9]\d{7,14}|00[1-9]\d{7,14})$/.test(phone)) errors.phone = 'Enter a valid mobile number.';
  }
  if (step === 3) {
    const bytes = [...form.password].reduce((sum, c) => sum + (c.codePointAt(0) <= 0x7f ? 1 : c.codePointAt(0) <= 0x7ff ? 2 : c.codePointAt(0) <= 0xffff ? 3 : 4), 0);
    if (form.password.length < 8 || !/[a-z]/.test(form.password) || !/[A-Z]/.test(form.password) || !/\d/.test(form.password) || !/[^A-Za-z0-9]/.test(form.password)) errors.password = 'Use 8+ characters with uppercase, lowercase, number and symbol.';
    else if (bytes > 72) errors.password = 'Use a shorter password (up to 72 bytes).';
    if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match.';
  }
  return errors;
}

export function signupPayload(form) {
  return { ...form, name: form.name.trim(), email: form.email.trim().toLowerCase(), phone: form.phone.trim() };
}
