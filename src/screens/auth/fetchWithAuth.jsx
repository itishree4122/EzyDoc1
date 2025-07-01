import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './Api';

export const getToken = async () => AsyncStorage.getItem('accessToken');
export const getRefreshToken = async () => AsyncStorage.getItem('refreshToken');
export const setTokens = async (access, refresh) => {
  await AsyncStorage.setItem('accessToken', access);
  if (refresh) await AsyncStorage.setItem('refreshToken', refresh);
};

export const fetchWithAuth = async (url, options = {}) => {
  let token = await getToken();
  let response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401 || response.status === 403) {
    // Try to refresh token
    const refreshToken = await getRefreshToken();
    const refreshResponse = await fetch(`${BASE_URL}/users/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    if (refreshResponse.ok) {
      const data = await refreshResponse.json();
      await setTokens(data.access, data.refresh || refreshToken);
      // Retry original request with new token
      token = data.access;
      response = await fetch(url, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      });
    } else {
      // Refresh failed, logout user
      await AsyncStorage.clear();
      // Optionally: navigate to login screen here
      throw new Error('Session expired. Please login again.');
    }
  }
  return response;
};