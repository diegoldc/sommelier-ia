import express from 'express';
import axios from 'axios';

export const devRouter = express.Router();

/**
 * GET /api/dev/test-ai
 * Llama al servicio de IA con un payload de ejemplo y devuelve lo que responda.
 */
devRouter.get('/test-ai', async (req, res) => {
  try {
    const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

    const payload = {
      dishCategory: 'carne roja',
      dishIntensity: 'fuerte',
      dishName: 'Entrecot a la brasa',
      preferences: { body: 'intenso', acidity: 'baja', budget: '20-35' },
      candidateWines: [
        { name: 'Ribera del Duero', type: 'tinto', body: 'intenso', acidity: 'baja', priceEUR: 25, description: '', pairingNotes: '' },
        { name: 'Albariño', type: 'blanco', body: 'ligero', acidity: 'alta', priceEUR: 20, description: '', pairingNotes: '' }
      ]
    };

    const { data } = await axios.post(`${aiUrl}/rank-and-explain`, payload);
    res.json({ ok: true, fromAI: data });
  } catch (err) {
    console.error('Error llamando a IA:', err.message);
    res.status(500).json({ ok: false, error: 'No se pudo contactar con el servicio IA' });
  }
});
