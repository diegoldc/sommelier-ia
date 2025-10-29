import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { authRouter } from "./routes/auth.routes.js";
import { dishesRouter } from "./routes/dishes.routes.js";
import { winesRouter } from "./routes/wines.routes.js";

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

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDB(); // conexion con Mongo
  app.listen(PORT, () => {
    console.log(`🚀 Backend escuchando en puerto ${PORT}`);
  });
}

start();
