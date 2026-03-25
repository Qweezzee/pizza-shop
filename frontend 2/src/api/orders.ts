import { request } from './client';
import type { Order, OrderStatus } from '../types';

export const ordersApi = {
  create: (
    token: string,
    payload: { fullName: string; phone: string; address: string; comment?: string },
  ) =>
    request<Order>('/api/orders', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    }),
  my: (token: string) =>
    request<Order[]>('/api/orders/my', { token }),
  all: (token: string) =>
    request<Order[]>('/api/orders/admin/all', { token }),
  changeStatus: (token: string, id: number, status: OrderStatus) =>
    request<Order>(`/api/orders/${id}/status`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ status }),
    }),
};
