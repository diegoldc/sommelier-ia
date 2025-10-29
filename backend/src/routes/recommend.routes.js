import express from 'express';
import axios from 'axios';
import { Dish } from '../models/Dish.js';
import { Wine } from '../models/Wine.js';

export const recommendRouter = express.Router();

recommendRouter.post('/', async (req, res) => {
  try {
    const { restaurantId, dishId, preferences = {} } = req.body;

    // 1) Plato del restaurante (disponible)
    const dish = await Dish.findOne({ _id: dishId, restaurantId, available: true });
    if (!dish) {
      return res.status(404).json({ error: 'Plato no disponible o no pertenece al restaurante' });
    }

    // 2) Presupuesto -> minPrice/maxPrice
    let minPrice = 0;
    let maxPrice = Infinity;
    const budget = preferences.budget || '';
    if (budget.includes('-')) {
      const [minStr, maxStr] = budget.split('-');
      minPrice = Number(minStr);
      maxPrice = Number(maxStr);
    } else if (budget.startsWith('<')) {
      maxPrice = Number(budget.slice(1));
    } else if (budget.endsWith('+')) {
      minPrice = Number(budget.slice(0, -1));
    }

    // 3) Vinos candidatos por precio + disponibilidad
    const wines = await Wine.find({
      restaurantId,
      available: true,
      priceEUR: { $gte: minPrice, $lte: maxPrice }
    });

    if (!wines.length) {
      return res.json({
        dish: { name: dish.name, category: dish.category, intensity: dish.intensity },
        recommendations: [],
        info: 'No hay vinos dentro del presupuesto o stock.'
      });
    }

    // 4) Ranking sencillo + texto base (fallback)
    const scoreWine = (wine) => {
      let score = 0;
      const reasons = [];

      // Intensidad plato ↔ cuerpo vino
      if (dish.intensity === 'suave') {
        if (wine.body === 'ligero') { score += 3; reasons.push('vino suave que no tapa el plato'); }
        if (wine.body === 'medio')  { score += 1; }
      } else if (dish.intensity === 'medio') {
        if (wine.body === 'medio')  { score += 3; reasons.push('cuerpo medio equilibrado'); }
        if (wine.body === 'ligero' || wine.body === 'intenso') { score += 1; }
      } else if (dish.intensity === 'fuerte') {
        if (wine.body === 'intenso') { score += 3; reasons.push('suficiente estructura para plato intenso'); }
        if (wine.body === 'medio')   { score += 1; }
      }

      // Tipo de plato ↔ tipo de vino
      const cat = (dish.category || '').toLowerCase();
      if (cat.includes('pescado')) {
        if (wine.type === 'blanco') { score += 3; reasons.push('blanco va muy bien con pescados'); }
        if (wine.type === 'rosado') { score += 1; }
      }
      if (cat.includes('carne')) {
        if (wine.type === 'tinto')  { score += 3; reasons.push('tinto acompaña bien carnes'); }
        if (wine.type === 'rosado') { score += 1; }
      }
      if (cat.includes('queso')) {
        if (wine.type === 'tinto' || wine.type === 'blanco') { score += 2; reasons.push('armoniza con quesos'); }
      }
      if (cat.includes('postre') || cat.includes('dulce')) {
        if (wine.type === 'espumoso' || wine.type === 'rosado') { score += 2; reasons.push('buena opción para postres'); }
      }

      // Preferencias del cliente
      if (preferences.acidity && preferences.acidity === wine.acidity) {
        score += 2; reasons.push(`acidez ${wine.acidity} como preferiste`);
      }
      if (preferences.body && preferences.body === wine.body) {
        score += 2; reasons.push(`cuerpo ${wine.body} como pediste`);
      }

      return { score, reasons };
    };

    const baseRanked = wines
      .map(w => {
        const { score, reasons } = scoreWine(w);
        const baseWhy = reasons.length ? reasons.join('. ') + '.' : 'Buena armonía general con el plato.';
        return {
          wineId: w._id.toString(),
          name: w.name,
          type: w.type,
          body: w.body,
          acidity: w.acidity,
          priceEUR: w.priceEUR,
          description: w.description,
          pairingNotes: w.pairingNotes,
          score,
          baseWhy
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    // 5) Llamada a IA (FastAPI) → textos bonitos
    let aiWhys = null;
    try {
      const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      const payload = {
        dishCategory: dish.category,
        dishIntensity: dish.intensity,
        dishName: dish.name,
        preferences: {
          acidity: preferences.acidity || null,
          body: preferences.body || null,
          budget: preferences.budget || null
        },
        candidateWines: baseRanked.map(w => ({
          name: w.name,
          type: w.type,
          body: w.body,
          acidity: w.acidity,
          priceEUR: w.priceEUR,
          description: w.description || '',
          pairingNotes: w.pairingNotes || ''
        }))
      };

      const { data } = await axios.post(`${aiUrl}/rank-and-explain`, payload, { timeout: 5000 });
      aiWhys = data?.recommendations || null;
    } catch (e) {
      console.warn('IA no disponible, usando fallback:', e.message);
    }

    // 6) Combinar IA (si hay) con ranking base
    const finalRecs = baseRanked.map((w, idx) => {
      const aiWhy = aiWhys?.[idx]?.why;
      return {
        wineId: w.wineId,
        name: w.name,
        type: w.type,
        body: w.body,
        acidity: w.acidity,
        priceEUR: w.priceEUR,
        score: w.score,
        why: aiWhy || w.baseWhy
      };
    });

    return res.json({
      dish: { name: dish.name, category: dish.category, intensity: dish.intensity },
      recommendations: finalRecs
    });
  } catch (err) {
    console.error('recommend error:', err);
    res.status(500).json({ error: 'Error generando recomendación' });
  }
});
