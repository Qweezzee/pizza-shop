import express, { Response } from "express";
import prisma from "../db";
import { AuthRequest, requireAdmin, requireAuth } from "../middleware/auth";
import { ensureConversation, getConversationById, getConversationByUserId, listConversations, setConversationStatus } from "../socket/supportStore";

const router = express.Router();

router.get("/conversation", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, username: true, email: true },
    });

    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    const conversation = getConversationByUserId(user.id) ?? ensureConversation(user);
    return res.json(conversation);
  } catch (error) {
    return res.status(500).json({ message: "Не удалось загрузить чат поддержки", error });
  }
});

router.get("/conversations", requireAuth, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const conversations = listConversations().map((item) => ({
      ...item,
      lastMessage: item.messages[item.messages.length - 1] ?? null,
      messages: undefined,
    }));
    return res.json(conversations);
  } catch (error) {
    return res.status(500).json({ message: "Не удалось загрузить обращения", error });
  }
});

router.get("/conversations/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const conversationId = Number(req.params.id);
    if (!Number.isInteger(conversationId)) {
      return res.status(400).json({ message: "Некорректный id диалога" });
    }

    const conversation = getConversationById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Диалог не найден" });
    }

    const isAdmin = req.user!.role === "ADMIN";
    if (!isAdmin && conversation.userId !== req.user!.id) {
      return res.status(403).json({ message: "Нет доступа к этому диалогу" });
    }

    return res.json(conversation);
  } catch (error) {
    return res.status(500).json({ message: "Не удалось загрузить диалог", error });
  }
});

router.patch("/conversations/:id/status", requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const conversationId = Number(req.params.id);
    const status = req.body?.status;

    if (!Number.isInteger(conversationId)) {
      return res.status(400).json({ message: "Некорректный id диалога" });
    }

    if (status !== "OPEN" && status !== "CLOSED") {
      return res.status(400).json({ message: "Некорректный статус" });
    }

    const conversation = setConversationStatus(conversationId, status);
    if (!conversation) {
      return res.status(404).json({ message: "Диалог не найден" });
    }

    return res.json(conversation);
  } catch (error) {
    return res.status(500).json({ message: "Не удалось обновить статус", error });
  }
});

export default router;
