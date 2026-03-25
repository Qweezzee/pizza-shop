import express, { Response } from "express";
import prisma from "../db";
import { AuthRequest, requireAuth } from "../middleware/auth";

const router = express.Router();

router.use(requireAuth);

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const items = await prisma.cartItem.findMany({
      where: { userId: req.user!.id },
      include: {
        pizzaSize: {
          include: {
            pizza: true,
          },
        },
      },
      orderBy: { id: "asc" },
    });

    const totalPrice = items.reduce((sum, item) => sum + item.quantity * item.pizzaSize.price, 0);

    return res.json({ items, totalPrice });
  } catch (error) {
    return res.status(500).json({ message: "Ошибка получения корзины", error });
  }
});

router.post("/add", async (req: AuthRequest, res: Response) => {
  try {
    const { pizzaSizeId, quantity } = req.body;

    if (!pizzaSizeId) {
      return res.status(400).json({ message: "Передай pizzaSizeId" });
    }

    const qty = Number(quantity) || 1;

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        userId_pizzaSizeId: {
          userId: req.user!.id,
          pizzaSizeId: Number(pizzaSizeId),
        },
      },
    });

    if (existingItem) {
      const updated = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + qty },
      });

      return res.json(updated);
    }

    const created = await prisma.cartItem.create({
      data: {
        userId: req.user!.id,
        pizzaSizeId: Number(pizzaSizeId),
        quantity: qty,
      },
    });

    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ message: "Ошибка добавления в корзину", error });
  }
});

router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const cartItemId = Number(req.params.id);
    const quantity = Number(req.body.quantity);

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: "Количество должно быть больше 0" });
    }

    const item = await prisma.cartItem.findFirst({
      where: { id: cartItemId, userId: req.user!.id },
    });

    if (!item) {
      return res.status(404).json({ message: "Товар в корзине не найден" });
    }

    const updated = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Ошибка обновления корзины", error });
  }
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const cartItemId = Number(req.params.id);

    const item = await prisma.cartItem.findFirst({
      where: { id: cartItemId, userId: req.user!.id },
    });

    if (!item) {
      return res.status(404).json({ message: "Товар в корзине не найден" });
    }

    await prisma.cartItem.delete({ where: { id: cartItemId } });

    return res.json({ message: "Товар удалён из корзины" });
  } catch (error) {
    return res.status(500).json({ message: "Ошибка удаления из корзины", error });
  }
});

router.delete("/", async (req: AuthRequest, res: Response) => {
  try {
    await prisma.cartItem.deleteMany({ where: { userId: req.user!.id } });
    return res.json({ message: "Корзина очищена" });
  } catch (error) {
    return res.status(500).json({ message: "Ошибка очистки корзины", error });
  }
});

export default router;
