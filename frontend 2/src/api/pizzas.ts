import { request } from './client';
import type { Pizza } from '../types';

export const pizzasApi = {
  getAll: () => request<Pizza[]>('/api/pizzas'),
  create: (token: string, payload: Omit<Pizza, 'id' | 'isActive'> & { isActive?: boolean }) =>
    request<Pizza>('/api/pizzas', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    }),
  update: (token: string, id: number, payload: Partial<Pizza>) =>
    request<Pizza>(`/api/pizzas/${id}`, {
      method: 'PUT',
      token,
      body: JSON.stringify(payload),
    }),
  remove: (token: string, id: number) =>
    request<{ message: string }>(`/api/pizzas/${id}`, {
      method: 'DELETE',
      token,
    }),
};
