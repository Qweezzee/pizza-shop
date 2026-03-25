import express, { Request, Response } from "express";
import prisma from "../db";
import { requireAdmin, requireAuth } from "../middleware/auth";

const router = express.Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const pizzas = await prisma.pizza.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
      include: {
        sizes: {
          orderBy: { diameterCm: "asc" },
        },
      },
    });

    return res.json(pizzas);
  } catch (error) {
    return res.status(500).json({ message: "Ошибка получения пицц", error });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const pizzaId = Number(req.params.id);
    const pizza = await prisma.pizza.findUnique({
      where: { id: pizzaId },
      include: { sizes: true },
    });

    if (!pizza) {
      return res.status(404).json({ message: "Пицца не найдена" });
    }

    return res.json(pizza);
  } catch (error) {
    return res.status(500).json({ message: "Ошибка получения пиццы", error });
  }
});

router.post("/", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, description, imageUrl, category, sizes } = req.body;

    if (!name || !description || !category || !Array.isArray(sizes) || sizes.length !== 3) {
      return res.status(400).json({ message: "Передай name, description, category и 3 размера" });
    }

    const pizza = await prisma.pizza.create({
      data: {
        name,
        description,
        imageUrl,
        category,
        sizes: {
          create: sizes.map((size: { size: "SMALL" | "MEDIUM" | "LARGE"; diameterCm: number; price: number }) => ({
            size: size.size,
            diameterCm: Number(size.diameterCm),
            price: Number(size.price),
          })),
        },
      },
      include: { sizes: true },
    });

    return res.status(201).json(pizza);
  } catch (error) {
    return res.status(500).json({ message: "Ошибка создания пиццы", error });
  }
});

router.put("/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const pizzaId = Number(req.params.id);
    const { name, description, imageUrl, category, isActive, sizes } = req.body;

    await prisma.pizza.update({
      where: { id: pizzaId },
      data: {
        name,
        description,
        imageUrl,
        category,
        isActive,
      },
    });

    if (Array.isArray(sizes)) {
      for (const size of sizes) {
        await prisma.pizzaSize.upsert({
          where: {
            pizzaId_size: {
              pizzaId,
              size: size.size,
            },
          },
          update: {
            diameterCm: Number(size.diameterCm),
            price: Number(size.price),
          },
          create: {
            pizzaId,
            size: size.size,
            diameterCm: Number(size.diameterCm),
            price: Number(size.price),
          },
        });
      }
    }

    const updatedPizza = await prisma.pizza.findUnique({
      where: { id: pizzaId },
      include: { sizes: true },
    });

    return res.json(updatedPizza);
  } catch (error) {
    return res.status(500).json({ message: "Ошибка обновления пиццы", error });
  }
});

router.delete("/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const pizzaId = Number(req.params.id);

    await prisma.pizza.update({
      where: { id: pizzaId },
      data: { isActive: false },
    });

    return res.json({ message: "Пицца скрыта" });
  } catch (error) {
    return res.status(500).json({ message: "Ошибка удаления пиццы", error });
  }
});

export default router;
