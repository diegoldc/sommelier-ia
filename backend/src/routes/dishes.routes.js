import express from 'express';
import { Dish } from '../models/Dish.js';
import { authRequired } from '../middleware/auth.js';

export const dishesRouter = express.Router();

/**
 * GET /api/dishes
 * Lista todos los platos del restaurante autenticado
 */
dishesRouter.get('/', authRequired, async (req, res) => {
  try {
    const dishes = await Dish.find({ restaurantId: req.restaurant._id });
    res.json(dishes);
  } catch (err) {
    console.error('Error al listar platos:', err.message);
    res.status(500).json({ error: 'Error al obtener los platos' });
  }
});

/**
 * POST /api/dishes
 * Crea un nuevo plato para el restaurante autenticado
 */
dishesRouter.post('/', authRequired, async (req, res) => {
  try {
    const { name, category, intensity, description, available } = req.body;

    const dish = await Dish.create({
      restaurantId: req.restaurant._id,
      name,
      category,
      intensity,
      description,
      available
    });

    res.status(201).json(dish);
  } catch (err) {
    console.error('Error al crear plato:', err.message);
    res.status(500).json({ error: 'Error al crear plato' });
  }
});

/**
 * PATCH /api/dishes/:id
 * Edita un plato existente (solo del restaurante autenticado)
 */
dishesRouter.patch('/:id', authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const dish = await Dish.findOneAndUpdate(
      { _id: id, restaurantId: req.restaurant._id },
      updates,
      { new: true }
    );

    if (!dish) {
      return res.status(404).json({ error: 'Plato no encontrado o no pertenece al restaurante' });
    }

    res.json(dish);
  } catch (err) {
    console.error('Error al editar plato:', err.message);
    res.status(500).json({ error: 'Error al editar plato' });
  }
});

/**
 * DELETE /api/dishes/:id
 * Marca un plato como no disponible o lo elimina (según prefieras)
 */
dishesRouter.delete('/:id', authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    await Dish.findOneAndDelete({ _id: id, restaurantId: req.restaurant._id });
    res.json({ ok: true, message: 'Plato eliminado' });
  } catch (err) {
    console.error('Error al eliminar plato:', err.message);
    res.status(500).json({ error: 'Error al eliminar plato' });
  }
});
