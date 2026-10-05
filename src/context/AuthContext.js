import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL, buildApi } from '../api/client';

const REFRESH_KEY = 'pg_manager_refresh_token';
// The property the owner last worked on, so the app reopens where they left it.
const PROPERTY_KEY = 'pg_manager_active_property';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const accessTokenRef = useRef('');
  const [accessToken, setAccessToken] = useState('');
  const [user, setUser] = useState(null);
  const [restoring, setRestoring] = useState(true);
  const [activePropertyId, setActivePropertyIdState] = useState('');
  const setActivePropertyId = useCallback((id) => {
    setActivePropertyIdState(id || '');
    (id ? AsyncStorage.setItem(PROPERTY_KEY, id) : AsyncStorage.removeItem(PROPERTY_KEY)).catch(() => null);
  }, []);
  const [entitlement, setEntitlement] = useState(null);
  const [entitlementState, setEntitlementState] = useState('idle');
  const [entitlementError, setEntitlementError] = useState('');

  const setSession = useCallback(async (data) => {
    const nextAccessToken = data.accessToken || '';
    accessTokenRef.current = nextAccessToken;
    setAccessToken(nextAccessToken);
    if (data.user) setUser(data.user);
    if (data.refreshToken) await SecureStore.setItemAsync(REFRESH_KEY, data.refreshToken);
  }, []);

  function updateUser(nextUser) { setUser(nextUser); }

  const clearSession = useCallback(async () => {
    accessTokenRef.current = '';
    setAccessToken('');
    setUser(null);
    setEntitlement(null);
    setEntitlementState('idle');
    setEntitlementError('');
    setActivePropertyId('');
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  }, [setActivePropertyId]);

  useEffect(() => {
    (async () => {
      try {
        const savedProperty = await AsyncStorage.getItem(PROPERTY_KEY).catch(() => null);
        if (savedProperty) setActivePropertyIdState(savedProperty);
        const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
        if (refreshToken) {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          await setSession(data);
        }
      } catch {
        await clearSession().catch(() => null);
      } finally {
        setRestoring(false);
      }
    })();
  }, [clearSession, setSession]);

  const api = useMemo(
    () => buildApi({
      getAccessToken: () => accessTokenRef.current,
      setSession,
      getRefreshToken: () => SecureStore.getItemAsync(REFRESH_KEY),
      clearSession,
    }),
    [clearSession, setSession]
  );

  async function login({ identifier, password }) { const { data } = await axios.post(`${API_URL}/auth/login`, { identifier, password }); await setSession(data); }
  async function loginWithOtp({ email, otp }) { const { data } = await axios.post(`${API_URL}/auth/login-otp`, { email, otp }); await setSession(data); }
  async function sendOtp({ email }) { const { data } = await axios.post(`${API_URL}/auth/send-otp`, { email }); return data; }
  async function register({ name, email, phone, password, confirmPassword }) { const { data } = await axios.post(`${API_URL}/auth/register`, { name, email, phone, password, confirmPassword }); await setSession(data); }
  async function forgotPassword({ email }) { const { data } = await axios.post(`${API_URL}/auth/forgot-password`, { email }); return data; }
  async function resetPassword({ email, otp, newPassword, confirmPassword }) { const { data } = await axios.post(`${API_URL}/auth/reset-password`, { email, otp, newPassword, confirmPassword }); return data; }

  async function refreshEntitlement({ background = false } = {}) {
    if (!accessTokenRef.current) return null;
    if (!background) setEntitlementState('loading');
    setEntitlementError('');
    try {
      const { data } = await api.get('/billing/status');
      setEntitlement(data.entitlement);
      setEntitlementState('ready');
      return data.entitlement;
    } catch (error) {
      setEntitlement(null);
      setEntitlementState('error');
      setEntitlementError(error?.uiMessage || error?.response?.data?.message || 'Unable to verify your subscription right now.');
      throw error;
    }
  }

  const authenticated = Boolean(accessToken);
  useEffect(() => {
    if (authenticated) refreshEntitlement().catch(() => null);
    else {
      setEntitlement(null);
      setEntitlementState('idle');
      setEntitlementError('');
    }
  }, [authenticated]);

  async function logout() {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
    await api.post('/auth/logout', { refreshToken }).catch(() => null);
    await clearSession();
  }

  return <AuthContext.Provider value={{ accessToken, activePropertyId, setActivePropertyId, api, clearSession, entitlement, entitlementError, entitlementLoading: entitlementState === 'loading', entitlementState, refreshEntitlement, forgotPassword, login, loginWithOtp, logout, register, resetPassword, restoring, sendOtp, user, updateUser }}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
