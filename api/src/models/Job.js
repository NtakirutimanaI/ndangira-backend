const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    type: { type: String, enum: ['Full-time', 'Part-time', 'Contract', 'Internship'], default: 'Full-time' },
    category: { type: String, trim: true, default: 'General' },
    description: { type: String, required: true },
    applyEmail: { type: String, trim: true },
    applyUrl: { type: String, trim: true },
    image: { type: String, trim: true },
    amount: { type: Number, default: 5000 },
    currency: { type: String, default: 'RWF' },
    paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
    isPublished: { type: Boolean, default: false },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Job', jobSchema);
