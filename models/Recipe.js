const mongoose = require('mongoose')

const recipeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ingredients: [
    {
      inventoryItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InventoryItem',
        required: true,
      },
      name: { type: String },
      quantity: { type: Number, required: true },
      realquantity: { type: Number }, // เพิ่ม realquantity
      unitPrice: { type: Number }, // เพิ่ม unitPrice
      type: {
        type: String,
        enum: [
          'ถุง',
          'กระปุก',
          'ทั่วไป',
          'กระป๋อง',
          'แก้ว',
          'ทั่วไป',
          'ขวด',
          'ถัง',
        ],
      },
        unit: {
          type: String,
          enum: ['กรัม', 'มิลลิลิตร', 'ชิ้น', 'ซอง', 'ทั่วไป'],
        },
    },
  ],
  cost: { type: Number },
})

module.exports = mongoose.model('Recipe', recipeSchema)
