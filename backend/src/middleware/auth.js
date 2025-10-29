import jwt from 'jsonwebtoken';
import { Restaurant } from '../models/Restaurant.js';

export async function authRequired(req, res, next) {
  try {
    // miramos la cabecera Authorization
    const header = req.headers.authorization;
    if (!header) {
      return res.status(401).json({ error: 'Falta token (Authorization header)' });
    }

    // esperamos formato "Bearer TOKENAQUI"
    const token = header.replace('Bearer ', '');

    // verificamos el token con la misma clave secreta que usamos al crearlo
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // payload debería tener { restaurantId: ... }
    if (!payload.restaurantId) {
      return res.status(401).json({ error: 'Token inválido (sin restaurantId)' });
    }

    // buscamos el restaurante en la base de datos
    const restaurant = await Restaurant.findById(payload.restaurantId);
    if (!restaurant) {
      return res.status(401).json({ error: 'Restaurante no encontrado para este token' });
    }

    // guardamos el restaurante en la request para usarlo en la ruta
    // ej: req.restaurant._id
    req.restaurant = restaurant;

    // pasamos a la siguiente función (la ruta)
    next();
  } catch (err) {
    console.error('authRequired error:', err.message);
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
