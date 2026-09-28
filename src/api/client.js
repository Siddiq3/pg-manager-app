import axios from 'axios';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export function buildApi({ getAccessToken, setSession, getRefreshToken, clearSession }) {
  const api = axios.create({ baseURL: API_URL });

  api.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
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
