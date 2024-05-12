const mongoose = require('mongoose')

const IncomeSchema = new mongoose.Schema({
  expense: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expenses',
    required: true,
  },
  purchaseReceipt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseReceipt',
    required: true,
  },
  saleOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SaleOrder',
    required: true,
  },
})

module.exports = mongoose.model('Income', IncomeSchema)
