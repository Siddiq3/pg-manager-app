import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthLink, AuthNotice, AuthShell, getAuthError } from '../components/AuthShell';
import { Button, Field, theme, typography } from '../components/ui';
import { useAuth } from '../context/AuthContext';

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
      <View style={styles.switcher}>
        {['password', 'otp'].map((value) => (
          <Pressable key={value} onPress={() => { setMethod(value); setError(''); }} style={[styles.switch, method === value && styles.switchActive]}>
            <Text style={[styles.switchText, method === value && styles.switchTextActive]}>{value === 'password' ? 'Password' : 'Email OTP'}</Text>
          </Pressable>
        ))}
      </View>
      <AuthNotice message={error} />
      {method === 'password' ? <>
        <Field label="Email or mobile number" value={form.identifier} onChangeText={set('identifier')} textContentType="username" autoComplete="username" />
        <Field label="Password" value={form.password} onChangeText={set('password')} secureTextEntry textContentType="password" autoComplete="password" />
        <View style={styles.forgot}><AuthLink onPress={() => navigation.navigate('ForgotPassword', { email: form.identifier.includes('@') ? form.identifier : '' })}>Forgot password?</AuthLink></View>
      </> : <>
        <Field label="Email" value={form.email} onChangeText={set('email')} keyboardType="email-address" textContentType="emailAddress" />
        <Button variant="secondary" onPress={requestCode} loading={busy && !cooldown} disabled={cooldown > 0}>{cooldown ? `Resend in ${cooldown}s` : 'Send sign-in code'}</Button>
        <Field label="6-digit code" value={form.otp} onChangeText={set('otp')} keyboardType="number-pad" maxLength={6} />
      </>}
      <Button onPress={submit} loading={busy} style={styles.submit}>Sign in</Button>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  switcher: { flexDirection: 'row', padding: 4, borderRadius: 12, backgroundColor: theme.surfaceMuted },
  switch: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
  switchActive: { backgroundColor: theme.surface },
  switchText: { ...typography.small, color: theme.muted, fontWeight: '600' },
  switchTextActive: { color: theme.brand },
  forgot: { alignItems: 'flex-end', marginTop: -4 },
  submit: { minHeight: 54, borderRadius: 14, marginTop: 4 },
});
