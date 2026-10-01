import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { API_URL, buildApi } from '../api/client';

const REFRESH_KEY = 'pg_manager_refresh_token';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState('');
  const [user, setUser] = useState(null);
  const [restoring, setRestoring] = useState(true);
  const [activePropertyId, setActivePropertyId] = useState('');
  const [entitlement, setEntitlement] = useState(null);
  const [entitlementState, setEntitlementState] = useState('idle');
  const [entitlementError, setEntitlementError] = useState('');

  async function setSession(data) {
    setAccessToken(data.accessToken);
    setUser(data.user);
    if (data.refreshToken) await SecureStore.setItemAsync(REFRESH_KEY, data.refreshToken);
  }
  function updateUser(nextUser) { setUser(nextUser); }
  async function clearSession() {
    setAccessToken(''); setUser(null); setEntitlement(null); setEntitlementState('idle'); setEntitlementError('');
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  }

  useEffect(() => {
    (async () => {
      try {
        const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
        if (refreshToken) { const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken }); await setSession(data); }
      } catch { await clearSession().catch(() => null); }
      finally { setRestoring(false); }
    })();
  }, []);

  const api = useMemo(() => buildApi({ getAccessToken: () => accessToken, setSession, getRefreshToken: () => SecureStore.getItemAsync(REFRESH_KEY), clearSession }), [accessToken]);

  async function login({ identifier, password }) { const { data } = await axios.post(`${API_URL}/auth/login`, { identifier, password }); await setSession(data); }
  async function loginWithOtp({ email, otp }) { const { data } = await axios.post(`${API_URL}/auth/login-otp`, { email, otp }); await setSession(data); }
  async function sendOtp({ email }) { const { data } = await axios.post(`${API_URL}/auth/send-otp`, { email }); return data; }
  async function register({ name, email, phone, password, confirmPassword }) { const { data } = await axios.post(`${API_URL}/auth/register`, { name, email, phone, password, confirmPassword }); await setSession(data); }
  async function forgotPassword({ email }) { const { data } = await axios.post(`${API_URL}/auth/forgot-password`, { email }); return data; }
  async function resetPassword({ email, otp, newPassword, confirmPassword }) { const { data } = await axios.post(`${API_URL}/auth/reset-password`, { email, otp, newPassword, confirmPassword }); return data; }

  async function refreshEntitlement() {
    if (!accessToken) return null;
    setEntitlementState('loading'); setEntitlementError('');
    try {
      const { data } = await api.get('/billing/status');
      setEntitlement(data.entitlement); setEntitlementState('ready'); return data.entitlement;
    } catch (error) {
      setEntitlement(null); setEntitlementState('error');
      setEntitlementError(error?.uiMessage || error?.response?.data?.message || 'Unable to verify your subscription right now.');
      throw error;
    }
  }

  useEffect(() => {
    if (accessToken) refreshEntitlement().catch(() => null);
    else { setEntitlement(null); setEntitlementState('idle'); setEntitlementError(''); }
  }, [accessToken]);

  async function logout() {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
    await api.post('/auth/logout', { refreshToken }).catch(() => null);
    await clearSession();
  }

  return <AuthContext.Provider value={{ accessToken, activePropertyId, setActivePropertyId, api, clearSession, entitlement, entitlementError, entitlementLoading: entitlementState === 'loading', entitlementState, refreshEntitlement, forgotPassword, login, loginWithOtp, logout, register, resetPassword, restoring, sendOtp, user, updateUser }}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
