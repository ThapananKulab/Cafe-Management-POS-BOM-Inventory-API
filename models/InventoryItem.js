const mongoose = require("mongoose");

const inventoryItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: [
      "ถุง",
      "กระปุก",
      "ทั่วไป",
      "กระป๋อง",
      "แก้ว",
      "ทั่วไป",
      "ขวด",
      "ถัง",
    ],
  },
  unit: {
    type: String,
    enum: ["กรัม", "มิลลิลิตร", "ชิ้น", "ซอง", "ทั่วไป"],
  },
  // received: { type: Date, default: Date.now },
  realquantity: { type: Number, required: true },
  quantityInStock: { type: Number, required: true },
  useInStock: { type: Number, required: true, default: 0 },
  unitPrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ["available", "unavailable", "pending"],
    default: "available",
  },
});

inventoryItemSchema.methods.adjustStock = async function (amount) {
  this.quantityInStock += amount;
  await this.save();
};

module.exports = mongoose.model("InventoryItem", inventoryItemSchema);
