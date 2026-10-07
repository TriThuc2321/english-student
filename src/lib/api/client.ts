import axios, { isAxiosError } from 'axios';

import { LOGIN_PATH } from '@/lib/auth/constants';

export const api = axios.create({ baseURL: '/api/bff' });

api.interceptors.response.use(undefined, (error) => {
  if (
    isAxiosError(error) &&
    error.response?.status === 401 &&
    typeof window !== 'undefined'
  ) {
    window.location.href = LOGIN_PATH;
  }
  return Promise.reject(error);
});
