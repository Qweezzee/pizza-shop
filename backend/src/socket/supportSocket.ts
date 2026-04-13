import type { Server, Socket } from "socket.io";
import prisma from "../db";
import { verifyToken } from "../utils/jwt";
import { getConversationForUser, getConversationRoom, saveSupportMessage } from "./supportService";
import type { SocketUser, SupportSocketData, SupportSocketMessage } from "./supportTypes";

function getBearerToken(rawValue?: string | string[]) {
  const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
  if (!value) return null;
  if (value.startsWith("Bearer ")) {
    return value.slice(7);
  }
  return value;
}

export function registerSupportSocket(io: Server) {
  io.use(async (socket, next) => {
    try {
      const token =
        getBearerToken(socket.handshake.auth?.token) ||
        getBearerToken(socket.handshake.headers.authorization);

      if (!token) {
        return next(new Error("Требуется авторизация"));
      }

      const payload = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { id: true, email: true, role: true, username: true },
      });

      if (!user) {
        return next(new Error("Пользователь не найден"));
      }

      (socket.data as SupportSocketData).user = user satisfies SocketUser;
      return next();
    } catch {
      return next(new Error("Неверный токен"));
    }
  });

  io.on("connection", (socket: Socket) => {
    socket.on(
      "support:join",
      async (payload: { conversationId: number }, callback: (ack: { ok: boolean; error?: string }) => void) => {
        try {
          const user = (socket.data as SupportSocketData).user;
          if (!user) {
            callback({ ok: false, error: "Требуется авторизация" });
            return;
          }

          const conversationId = Number(payload?.conversationId);
          if (!Number.isInteger(conversationId)) {
            callback({ ok: false, error: "Некорректный диалог" });
            return;
          }

          const conversation = await getConversationForUser(conversationId, user);
          if (!conversation) {
            callback({ ok: false, error: "Диалог не найден или нет доступа" });
            return;
          }

          const socketData = socket.data as SupportSocketData;
          if (socketData.joinedConversationId) {
            socket.leave(getConversationRoom(socketData.joinedConversationId));
          }

          socketData.joinedConversationId = conversationId;
          socket.join(getConversationRoom(conversationId));
          socket.emit("support:history", conversation.messages);
          callback({ ok: true });
        } catch (error) {
          callback({ ok: false, error: error instanceof Error ? error.message : "Ошибка подключения к чату" });
        }
      },
    );

    socket.on(
      "support:message",
      async (
        payload: { conversationId: number; text: string },
        callback: (ack: { ok: boolean; error?: string; message?: SupportSocketMessage }) => void,
      ) => {
        try {
          const socketData = socket.data as SupportSocketData;
          const user = socketData.user;
          if (!user) {
            callback({ ok: false, error: "Требуется авторизация" });
            return;
          }

          const conversationId = Number(payload?.conversationId);
          if (!Number.isInteger(conversationId) || socketData.joinedConversationId !== conversationId) {
            callback({ ok: false, error: "Сначала подключись к нужному диалогу" });
            return;
          }

          const message = await saveSupportMessage({
            conversationId,
            sender: user,
            text: payload?.text ?? "",
          });

          io.to(getConversationRoom(conversationId)).emit("support:message", message);
          callback({ ok: true, message });
        } catch (error) {
          callback({ ok: false, error: error instanceof Error ? error.message : "Ошибка отправки сообщения" });
        }
      },
    );
  });
}
