import express from "express";
import { Dish } from "../models/Dish.js";
import { Wine } from "../models/Wine.js";

export const publicRouter = express.Router();

//listar platos disponibles
publicRouter.get("/:restaurantId/dishes-available", async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const dishes = await Dish.find({ restaurantId, available: true }).select("name category intensity description -_id"); 
    res.json(dishes);
  } catch (error) {
    console.log("public dishes:", error.message);
    res.status(500).json({ error: "Error al obtener los platos" });
  }
});

//listar vinos disponibles
publicRouter.get('/:restaurantId/wines-available', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const wines = await Wine.find({ restaurantId, available: true })
      .select('name type body description pairingNotes -_id');
    res.json(wines);
  } catch (err) {
    console.error('public wines:', err.message);
    res.status(500).json({ error: 'Error al obtener vinos públicos' });
  }
});