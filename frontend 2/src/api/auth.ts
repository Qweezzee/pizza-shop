import { request } from './client';
import type { AuthResponse, User } from '../types';

export const authApi = {
  register: (payload: { username: string; email: string; password: string }) =>
    request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  me: (token: string) =>
    request<User>('/api/auth/me', {
      token,
    }),
};
