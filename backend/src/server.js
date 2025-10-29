import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { authRouter } from "./routes/auth.routes.js";
import { dishesRouter } from "./routes/dishes.routes.js";
import { winesRouter } from "./routes/wines.routes.js";
import { publicRouter } from "./routes/public.routes.js";
import { recommendRouter } from "./routes/recommend.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Ruta simple de prueba
app.get("/health", (req, res) => {
  res.json({ ok: true, message: "Servidor funcionando" });
});

app.use("/api/auth", authRouter);
app.use("/api/dishes", dishesRouter);
app.use("/api/wines", winesRouter);
app.use("/api/public", publicRouter);
app.use("/api/recommend", recommendRouter);

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDB(); // conexion con Mongo
  app.listen(PORT, () => {
    console.log(`🚀 Backend escuchando en puerto ${PORT}`);
  });
}

start();
