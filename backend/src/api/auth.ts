import express, { Request, Response } from "express";
import prisma from "../db";
import { comparePassword, hashPassword } from "../utils/hash";
import { signToken } from "../utils/jwt";
import { AuthRequest, requireAuth } from "../middleware/auth";

const router = express.Router();

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Заполни username, email и password" });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Пользователь с таким email или username уже существует" });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    const token = signToken({ id: user.id, email: user.email, role: user.role });

    return res.status(201).json({
      message: "Регистрация успешна",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Ошибка сервера", error });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Введи email и password" });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ message: "Неверный email или пароль" });
    }

    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      return res.status(400).json({ message: "Неверный email или пароль" });
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });

    return res.json({
      message: "Вход выполнен",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Ошибка сервера", error });
  }
});

router.get("/me", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: "Ошибка сервера", error });
  }
});

router.post("/logout", async (_req: Request, res: Response) => {
  return res.json({ message: "Выход выполнен. На фронтенде просто удали токен." });
});

export default router;
