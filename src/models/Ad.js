const mongoose = require('mongoose');

const adSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    contactName: { type: String, required: true, trim: true },
    contactEmail: { type: String, required: true, trim: true },
    contactPhone: { type: String, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    imageUrl: { type: String, trim: true },
    images: { type: [String], default: [] },
    videoLinks: { type: [String], default: [] },
    targetUrl: { type: String, trim: true },
    plan: { type: String, enum: ['monthly', 'yearly'], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'RWF' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
    isActive: { type: Boolean, default: false },
    startsAt: { type: Date },
    expiresAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ad', adSchema);
