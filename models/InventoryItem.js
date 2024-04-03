// อย่าลืมนำเข้า mongoose และกำหนด schema ของคุณ
const mongoose = require('mongoose')

const inventoryItemSchema = new mongoose.Schema({
  // order: { type: Number }, // เพิ่มฟิลด์นี้เพื่อเก็บลำดับ
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['ถุง', 'กระปุก', 'ทั่วไป', 'กระป๋อง', 'แก้ว', 'ทั่วไป'],
  },
  unit: {
    type: String,
    enum: ['กรัม', 'มิลลิลิตร', 'ชิ้น', 'ซอง', 'ทั่วไป'],
  },
  realquantity: { type: Number, required: true },
  quantityInStock: { type: Number, required: true },
  useInStock: { type: Number, required: true, default: 0 },
  unitPrice: { type: Number, required: true },
})

inventoryItemSchema.methods.adjustStock = async function (amount) {
  this.quantityInStock += amount
  await this.save()
}

module.exports = mongoose.model('InventoryItem', inventoryItemSchema)
