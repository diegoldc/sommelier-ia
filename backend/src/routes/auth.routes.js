import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Restaurant } from '../models/Restaurant.js';

export const authRouter = express.Router();

// POST /api/auth/register
// Crea un restaurante nuevo y devuelve un token
authRouter.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // comprobamos si ya existe ese email
    const exists = await Restaurant.findOne({ email });
    if (exists) {
      return res.status(400).json({ error: 'Ese email ya está registrado' });
    }

    // encriptar password
    const passwordHash = await bcrypt.hash(password, 10);

    // crear restaurante
    const restaurant = await Restaurant.create({
      name,
      email,
      passwordHash
    });

    // crear token JWT
    const token = jwt.sign(
      { restaurantId: restaurant._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      restaurant: {
        id: restaurant._id,
        name: restaurant.name,
        email: restaurant.email
      }
    });
  } catch (err) {
    console.error('Error en /register:', err);
    res.status(500).json({ error: 'Error creando restaurante' });
  }
});

// POST /api/auth/login
// Comprueba email+password y devuelve token
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // buscar restaurante por email
    const restaurant = await Restaurant.findOne({ email });
    if (!restaurant) {
      return res.status(401).json({ error: 'Correo no encontrado' });
    }

    // comparar password con el hash guardado
    const okPass = await bcrypt.compare(password, restaurant.passwordHash);
    if (!okPass) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // generar token
    const token = jwt.sign(
      { restaurantId: restaurant._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      restaurant: {
        id: restaurant._id,
        name: restaurant.name,
        email: restaurant.email
      }
    });
  } catch (err) {
    console.error('Error en /login:', err);
    res.status(500).json({ error: 'Error en login' });
  }
});
