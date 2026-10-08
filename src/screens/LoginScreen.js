import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInLeft, FadeInRight, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { AuthLink, AuthNotice, BrandMark, getAuthError } from '../components/AuthShell';
import SignupIllustration from '../components/SignupIllustration';
import { Button, Field, PasswordField, Press, Segmented, theme, typography, useReducedMotion } from '../components/ui';
import { OtpInput } from '../components/OtpInput';
import { useAuth } from '../context/AuthContext';
import { SIGNIN_STEPS, signinErrors, signinPayload } from '../lib/signin';

// Keep email-code sign-in available for later without enabling it today.
// Password reset and email verification continue to use their existing OTP flows.
const OTP_LOGIN_ENABLED = false;

export default function LoginScreen({ navigation, route }) {
  const { login, loginWithOtp, sendOtp } = useAuth();
  const focused = useIsFocused();
  const reduced = useReducedMotion();
  const [method, setMethod] = useState('password');
  const [step, setStep] = useState(route.params?.identifier ? 1 : 0);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState({ identifier: route.params?.identifier || '', email: '', password: '', otp: '' });
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const scroll = useRef(null);
  const progress = useSharedValue(route.params?.identifier ? 1 : 0.5);
  const track = useAnimatedStyle(() => ({ width: (progress.value * 100) + '%' }));

  useEffect(() => {
    progress.value = withTiming(method === 'otp' ? 1 : (step + 1) / SIGNIN_STEPS.length, { duration: reduced ? 0 : 440 });
  }, [step, method, reduced, progress]);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    if (!cooldown) return undefined;
    const id = setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  function go(next) {
    if (busy || submitting.current) return;
    Keyboard.dismiss();
    setDirection(next > step ? 1 : -1);
    setErrors({});
    setError('');
    setStep(next);
    scroll.current?.scrollTo({ y: 0, animated: false });
  }

  function back() {
    if (busy || submitting.current) return;
    if (method === 'password' && step > 0) go(step - 1);
    else navigation.goBack();
  }

  useEffect(() => {
    if (!focused) return undefined;
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (busy || submitting.current) return true;
      if (method === 'password' && step > 0) { go(step - 1); return true; }
      return false;
    });
    return () => listener.remove();
  }, [step, method, focused, busy]);

  const set = (key) => (value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setError('');
  };

  function next() {
    if (busy || submitting.current) return;
    const invalid = signinErrors(0, form);
    setErrors(invalid);
    setError('');
    if (Object.keys(invalid).length) return;
    go(1);
  }

  async function requestCode() {
    if (busy || submitting.current) return;
    if (!form.email.trim()) return setError('Enter your email address to receive a sign-in code.');
    try {
      setBusy(true); setError('');
      const data = await sendOtp({ email: form.email.trim() });
      setCooldown(data?.resendAfterSeconds || 60);
    } catch (e) {
      setError(getAuthError(e, 'Could not send the code.'));
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (busy || submitting.current) return;
    if (method === 'password') {
      for (let index = 0; index < SIGNIN_STEPS.length; index++) {
        const invalid = signinErrors(index, form);
        if (Object.keys(invalid).length) {
          if (index !== step) go(index);
          setErrors(invalid);
          return;
        }
      }
    } else if (!form.email.trim() || !form.otp.trim()) {
      setError('Enter your email and 6-digit code.');
      return;
    }

    submitting.current = true;
    setBusy(true);
    setError('');
    Keyboard.dismiss();
    try {
      if (method === 'password') await login(signinPayload(form));
      else await loginWithOtp({ email: form.email.trim(), otp: form.otp.trim() });
    } catch (e) {
      setError(getAuthError(e, 'Could not sign in. Check your details and try again.'));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  const otpMode = method === 'otp';
  const current = otpMode
    ? { label: 'Email code', title: 'Sign in with a code', subtitle: 'Enter your email to receive a one-time sign-in code.', icon: 'mail-outline' }
    : SIGNIN_STEPS[step];
  const totalSteps = otpMode ? 1 : SIGNIN_STEPS.length;
  const currentStep = otpMode ? 1 : step + 1;

  return <SafeAreaView style={styles.root} edges={['top', 'bottom', 'left', 'right']}>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Press accessibilityRole="button" accessibilityLabel={step > 0 && !otpMode ? 'Previous sign-in step' : 'Back to welcome'} onPress={back} disabled={busy} style={styles.back}>
            <Ionicons name="chevron-back" size={22} color={theme.text} />
          </Press>
          <View style={styles.brand}><BrandMark size={24} /></View>
          <Text style={styles.step}>{currentStep} / {totalSteps}</Text>
        </View>
        <View accessibilityRole="progressbar" accessibilityLabel="Sign-in progress"
          accessibilityValue={{ min: 1, max: totalSteps, now: currentStep }} style={styles.track}>
          <Animated.View style={[styles.fill, track]} />
        </View>
      </View>

      <ScrollView ref={scroll} style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
        <Animated.View key={method + '-' + step} entering={reduced ? undefined : (direction > 0 ? FadeInRight : FadeInLeft).duration(280)} style={styles.stepContent}>
          {focused && !keyboardOpen && <SignupIllustration step={otpMode ? 0 : step === 0 ? 0 : 3} icon={current.icon} name="" />}
          <View style={styles.heading}>
            <Text style={styles.eyebrow}>{current.label.toUpperCase()}</Text>
            <Text accessibilityRole="header" style={styles.title}>{current.title}</Text>
            <Text style={styles.subtitle}>{current.subtitle}</Text>
          </View>
          <View style={styles.form}>
            {route.params?.reset && <AuthNotice tone="success" message="Password updated. Sign in with your new password." />}
            {OTP_LOGIN_ENABLED && <Segmented label="Sign-in method" value={method}
              onChange={(value) => { Keyboard.dismiss(); setMethod(value); setDirection(1); setStep(0); setError(''); setErrors({}); }}
              options={[{ label: 'Password', value: 'password' }, { label: 'Email code', value: 'otp' }]} />}
            <AuthNotice message={error} />
            {otpMode ? <>
              <Field label="Email" placeholder="Enter your email" value={form.email} onChangeText={set('email')}
                keyboardType="email-address" autoCapitalize="none" autoCorrect={false} textContentType="emailAddress" editable={!busy} />
              <Button variant="secondary" onPress={requestCode} loading={busy && !cooldown} disabled={busy || cooldown > 0}>
                {cooldown ? 'Resend in ' + cooldown + 's' : 'Send sign-in code'}
              </Button>
              <OtpInput value={form.otp} onChangeText={set('otp')} />
            </> : step === 0 ? (
              <Field label="Email or mobile number" placeholder="Enter your email or mobile number"
                keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                value={form.identifier} onChangeText={set('identifier')} error={errors.identifier}
                textContentType="username" autoComplete="username" returnKeyType="next" onSubmitEditing={next} editable={!busy} />
            ) : <>
              <View style={styles.accountRow}>
                <View style={styles.accountIcon}><Ionicons name="person-outline" size={20} color={theme.primaryText} /></View>
                <Text style={styles.accountText} numberOfLines={1}>{form.identifier.trim()}</Text>
                <AuthLink onPress={() => !busy && go(0)}>Edit</AuthLink>
              </View>
              <PasswordField label="Password" placeholder="Enter your password" value={form.password}
                onChangeText={set('password')} error={errors.password} textContentType="password" autoComplete="password"
                returnKeyType="done" onSubmitEditing={submit} editable={!busy} />
              <View style={styles.forgot}>
                <AuthLink onPress={() => !busy && navigation.navigate('ForgotPassword', { email: form.identifier.includes('@') ? form.identifier.trim() : '' })}>
                  Forgot password?
                </AuthLink>
              </View>
            </>}
          </View>
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <Button size="lg" onPress={!otpMode && step === 0 ? next : submit} loading={busy}>
          {!otpMode && step === 0 ? 'Continue' : 'Sign in'}
        </Button>
        {!keyboardOpen && <Text style={styles.hint}>New to PG Manager? <AuthLink onPress={() => !busy && navigation.navigate('Register')}>Create an account</AuthLink></Text>}
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg }, flex: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, gap: 18 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
  brand: { flex: 1 }, step: { ...typography.caption, color: theme.textMuted },
  track: { height: 5, borderRadius: 3, overflow: 'hidden', backgroundColor: theme.primaryTint },
  fill: { height: '100%', borderRadius: 3, backgroundColor: theme.primary },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 20, maxWidth: 560, width: '100%', alignSelf: 'center' },
  stepContent: { gap: 24 }, heading: { gap: 10 },
  eyebrow: { ...typography.overline, color: theme.primaryText },
  title: { ...typography.display, color: theme.text },
  subtitle: { ...typography.body, color: theme.textSecondary },
  form: { gap: 18 },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 18, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, padding: 10 },
  accountIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: theme.primarySubtle, justifyContent: 'center', alignItems: 'center' },
  accountText: { ...typography.small, color: theme.text, flex: 1 },
  forgot: { alignItems: 'flex-end', marginTop: -6 },
  footer: { paddingHorizontal: 24, paddingVertical: 16, gap: 12, maxWidth: 560, width: '100%', alignSelf: 'center' },
  hint: { ...typography.caption, color: theme.textMuted, textAlign: 'center' },
});
