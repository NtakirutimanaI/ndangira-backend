const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ['house', 'car', 'plot', 'material'], required: true },
    category: { type: String, required: true },
    price: { type: Number },
    currency: { type: String, default: 'RWF' },
    area: { type: String, required: true },
    location: { type: String },
    address: { type: String },
    city: { type: String, default: 'Kigali' },
    country: { type: String, default: 'Rwanda' },
    images: [{ type: String }],
    videos: [{ type: String }],
    contactPhone: { type: String },
    contactEmail: { type: String },
    upi: { type: String },
    paymentStatus: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    paymentAmount: { type: Number, default: 2000 },
    paymentTransactionId: { type: String },
    isPublished: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Property', propertySchema);
