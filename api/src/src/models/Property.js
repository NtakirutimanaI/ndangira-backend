const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ['house', 'car', 'plot', 'material'], required: true },
    // Transaction type: sale or rent
    transactionType: { type: String, enum: ['sale', 'rent'], required: true },
    // Condition: new or used
    condition: { type: String, enum: ['new', 'used'], required: true },
    // Owner's desired price (what they receive)
    ownerPrice: { type: Number, required: true },
    // Platform price displayed to clients (ownerPrice * 1.1)
    platformPrice: { type: Number, required: true },
    currency: { type: String, default: 'RWF' },
    platformFeePercent: { type: Number, default: 10 },
    area: { type: String, required: true },
    location: { type: String },
    address: { type: String },
    city: { type: String, default: 'Kigali' },
    country: { type: String, default: 'Rwanda' },
    images: [{ type: String }],
    videos: [{ type: String }],
    // Owner contact (hidden from public, visible to admin)
    ownerPhone: { type: String },
    ownerEmail: { type: String },
    ownerUpi: { type: String },
    // Platform contact (shown to clients)
    platformPhone: { type: String },
    platformEmail: { type: String },
    platformUpi: { type: String },
    paymentStatus: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    paymentAmount: { type: Number, default: 2000 },
    paymentTransactionId: { type: String },
    isPublished: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Property', propertySchema);
