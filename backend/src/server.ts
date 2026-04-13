import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import authRouter from "./api/auth";
import pizzasRouter from "./api/pizzas";
import cartRouter from "./api/cart";
import ordersRouter from "./api/orders";
import supportRouter from "./api/support";
import { registerSupportSocket } from "./socket/supportSocket";

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
app.use("/api/support", supportRouter);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST", "PATCH"],
    credentials: true,
  },
});

registerSupportSocket(io);

httpServer.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
