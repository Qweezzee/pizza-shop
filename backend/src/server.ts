import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import authRouter from "./api/auth";
import pizzasRouter from "./api/pizzas";
import cartRouter from "./api/cart";
import ordersRouter from "./api/orders";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "Pizzeria backend is running" });
});

app.use("/api/auth", authRouter);
app.use("/api/pizzas", pizzasRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", ordersRouter);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
