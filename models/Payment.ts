import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  months: {
    type: Number,
    required: true,
    enum: [1, 3],
  },
  paymentDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
});

PaymentSchema.index({ userId: 1, paymentDate: -1 });
PaymentSchema.index({ phone: 1, paymentDate: -1 });

export default mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
