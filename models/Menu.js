const mongoose = require('mongoose')

const MenuSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  sweetLevel: {
    type: String,
    required: true,
    enum: ['ปกติ', 'หวานน้อย', 'หวานมาก', 'ทั่วไป'],
  },
  recipe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe',
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['ร้อน', 'เย็น', 'ปั่น', 'ทั่วไป'],
  },
  image: { type: String, required: true },
  cost: { type: Number },
  glassSize: {
    type: String,
    enum: ['เล็ก', 'กลาง', 'ใหญ่'],
  },
})

module.exports = mongoose.model('Menu', MenuSchema)
