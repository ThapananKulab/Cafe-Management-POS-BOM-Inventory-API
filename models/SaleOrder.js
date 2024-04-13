const mongoose = require('mongoose')
const { ObjectId } = mongoose.Types

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
      name: {
        type: String,
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
      cost: {
        type: Number,
      },
    },
  ],
  total: { type: Number, required: true },
  profit: { type: Number, required: true },
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Completed', 'Cancelled'],
    default: 'Pending',
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['เงินสด', 'PromptPay'],
  },
  notes: { type: String },
  change: { type: Number },
})

module.exports = mongoose.model('SaleOrder', SaleOrderSchema)
