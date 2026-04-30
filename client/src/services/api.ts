import axios, { AxiosError } from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tm_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ApiErrorPayload {
  error: true;
  message: string;
  details?: unknown;
}

export function getErrorMessage(err: unknown): string {
  const ax = err as AxiosError<ApiErrorPayload>;
  if (ax?.response?.data?.message) return ax.response.data.message;
  if (ax?.message) return ax.message;
  return 'Something went wrong';
}
