import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { AuthLink, AuthNotice, AuthShell, getAuthError } from '../components/AuthShell';
import { Button, Field, PasswordField, theme, typography } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { OtpInput } from '../components/OtpInput';

export default function ForgotPasswordScreen({ navigation, route }) {
  const { forgotPassword, resetPassword } = useAuth();
  const [form, setForm] = useState({ email: route.params?.email || '', otp: '', newPassword: '', confirmPassword: '' });
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    if (!cooldown) return undefined;
    const id = setInterval(() => setCooldown((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  async function sendCode() {
    if (!form.email.trim()) return setError('Enter your email address.');
    try {
      setBusy(true); setError('');
      const data = await forgotPassword({ email: form.email.trim() });
      setSent(true); setCooldown(data?.resendAfterSeconds || 60);
      setMessage(data?.message || 'If an account exists, a reset code has been sent.');
    } catch (e) { setError(getAuthError(e, 'Could not send the reset code.')); }
    finally { setBusy(false); }
  }

  async function reset() {
    if (!form.otp.trim() || !form.newPassword) return setError('Enter the code and your new password.');
    if (form.newPassword !== form.confirmPassword) return setError('Passwords do not match.');
    try {
      setBusy(true); setError('');
      await resetPassword({ email: form.email.trim(), otp: form.otp.trim(), newPassword: form.newPassword, confirmPassword: form.confirmPassword });
      navigation.replace('Login', { identifier: form.email.trim(), reset: true });
    } catch (e) { setError(getAuthError(e, 'Could not reset your password.')); }
    finally { setBusy(false); }
  }

  return (
    <AuthShell title="Reset your password" subtitle="We’ll send a 6-digit code to your account email."
      footer={<Text style={{ ...typography.small, color: theme.muted }}><AuthLink onPress={() => navigation.navigate('Login')}>Back to sign in</AuthLink></Text>}>
      <AuthNotice message={error} />
      <AuthNotice message={message} tone="success" />
      <Field label="Email" value={form.email} onChangeText={set('email')} keyboardType="email-address" textContentType="emailAddress" />
      <Button variant="secondary" onPress={sendCode} loading={busy && !sent} disabled={cooldown > 0}>{cooldown ? `Resend in ${cooldown}s` : sent ? 'Resend code' : 'Send reset code'}</Button>
      {sent && <>
        <OtpInput value={form.otp} onChangeText={set('otp')} />
        <PasswordField label="New password" value={form.newPassword} onChangeText={set('newPassword')} textContentType="newPassword" />
        <PasswordField label="Confirm new password" value={form.confirmPassword} onChangeText={set('confirmPassword')} textContentType="newPassword" />
        <Button onPress={reset} loading={busy} style={{ minHeight: 54, borderRadius: 14 }}>Update password</Button>
      </>}
    </AuthShell>
  );
}
