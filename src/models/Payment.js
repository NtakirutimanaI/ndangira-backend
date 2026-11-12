const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', default: null },
    type: { type: String, enum: ['per-property', 'unlimited'], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'RWF' },
    method: { type: String, enum: ['momo', 'airtel', 'bank', 'card'], default: 'momo' },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    transactionId: { type: String },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
