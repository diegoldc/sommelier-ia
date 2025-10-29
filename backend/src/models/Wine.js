import mongoose from 'mongoose';

const WineSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['tinto', 'blanco', 'rosado', 'espumoso'], 
    required: true 
  },
  body: { 
    type: String, 
    enum: ['ligero', 'medio', 'intenso'], 
    required: true 
  },
  description: { type: String },
  pairingNotes: { type: String }, // notas de maridaje, lo usará la IA más adelante
  available: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const Wine = mongoose.model('Wine', WineSchema);
