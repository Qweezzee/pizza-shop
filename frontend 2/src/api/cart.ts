import { request } from './client';
import type { CartResponse } from '../types';

export const cartApi = {
  get: (token: string) => request<CartResponse>('/api/cart', { token }),
  add: (token: string, payload: { pizzaSizeId: number; quantity: number }) =>
    request('/api/cart/add', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    }),
  update: (token: string, id: number, quantity: number) =>
    request(`/api/cart/${id}`, {
      method: 'PUT',
      token,
      body: JSON.stringify({ quantity }),
    }),
  remove: (token: string, id: number) =>
    request(`/api/cart/${id}`, {
      method: 'DELETE',
      token,
    }),
  clear: (token: string) =>
    request('/api/cart', {
      method: 'DELETE',
      token,
    }),
};
