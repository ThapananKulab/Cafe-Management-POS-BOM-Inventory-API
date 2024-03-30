const mongoose = require('mongoose')

const saleRoundSchema = new mongoose.Schema({
  isOpen: { type: Boolean, required: true },
  openedAt: { type: Date },
  closedAt: { type: Date },
})

module.exports = mongoose.model('SaleRound', saleRoundSchema)
