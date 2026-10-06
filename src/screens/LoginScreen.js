import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AuthLink, AuthNotice, AuthShell, getAuthError } from '../components/AuthShell';
import { Button, Field, PasswordField, Segmented, theme, typography } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { OtpInput } from '../components/OtpInput';

// Sign-in with an email code is off for now; the code stays for later. Set to true to
// show the Password / Email code switch again. Password reset and email verification
// still use codes and are not affected.
const OTP_LOGIN_ENABLED = false;

export default function LoginScreen({ navigation, route }) {
  const { login, loginWithOtp, sendOtp } = useAuth();
  const [method, setMethod] = useState('password');
  const [form, setForm] = useState({ identifier: route.params?.identifier || '', email: '', password: '', otp: '' });
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');
  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    if (!cooldown) return undefined;
    const id = setInterval(() => setCooldown((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  async function requestCode() {
    if (!form.email.trim()) return setError('Enter your email address to receive a sign-in code.');
    try {
      setBusy(true); setError('');
      const data = await sendOtp({ email: form.email.trim() });
      setCooldown(data?.resendAfterSeconds || 60);
    } catch (e) { setError(getAuthError(e, 'Could not send the code.')); }
    finally { setBusy(false); }
  }

  async function submit() {
    setError('');
    try {
      setBusy(true);
      if (method === 'password') {
        if (!form.identifier.trim() || !form.password) throw new Error('LOCAL');
        await login({ identifier: form.identifier.trim(), password: form.password });
      } else {
        if (!form.email.trim() || !form.otp.trim()) throw new Error('LOCAL_OTP');
        await loginWithOtp({ email: form.email.trim(), otp: form.otp.trim() });
      }
    } catch (e) {
      if (e.message === 'LOCAL') setError('Enter your email or mobile number and password.');
      else if (e.message === 'LOCAL_OTP') setError('Enter your email and 6-digit code.');
      else setError(getAuthError(e, 'Could not sign in. Check your details and try again.'));
    } finally { setBusy(false); }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to manage your PG, rooms, tenants and rent."
      footer={<Text style={{ ...typography.small, color: theme.muted }}>New to PG Manager? <AuthLink onPress={() => navigation.navigate('Register')}>Create an account</AuthLink></Text>}>
      {route.params?.reset && <AuthNotice tone="success" message="Password updated. Sign in with your new password." />}
      {OTP_LOGIN_ENABLED && <Segmented label="Sign-in method" value={method} onChange={(value) => { setMethod(value); setError(''); }}
        options={[{ label: 'Password', value: 'password' }, { label: 'Email code', value: 'otp' }]} />}
      <AuthNotice message={error} />
      {method === 'password' ? <>
        <Field label="Email or mobile number" placeholder="Enter your email or mobile number" keyboardType="email-address" autoCorrect={false} value={form.identifier} onChangeText={set('identifier')} textContentType="username" autoComplete="username" />
        <PasswordField label="Password" placeholder="Enter your password" value={form.password} onChangeText={set('password')} textContentType="password" autoComplete="password" />
        <View style={styles.forgot}><AuthLink onPress={() => navigation.navigate('ForgotPassword', { email: form.identifier.includes('@') ? form.identifier : '' })}>Forgot password?</AuthLink></View>
      </> : <>
        <Field label="Email" placeholder="Enter your email" value={form.email} onChangeText={set('email')} keyboardType="email-address" textContentType="emailAddress" />
        <Button variant="secondary" onPress={requestCode} loading={busy && !cooldown} disabled={cooldown > 0}>{cooldown ? `Resend in ${cooldown}s` : 'Send sign-in code'}</Button>
        <OtpInput value={form.otp} onChangeText={set('otp')} />
      </>}
      <Button size="lg" onPress={submit} loading={busy} style={styles.submit}>Sign in</Button>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  forgot: { alignItems: 'flex-end', marginTop: -6 },
  submit: { marginTop: 4 },
});
