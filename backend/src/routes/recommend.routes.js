import express from "express";
import { Dish } from "../models/Dish.js";
import { Wine } from "../models/Wine.js";

export const recommendRouter = express.Router();

/**
 * POST /api/recommendation
 * body:
 * {
 *   "restaurantId": "ID_DEL_RESTAURANTE",
 *   "dishId": "ID_DEL_PLATO",
 *   "preferences": {
 *     "acidity": "baja|media|alta",
 *     "body": "ligero|medio|intenso",
 *     "budget": "<20" | "20-35" | "35+"
 *   }
 * }
 */
recommendRouter.post("/", async (req, res) => {
  try {
    const { restaurantId, dishId, preferences = {} } = req.body;

    // 1) Plato disponible
    const dish = await Dish.findOne({
      _id: dishId,
      restaurantId,
      available: true,
    });
    if (!dish) {
      return res
        .status(404)
        .json({ error: "Plato no disponible o no pertenece al restaurante" });
    }

    // 2) Presupuesto (a futuro, si añadimos priceEUR al vino)
    let minPrice = 0;
    let maxPrice = Infinity;
    const budget = preferences.budget || "";
    if (budget.includes("-")) {
      const [minStr, maxStr] = budget.split("-");
      minPrice = Number(minStr);
      maxPrice = Number(maxStr);
    } else if (budget.startsWith("<")) {
      maxPrice = Number(budget.slice(1));
    } else if (budget.endsWith("+")) {
      minPrice = Number(budget.slice(0, -1));
    }

    // 3) Traer vinos disponibles (filtro básico; precio real se aplicará cuando añadamos priceEUR)
    const wines = await Wine.find({
      restaurantId,
      available: true,
      priceEUR: { $gte: minPrice, $lte: maxPrice },
    });

    // 4) Scoring sencillo según plato, tipo, cuerpo y preferencias
    const scoreWine = (wine) => {
      let score = 0;
      const reasons = [];

      // Intensidad plato ↔ cuerpo vino
      if (dish.intensity === "suave") {
        if (wine.body === "ligero") {
          score += 3;
          reasons.push("vino suave que no tapa el plato");
        }
        if (wine.body === "medio") {
          score += 1;
        }
      } else if (dish.intensity === "medio") {
        if (wine.body === "medio") {
          score += 3;
          reasons.push("cuerpo medio equilibrado");
        }
        if (wine.body === "ligero" || wine.body === "intenso") {
          score += 1;
        }
      } else if (dish.intensity === "fuerte") {
        if (wine.body === "intenso") {
          score += 3;
          reasons.push("suficiente estructura para plato intenso");
        }
        if (wine.body === "medio") {
          score += 1;
        }
      }

      // Tipo de plato ↔ tipo de vino (reglas base)
      const cat = (dish.category || "").toLowerCase();
      if (cat.includes("pescado")) {
        if (wine.type === "blanco") {
          score += 3;
          reasons.push("blanco va muy bien con pescados");
        }
        if (wine.type === "rosado") {
          score += 1;
        }
      }
      if (cat.includes("carne")) {
        if (wine.type === "tinto") {
          score += 3;
          reasons.push("tinto acompaña bien carnes");
        }
        if (wine.type === "rosado") {
          score += 1;
        }
      }
      if (cat.includes("queso")) {
        if (wine.type === "tinto" || wine.type === "blanco") {
          score += 2;
          reasons.push("armoniza con quesos");
        }
      }
      if (cat.includes("postre") || cat.includes("dulce")) {
        if (wine.type === "espumoso" || wine.type === "rosado") {
          score += 2;
          reasons.push("buena opción para postres");
        }
      }

      // Preferencias del cliente (opcional)
      if (preferences.acidity && preferences.acidity === wine.acidity) {
        score += 2;
        reasons.push(`acidez ${wine.acidity} como preferiste`);
      }
      if (preferences.body && preferences.body === wine.body) {
        score += 2;
        reasons.push(`cuerpo ${wine.body} como pediste`);
      }

      if (wine.priceEUR < minPrice || wine.priceEUR > maxPrice) {
        score -= 3;
        reasons.push("fuera de presupuesto");
      }

      return { score, reasons };
    };

    const ranked = wines
      .map((w) => {
        const { score, reasons } = scoreWine(w);
        const why = reasons.length
          ? reasons.join(". ") + "."
          : "Buena armonía general con el plato.";
        return {
          wineId: w._id,
          name: w.name,
          type: w.type,
          body: w.body,
          description: w.description,
          pairingNotes: w.pairingNotes,
          score,
          why,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3); // top 3

    return res.json({
      dish: {
        name: dish.name,
        category: dish.category,
        intensity: dish.intensity,
      },
      recommendations: ranked,
    });
  } catch (err) {
    console.error("recommend error:", err);
    res.status(500).json({ error: "Error generando recomendación" });
  }
});
