import axios from 'axios';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export function buildApi({ getAccessToken, setSession, getRefreshToken, clearSession }) {
  const api = axios.create({ baseURL: API_URL, timeout: 20_000 });
  let refreshing = null;

  api.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.code === 'ECONNABORTED') { error.uiKind = 'timeout'; error.uiMessage = 'The request took too long. Check your connection and try again.'; }
      else if (!error.response) { error.uiKind = 'network'; error.uiMessage = 'No connection. Check your network and try again.'; }
      else if (error.response.status >= 500) { error.uiKind = 'server'; error.uiMessage = 'The server is having trouble right now. Please try again.'; }
      else if (error.response.status === 429) { error.uiKind = 'rate'; error.uiMessage = 'Too many requests. Wait a moment and try again.'; }
      const config = error.config;
      const isCredentialRequest = /\/auth\/(login|register|refresh|send-otp|forgot-password|reset-password)(?:[/?]|$)/.test(config?.url || '');
      if (error.response?.status !== 401 || !config || config.__retried || isCredentialRequest) throw error;

      error.config.__retried = true;

      // A late response may belong to the token another request already renewed.
      const currentToken = getAccessToken();
      if (currentToken && config.headers?.Authorization !== `Bearer ${currentToken}`) {
        config.headers.Authorization = `Bearer ${currentToken}`;
        return api.request(config);
      }

      if (!refreshing) {
        refreshing = (async () => {
          try {
            const refreshToken = await getRefreshToken();
            if (!refreshToken) throw error;
            const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken }, { timeout: 20_000 });
            if (!data?.accessToken || !data?.refreshToken) throw new Error('Unable to renew your session. Please retry.');
            await setSession(data);
            return data;
          } catch (refreshError) {
            if (refreshError.response?.status === 401) await clearSession();
            throw refreshError;
          } finally {
            refreshing = null;
          }
        })();
      }

      const data = await refreshing;
      error.config.headers.Authorization = `Bearer ${data.accessToken}`;
      return api.request(error.config);
    }
  );

  return api;
}
