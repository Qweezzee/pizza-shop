import { request } from './client';
import type { SupportConversation, SupportConversationListItem, SupportConversationStatus } from '../types';

export const supportApi = {
  getMyConversation(token: string) {
    return request<SupportConversation>('/api/support/conversation', { token });
  },
  getConversation(token: string, id: number) {
    return request<SupportConversation>(`/api/support/conversations/${id}`, { token });
  },
  getAll(token: string) {
    return request<SupportConversationListItem[]>('/api/support/conversations', { token });
  },
  updateStatus(token: string, id: number, status: SupportConversationStatus) {
    return request<SupportConversation>(`/api/support/conversations/${id}/status`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ status }),
    });
  },
};
