const mongoose = require('mongoose')

const MenuSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  recipe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe',
    required: true,
  },
  image: { type: String, required: true },
})

module.exports = mongoose.model('Menu', MenuSchema)
