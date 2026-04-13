import type { SupportConversationPayload, SupportConversationStatus, SupportSocketMessage } from "./supportTypes";

type SupportConversationInternal = SupportConversationPayload;

const conversationsById = new Map<number, SupportConversationInternal>();
const conversationIdByUserId = new Map<number, number>();

let conversationSeq = 1;
let messageSeq = 1;

export function ensureConversation(user: { id: number; username: string; email: string }): SupportConversationPayload {
  const existingId = conversationIdByUserId.get(user.id);
  if (existingId) {
    return structuredClone(conversationsById.get(existingId)!);
  }

  const now = new Date().toISOString();
  const conversation: SupportConversationInternal = {
    id: conversationSeq++,
    userId: user.id,
    status: "OPEN",
    createdAt: now,
    updatedAt: now,
    user,
    messages: [],
  };

  conversationsById.set(conversation.id, conversation);
  conversationIdByUserId.set(user.id, conversation.id);
  return structuredClone(conversation);
}

export function getConversationById(conversationId: number) {
  const conversation = conversationsById.get(conversationId);
  return conversation ? structuredClone(conversation) : null;
}

export function getConversationByUserId(userId: number) {
  const conversationId = conversationIdByUserId.get(userId);
  if (!conversationId) return null;
  return getConversationById(conversationId);
}

export function listConversations() {
  return Array.from(conversationsById.values())
    .map((item) => structuredClone(item))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.id - a.id);
}

export function setConversationStatus(conversationId: number, status: SupportConversationStatus) {
  const conversation = conversationsById.get(conversationId);
  if (!conversation) return null;
  conversation.status = status;
  conversation.updatedAt = new Date().toISOString();
  return structuredClone(conversation);
}

export function addMessage(params: {
  conversationId: number;
  senderId: number;
  authorRole: "USER" | "ADMIN";
  authorName: string;
  text: string;
}) {
  const conversation = conversationsById.get(params.conversationId);
  if (!conversation) {
    throw new Error("Диалог не найден");
  }

  const text = params.text.trim().replace(/\s+/g, " ");
  if (!text) {
    throw new Error("Сообщение не может быть пустым");
  }
  if (text.length > 1000) {
    throw new Error("Сообщение слишком длинное");
  }

  const message: SupportSocketMessage = {
    id: messageSeq++,
    conversationId: params.conversationId,
    senderId: params.senderId,
    authorRole: params.authorRole,
    authorName: params.authorName,
    text,
    createdAt: new Date().toISOString(),
  };

  conversation.messages.push(message);
  conversation.updatedAt = message.createdAt;
  conversation.status = "OPEN";

  return structuredClone(message);
}
