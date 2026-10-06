import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { Urbanist_600SemiBold, Urbanist_700Bold } from '@expo-google-fonts/urbanist';
import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/components/ui';
import { ToastProvider } from './src/components/Toast';
import ErrorBoundary from './src/components/ErrorBoundary';
import StartupScreen from './src/components/StartupScreen';

const navigationTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, primary: theme.primary, background: theme.background, card: theme.surface, text: theme.textPrimary, border: theme.border, notification: theme.error },
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // A 401 is handled by the auth interceptor; retrying it just delays the error.
      retry: (failureCount, error) => error?.response?.status !== 401 && failureCount < 2,
    },
  },
});

export default function App() {
  // Gate the first render on fonts so nothing paints in a fallback face and then reflows.
  // A branded loading screen fills the font-loading interval. Font errors still allow rendering.
  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
    Urbanist_600SemiBold, Urbanist_700Bold,
    PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold,
  });
  if (!fontsLoaded && !fontError) return <StartupScreen />;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <ToastProvider>
            <AuthProvider>
              <NavigationContainer theme={navigationTheme}>
                <StatusBar style="dark" />
                <AppNavigator />
              </NavigationContainer>
            </AuthProvider>
          </ToastProvider>
        </ErrorBoundary>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
