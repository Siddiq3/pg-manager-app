import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { Button, Field, Screen, theme } from '../components/ui';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  name: '',
  identifier: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  otp: '',
  newPassword: '',
};

/** Prefers the API's field-level validation messages over the generic one. */
function errorMessage(error, fallback) {
  const data = error.response?.data;
  const fieldErrors = data?.details?.fieldErrors;
  if (fieldErrors) {
    const messages = Object.values(fieldErrors).flat().filter(Boolean);
    if (messages.length) return messages.join('\n');
  }
  return data?.message || fallback;
}

export default function LoginScreen() {
  const { forgotPassword, login, loginWithOtp, register, resetPassword, sendOtp } = useAuth();
  // 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState('login');
  // 'password' | 'otp'
  const [loginMethod, setLoginMethod] = useState('password');
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const set = (field) => (value) => setForm({ ...form, [field]: value });

  function switchMode(nextMode) {
    setMode(nextMode);
    setForm({ ...emptyForm, email: form.email, identifier: form.identifier });
  }

  async function requestCode(purpose) {
    const email = (purpose === 'reset' ? form.email : form.email || form.identifier).trim();
    if (!email) {
      Alert.alert('Email needed', 'Enter your email address to receive the code.');
      return;
    }

    try {
      setBusy(true);
      const data = purpose === 'reset' ? await forgotPassword({ email }) : await sendOtp({ email });
      setCooldown(data?.resendAfterSeconds || 60);
      Alert.alert('Check your email', data?.message || 'If an account exists for this email, a code has been sent.');
    } catch (error) {
      Alert.alert('Could not send the code', errorMessage(error, 'Please try again in a moment.'));
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    try {
      setBusy(true);

      if (mode === 'register') {
        await register({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
          confirmPassword: form.confirmPassword,
        });
        return;
      }

      if (mode === 'forgot') {
        await resetPassword({
          email: form.email.trim(),
          otp: form.otp.trim(),
          newPassword: form.newPassword,
          confirmPassword: form.confirmPassword,
        });
        setMode('login');
        setLoginMethod('password');
        setForm({ ...emptyForm, identifier: form.email.trim() });
        Alert.alert('Password updated', 'Sign in with your new password.');
        return;
      }

      if (loginMethod === 'password') {
        await login({ identifier: form.identifier.trim(), password: form.password });
      } else {
        await loginWithOtp({ email: form.email.trim(), otp: form.otp.trim() });
      }
    } catch (error) {
      const title = mode === 'register' ? 'Could not create the account' : 'Could not sign in';
      Alert.alert(title, errorMessage(error, 'Please check the details and try again.'));
    } finally {
      setBusy(false);
    }
  }

  const codeLabel = cooldown > 0 ? `Resend in ${cooldown}s` : 'Send code to email';
  const submitLabel = { login: 'Login', register: 'Create account', forgot: 'Set new password' }[mode];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <Screen scroll>
        <Text style={{ fontSize: 34, fontWeight: '900', color: theme.text }}>PG Manager</Text>
        <Text style={{ color: theme.muted, marginBottom: 12 }}>Run your PG from the phone in your hand.</Text>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button variant={mode === 'login' ? 'primary' : 'ghost'} onPress={() => switchMode('login')}>
            Login
          </Button>
          <Button variant={mode === 'register' ? 'primary' : 'ghost'} onPress={() => switchMode('register')}>
            Register
          </Button>
        </View>

        {mode === 'register' && (
          <>
            <Field label="Owner name" value={form.name} onChangeText={set('name')} />
            <Field label="Email" value={form.email} onChangeText={set('email')} keyboardType="email-address" />
            <Field label="Mobile number" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
            <Field label="Password" value={form.password} onChangeText={set('password')} secureTextEntry />
            <Field
              label="Confirm password"
              value={form.confirmPassword}
              onChangeText={set('confirmPassword')}
              secureTextEntry
            />
            <Text style={{ color: theme.muted, fontSize: 12 }}>
              At least 8 characters with an uppercase letter, a lowercase letter, a number and a symbol.
            </Text>
          </>
        )}

        {mode === 'login' && (
          <>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button variant={loginMethod === 'password' ? 'primary' : 'ghost'} onPress={() => setLoginMethod('password')}>
                Password
              </Button>
              <Button variant={loginMethod === 'otp' ? 'primary' : 'ghost'} onPress={() => setLoginMethod('otp')}>
                Email OTP
              </Button>
            </View>

            {loginMethod === 'password' ? (
              <>
                <Field label="Email or mobile number" value={form.identifier} onChangeText={set('identifier')} />
                <Field label="Password" value={form.password} onChangeText={set('password')} secureTextEntry />
                <Button variant="ghost" onPress={() => switchMode('forgot')}>
                  Forgot password?
                </Button>
              </>
            ) : (
              <>
                <Field label="Email" value={form.email} onChangeText={set('email')} keyboardType="email-address" />
                <Button onPress={() => requestCode('login')} disabled={busy || cooldown > 0}>
                  {codeLabel}
                </Button>
                <Field label="6-digit code" value={form.otp} onChangeText={set('otp')} keyboardType="number-pad" />
              </>
            )}
          </>
        )}

        {mode === 'forgot' && (
          <>
            <Field label="Email" value={form.email} onChangeText={set('email')} keyboardType="email-address" />
            <Button onPress={() => requestCode('reset')} disabled={busy || cooldown > 0}>
              {codeLabel}
            </Button>
            <Field label="6-digit code" value={form.otp} onChangeText={set('otp')} keyboardType="number-pad" />
            <Field label="New password" value={form.newPassword} onChangeText={set('newPassword')} secureTextEntry />
            <Field
              label="Confirm new password"
              value={form.confirmPassword}
              onChangeText={set('confirmPassword')}
              secureTextEntry
            />
            <Button variant="ghost" onPress={() => switchMode('login')}>
              Back to login
            </Button>
          </>
        )}

        <Button onPress={submit} disabled={busy}>
          {busy ? 'Please wait...' : submitLabel}
        </Button>
      </Screen>
    </KeyboardAvoidingView>
  );
}
