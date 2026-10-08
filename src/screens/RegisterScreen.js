import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInLeft, FadeInRight, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { AuthLink, AuthNotice, BrandMark, getAuthError } from '../components/AuthShell';
import SignupIllustration from '../components/SignupIllustration';
import { Button, Field, PasswordField, Press, theme, typography, useReducedMotion } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { TRIAL_DAYS } from '../lib/subscriptionPlans';
import { SIGNUP_STEPS, signupErrors, signupPayload } from '../lib/signup';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const focused = useIsFocused();
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const scroll = useRef(null);
  const progress = useSharedValue(0.25);
  const track = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  useEffect(() => { progress.value = withTiming((step + 1) / SIGNUP_STEPS.length, { duration: reduced ? 0 : 440 }); }, [step, reduced, progress]);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  function go(next) {
    if (submitting.current) return;
    Keyboard.dismiss(); setDirection(next > step ? 1 : -1); setErrors({}); setError(''); setStep(next);
    scroll.current?.scrollTo({ y: 0, animated: false });
  }
  function back() { if (submitting.current) return; if (step > 0) go(step - 1); else navigation.goBack(); }
  useEffect(() => {
    if (!focused) return undefined;
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (submitting.current) return true;
      if (step > 0) { go(step - 1); return true; }
      return false;
    });
    return () => listener.remove();
  }, [step, focused]);
  const set = key => value => { setForm(current => ({ ...current, [key]: value })); setErrors(current => ({ ...current, [key]: undefined })); setError(''); };
  async function next() {
    if (submitting.current) return;
    const invalid = signupErrors(step, form);
    setErrors(invalid); setError('');
    if (Object.keys(invalid).length) return;
    if (step < SIGNUP_STEPS.length - 1) return go(step + 1);
    for (let index = 0; index < SIGNUP_STEPS.length; index++) {
      const invalidStep = signupErrors(index, form);
      if (Object.keys(invalidStep).length) { go(index); setErrors(invalidStep); return; }
    }
    submitting.current = true; setBusy(true); Keyboard.dismiss();
    try { await register(signupPayload(form)); }
    catch (e) {
      const fields = e.response?.data?.details?.fieldErrors;
      const index = fields ? SIGNUP_STEPS.findIndex(s => s.fields.some(key => fields[key]?.length)) : -1;
      if (index >= 0) {
        setDirection(index < step ? -1 : 1); setStep(index);
        setErrors(Object.fromEntries(Object.entries(fields).map(([key, messages]) => [key, messages.join('\n')])));
        scroll.current?.scrollTo({ y: 0, animated: false });
      } else setError(getAuthError(e, 'Could not create your account.'));
    } finally { submitting.current = false; setBusy(false); }
  }
  const current = SIGNUP_STEPS[step];
  return <SafeAreaView style={styles.root} edges={['top', 'bottom', 'left', 'right']}>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Press accessibilityRole="button" accessibilityLabel={step ? 'Previous signup step' : 'Back to welcome'} onPress={back} disabled={busy} style={styles.back}><Ionicons name="chevron-back" size={22} color={theme.text} /></Press>
          <View style={styles.brand}><BrandMark size={24} /></View>
          <Text style={styles.step}>{step + 1} / {SIGNUP_STEPS.length}</Text>
        </View>
        <View accessibilityRole="progressbar" accessibilityLabel="Signup progress" accessibilityValue={{ min: 1, max: SIGNUP_STEPS.length, now: step + 1 }} style={styles.track}><Animated.View style={[styles.fill, track]} /></View>
      </View>
      <ScrollView ref={scroll} style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
        <Animated.View key={step} entering={reduced ? undefined : (direction > 0 ? FadeInRight : FadeInLeft).duration(280)} style={styles.stepContent}>
          {focused && !keyboardOpen && <SignupIllustration step={step} icon={current.icon} name={form.name} />}
          <View style={styles.heading}>
            <Text style={styles.eyebrow}>{current.label.toUpperCase()}</Text>
            <Text accessibilityRole="header" style={styles.title}>{current.title}</Text>
            <Text style={styles.subtitle}>{current.subtitle}</Text>
          </View>
          <View style={styles.form}>
            <AuthNotice message={error} />
            {step === 0 && <Field label="Email" placeholder="Enter your email" value={form.email} onChangeText={set('email')} error={errors.email} keyboardType="email-address" textContentType="emailAddress" autoComplete="email" autoCorrect={false} maxLength={254} returnKeyType="next" onSubmitEditing={next} editable={!busy} />}
            {step === 1 && <Field label="Owner name" placeholder="Enter your full name" value={form.name} onChangeText={set('name')} error={errors.name} autoCapitalize="words" textContentType="name" autoComplete="name" maxLength={100} returnKeyType="next" onSubmitEditing={next} editable={!busy} />}
            {step === 2 && <Field label="Mobile number" placeholder="Enter your mobile number" value={form.phone} onChangeText={set('phone')} error={errors.phone} keyboardType="phone-pad" textContentType="telephoneNumber" autoComplete="tel" maxLength={20} returnKeyType="next" onSubmitEditing={next} editable={!busy} />}
            {step === 3 && <>
              <PasswordField label="Password" placeholder="Create a password" value={form.password} onChangeText={set('password')} error={errors.password} textContentType="newPassword" autoComplete="new-password" editable={!busy} />
              <PasswordField label="Confirm password" placeholder="Re-enter your password" value={form.confirmPassword} onChangeText={set('confirmPassword')} error={errors.confirmPassword} textContentType="newPassword" autoComplete="new-password" returnKeyType="done" onSubmitEditing={next} editable={!busy} />
              <Text style={styles.hint}>Use 8+ characters with uppercase, lowercase, number and symbol.</Text>
            </>}
          </View>
        </Animated.View>
      </ScrollView>
      <View style={styles.footer}>
        <Button size="lg" onPress={next} loading={busy}>{step === SIGNUP_STEPS.length - 1 ? 'Create account' : 'Continue'}</Button>
        {!keyboardOpen && <>
          <Text style={styles.hint}>{TRIAL_DAYS}-day free trial · Built for PG owners</Text>
          <Text style={styles.hint}>Already registered? <AuthLink onPress={() => !busy && navigation.navigate('Login')}>Sign in</AuthLink></Text>
        </>}
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
  title: { ...typography.display, color: theme.text }, subtitle: { ...typography.body, color: theme.textSecondary },
  form: { gap: 18 },
  footer: { paddingHorizontal: 24, paddingVertical: 16, gap: 12, maxWidth: 560, width: '100%', alignSelf: 'center' },
  hint: { ...typography.caption, color: theme.textMuted, textAlign: 'center' },
});
