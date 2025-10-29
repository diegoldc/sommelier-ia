import mongoose from 'mongoose';

const DishSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  name: { type: String, required: true },
  category: { type: String, required: true },
  intensity: { type: String, enum: ['suave', 'medio', 'fuerte'], required: true },
  description: { type: String },
  available: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const Dish = mongoose.model('Dish', DishSchema);
