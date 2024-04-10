const mongoose = require("mongoose");

const recipeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ingredients: [
    {
      inventoryItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InventoryItem",
        required: true,
      },
      name: { type: String },
      quantity: { type: Number, required: true },
      realquantity: { type: Number }, // เพิ่ม realquantity
      unitPrice: { type: Number }, // เพิ่ม unitPrice
    },
  ],
  cost: { type: Number },
});

module.exports = mongoose.model("Recipe", recipeSchema);
