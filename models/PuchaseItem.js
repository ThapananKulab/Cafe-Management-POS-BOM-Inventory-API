const mongoose = require('mongoose')

const purchaseReceiptSchema = new mongoose.Schema({
  items: [
    {
      item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InventoryItem',
        required: true,
      },
      name: { type: Number },
      quantity: { type: Number },
      unitPrice: { type: Number },
    },
  ],
  total: {
    type: Number,
    required: true,
  },
  receivedAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model('PurchaseReceipt', purchaseReceiptSchema)
