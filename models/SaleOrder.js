const mongoose = require('mongoose')
const { ObjectId } = mongoose.Types // Import ObjectId from mongoose

const SaleOrderSchema = new mongoose.Schema({
  orderNumber: { type: String, default: () => new ObjectId().toString() },
  user: { type: String, required: true },
  date: { type: Date, default: Date.now },
  items: [
    {
      menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Menu',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
    },
  ],
  total: { type: Number, required: true },
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Completed', 'Cancelled'],
    default: 'Pending',
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['Cash', 'PromptPay'],
  },
  notes: { type: String },
})

module.exports = mongoose.model('SaleOrder', SaleOrderSchema)
