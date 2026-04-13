import { addMessage, getConversationById } from "./supportStore";
import type { SocketUser } from "./supportTypes";

export function getConversationRoom(conversationId: number) {
  return `support:${conversationId}`;
}

export async function getConversationForUser(conversationId: number, user: SocketUser) {
  const conversation = getConversationById(conversationId);
  if (!conversation) return null;

  const hasAccess = user.role === "ADMIN" || conversation.userId === user.id;
  if (!hasAccess) return null;

  return conversation;
}

export async function saveSupportMessage(params: {
  conversationId: number;
  sender: SocketUser;
  text: string;
}) {
  const conversation = getConversationById(params.conversationId);
  if (!conversation) {
    throw new Error("Диалог не найден");
  }

  const hasAccess = params.sender.role === "ADMIN" || conversation.userId === params.sender.id;
  if (!hasAccess) {
    throw new Error("Нет доступа к этому диалогу");
  }

  return addMessage({
    conversationId: params.conversationId,
    senderId: params.sender.id,
    authorRole: params.sender.role,
    authorName: params.sender.username,
    text: params.text,
  });
}
