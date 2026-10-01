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
  const [entitlementLoading, setEntitlementLoading] = useState(false);

  async function setSession(data) {
    setAccessToken(data.accessToken);
    setUser(data.user);
    if (data.refreshToken) {
      await SecureStore.setItemAsync(REFRESH_KEY, data.refreshToken);
    }
  }

  function updateUser(nextUser) { setUser(nextUser); }

  async function clearSession() {
    setAccessToken('');
    setUser(null);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  }

  // Refresh tokens live for days, so a stored one resumes the session on
  // launch instead of asking the owner to sign in again.
  useEffect(() => {
    (async () => {
      try {
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
  }, []);

  const api = useMemo(
    () =>
      buildApi({
        getAccessToken: () => accessToken,
        setSession,
        getRefreshToken: () => SecureStore.getItemAsync(REFRESH_KEY),
        clearSession,
      }),
    [accessToken]
  );

  /** Email or mobile number, plus password. */
  async function login({ identifier, password }) {
    const { data } = await axios.post(`${API_URL}/auth/login`, { identifier, password });
    await setSession(data);
  }

  /** Email + the 6-digit code from /auth/send-otp. */
  async function loginWithOtp({ email, otp }) {
    const { data } = await axios.post(`${API_URL}/auth/login-otp`, { email, otp });
    await setSession(data);
  }

  async function sendOtp({ email }) {
    const { data } = await axios.post(`${API_URL}/auth/send-otp`, { email });
    return data;
  }

  async function register({ name, email, phone, password, confirmPassword }) {
    const { data } = await axios.post(`${API_URL}/auth/register`, {
      name,
      email,
      phone,
      password,
      confirmPassword,
    });
    await setSession(data);
  }

  async function forgotPassword({ email }) {
    const { data } = await axios.post(`${API_URL}/auth/forgot-password`, { email });
    return data;
  }

  async function resetPassword({ email, otp, newPassword, confirmPassword }) {
    const { data } = await axios.post(`${API_URL}/auth/reset-password`, {
      email,
      otp,
      newPassword,
      confirmPassword,
    });
    return data;
  }

  async function refreshEntitlement() { if (!accessToken) return null; setEntitlementLoading(true); try { const { data } = await api.get('/billing/status'); setEntitlement(data.entitlement); return data.entitlement; } finally { setEntitlementLoading(false); } }

  useEffect(() => { if (accessToken) refreshEntitlement().catch(() => setEntitlement(null)); else setEntitlement(null); }, [accessToken]);

  async function logout() {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
    await api.post('/auth/logout', { refreshToken }).catch(() => null);
    await clearSession();
  }

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        activePropertyId,
        setActivePropertyId,
        api,
        clearSession,
        entitlement,
        entitlementLoading,
        refreshEntitlement,
        forgotPassword,
        login,
        loginWithOtp,
        logout,
        register,
        resetPassword,
        restoring,
        sendOtp,
        user,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
