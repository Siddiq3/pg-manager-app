import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { API_URL, buildApi } from '../api/client';

const REFRESH_KEY = 'pg_manager_refresh_token';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const accessTokenRef = useRef('');
  const [accessToken, setAccessToken] = useState('');
  const [user, setUser] = useState(null);
  const [restoring, setRestoring] = useState(true);
  const [restoreError, setRestoreError] = useState('');
  const restoreInFlight = useRef(null);
  const [activePropertyId, setActivePropertyId] = useState('');
  const [entitlement, setEntitlement] = useState(null);
  const [entitlementState, setEntitlementState] = useState('idle');
  const [entitlementError, setEntitlementError] = useState('');

  const setSession = useCallback(async (data) => {
    // Persist the rotated credential before exposing the authenticated state.
    if (data.refreshToken) await SecureStore.setItemAsync(REFRESH_KEY, data.refreshToken);
    const nextAccessToken = data.accessToken || '';
    accessTokenRef.current = nextAccessToken;
    setAccessToken(nextAccessToken);
    if (data.user) setUser(data.user);
  }, []);

  function updateUser(nextUser) { setUser(nextUser); }

  const clearSession = useCallback(async () => {
    accessTokenRef.current = '';
    setAccessToken('');
    setUser(null);
    setEntitlement(null);
    setEntitlementState('idle');
    setEntitlementError('');
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  }, []);

  const restoreSession = useCallback(() => {
    if (restoreInFlight.current) return restoreInFlight.current;
    setRestoring(true);
    setRestoreError('');
    restoreInFlight.current = (async () => {
      try {
        const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
        if (refreshToken) {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken }, { timeout: 20_000 });
          if (!data?.accessToken || !data?.refreshToken) throw new Error('Invalid session response');
          await setSession(data);
        }
      } catch (error) {
        if (error.response?.status === 401) await clearSession().catch(() => null);
        else setRestoreError('Unable to restore your session. Check your connection and try again.');
      } finally {
        setRestoring(false);
        restoreInFlight.current = null;
      }
    })();
    return restoreInFlight.current;
  }, [clearSession, setSession]);

  useEffect(() => { restoreSession(); }, [restoreSession]);

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

  async function refreshEntitlement() {
    if (!accessTokenRef.current) return null;
    setEntitlementState('loading');
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

  return <AuthContext.Provider value={{ accessToken, activePropertyId, setActivePropertyId, api, clearSession, entitlement, entitlementError, entitlementLoading: entitlementState === 'loading', entitlementState, refreshEntitlement, forgotPassword, login, loginWithOtp, logout, register, resetPassword, restoring, restoreError, restoreSession, sendOtp, user, updateUser }}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
