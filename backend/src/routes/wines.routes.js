import express from 'express';
import { Wine } from '../models/Wine.js';
import { authRequired } from '../middleware/auth.js';

export const winesRouter = express.Router();

/** GET /api/wines  — lista vinos del restaurante autenticado */
winesRouter.get('/', authRequired, async (req, res) => {
  try {
    const wines = await Wine.find({ restaurantId: req.restaurant._id });
    res.json(wines);
  } catch (err) {
    console.error('Listar vinos:', err.message);
    res.status(500).json({ error: 'Error al obtener vinos' });
  }
});

/** POST /api/wines — crea un vino */
winesRouter.post('/', authRequired, async (req, res) => {
  try {
    const { name, type, body, acidity, priceEUR, description, pairingNotes, available } = req.body;

    const wine = await Wine.create({
      restaurantId: req.restaurant._id,
      name,
      type,       // 'tinto' | 'blanco' | 'rosado' | 'espumoso'
      body,       // 'ligero' | 'medio' | 'intenso'
      acidity,    // 'baja' | 'media' | 'alta'
      priceEUR,
      description,
      pairingNotes,
      available
    });

    res.status(201).json(wine);
  } catch (err) {
    console.error('Crear vino:', err.message);
    res.status(500).json({ error: 'Error al crear vino' });
  }
});

/** PATCH /api/wines/:id — edita un vino del restaurante */
winesRouter.patch('/:id', authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const wine = await Wine.findOneAndUpdate(
      { _id: id, restaurantId: req.restaurant._id },
      updates,
      { new: true }
    );

    if (!wine) return res.status(404).json({ error: 'Vino no encontrado' });
    res.json(wine);
  } catch (err) {
    console.error('Editar vino:', err.message);
    res.status(500).json({ error: 'Error al editar vino' });
  }
});

/** DELETE /api/wines/:id — elimina un vino (o podrías desactivarlo) */
winesRouter.delete('/:id', authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    await Wine.findOneAndDelete({ _id: id, restaurantId: req.restaurant._id });
    res.json({ ok: true, message: 'Vino eliminado' });
  } catch (err) {
    console.error('Eliminar vino:', err.message);
    res.status(500).json({ error: 'Error al eliminar vino' });
  }
});
