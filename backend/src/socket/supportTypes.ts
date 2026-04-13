import type { TokenPayload } from "../utils/jwt";

export type SupportConversationStatus = "OPEN" | "CLOSED";
export type SupportAuthorRole = "USER" | "ADMIN";

export interface SocketUser extends TokenPayload {
  username: string;
}

export interface SupportSocketData {
  user?: SocketUser;
  joinedConversationId?: number;
}

export interface SupportSocketMessage {
  id: number;
  conversationId: number;
  senderId: number;
  authorRole: SupportAuthorRole;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface SupportConversationPayload {
  id: number;
  userId: number;
  status: SupportConversationStatus;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
  messages: SupportSocketMessage[];
}
