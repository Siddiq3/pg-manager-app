import React, { useState } from 'react';
import { Text } from 'react-native';
import { AuthLink, AuthNotice, AuthShell, getAuthError } from '../components/AuthShell';
import { Button, Field, PasswordField, theme, typography } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  async function submit() {
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.password) return setError('Complete all fields to create your account.');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    try {
      setBusy(true);
      await register({ ...form, name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() });
    } catch (e) {
      setError(getAuthError(e, 'Could not create your account.'));
    } finally { setBusy(false); }
  }

  return (
    <AuthShell title="Create your account" subtitle="Set up your owner account. You can add and manage PG details after signing in."
      footer={<Text style={{ ...typography.small, color: theme.muted }}>Already registered? <AuthLink onPress={() => navigation.navigate('Login')}>Sign in</AuthLink></Text>}>
      <AuthNotice message={error} />
      <Field label="Owner name" value={form.name} onChangeText={set('name')} autoCapitalize="words" textContentType="name" />
      <Field label="Email" value={form.email} onChangeText={set('email')} keyboardType="email-address" textContentType="emailAddress" />
      <Field label="Mobile number" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" textContentType="telephoneNumber" />
      <PasswordField label="Password" value={form.password} onChangeText={set('password')} textContentType="newPassword" />
      <PasswordField label="Confirm password" value={form.confirmPassword} onChangeText={set('confirmPassword')} textContentType="newPassword" />
      <Text style={{ ...typography.caption, color: theme.muted }}>Use 8+ characters with uppercase, lowercase, number and symbol.</Text>
      <Button size="lg" onPress={submit} loading={busy}>Create account</Button>
    </AuthShell>
  );
}
