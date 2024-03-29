const mongoose = require('mongoose')

const MenuSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  sweetLevel: {
    type: String,
    required: true,
    enum: ['ปกติ', 'หวานน้อย', 'หวานมาก'], // กำหนดระดับความหวาน
  },
  recipe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe',
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['ร้อน', 'เย็น', 'ปั่น'],
  },
  image: { type: String, required: true },
})

module.exports = mongoose.model('Menu', MenuSchema)
