import express, { Response } from "express";
import prisma from "../db";
import { AuthRequest, requireAdmin, requireAuth } from "../middleware/auth";

const router = express.Router();

router.use(requireAuth);

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { fullName, phone, address, comment } = req.body;

    if (!fullName || !phone || !address) {
      return res.status(400).json({ message: "Передай fullName, phone и address" });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.user!.id },
      include: {
        pizzaSize: {
          include: {
            pizza: true,
          },
        },
      },
    });

    if (!cartItems.length) {
      return res.status(400).json({ message: "Корзина пуста" });
    }

    const totalPrice = cartItems.reduce((sum, item) => sum + item.quantity * item.pizzaSize.price, 0);

    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          userId: req.user!.id,
          fullName,
          phone,
          address,
          comment,
          totalPrice,
          items: {
            create: cartItems.map((item) => ({
              pizzaSizeId: item.pizzaSizeId,
              quantity: item.quantity,
              price: item.pizzaSize.price,
              pizzaName: item.pizzaSize.pizza.name,
              size: item.pizzaSize.size,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      await tx.cartItem.deleteMany({ where: { userId: req.user!.id } });

      return createdOrder;
    });

    return res.status(201).json(order);
  } catch (error) {
    return res.status(500).json({ message: "Ошибка создания заказа", error });
  }
});

router.get("/my", async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.id },
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: "Ошибка получения заказов", error });
  }
});

router.get("/admin/all", requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: "Ошибка получения всех заказов", error });
  }
});

router.patch("/:id/status", requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const orderId = Number(req.params.id);
    const { status } = req.body;

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: { items: true },
    });

    return res.json(updatedOrder);
  } catch (error) {
    return res.status(500).json({ message: "Ошибка обновления статуса", error });
  }
});

export default router;
