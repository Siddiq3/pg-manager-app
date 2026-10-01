import axios from 'axios';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export function buildApi({ getAccessToken, setSession, getRefreshToken, clearSession }) {
  const api = axios.create({ baseURL: API_URL, timeout: 20_000 });

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
      if (error.response?.status !== 401 || error.config.__retried) throw error;
      const refreshToken = await getRefreshToken();
      if (!refreshToken) throw error;

      try {
        error.config.__retried = true;
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        await setSession(data);
        error.config.headers.Authorization = `Bearer ${data.accessToken}`;
        return api.request(error.config);
      } catch (refreshError) {
        await clearSession();
        throw refreshError;
      }
    }
  );

  return api;
}
