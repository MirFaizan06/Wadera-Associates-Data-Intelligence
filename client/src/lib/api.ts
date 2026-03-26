import axios, { AxiosError } from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  res => res,
  (error: AxiosError<{ error: { message: string; code: string } }>) => {
    if (error.response?.status === 401) {
      // Clear local auth state and redirect to login
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default api;
