const mongoose = require('mongoose')

const stockOutSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryItem',
    required: true,
  },
  quantity: { type: Number, required: true },
  date: { type: Date, default: Date.now },
})


module.exports = mongoose.model('StockOut', stockOutSchema)
