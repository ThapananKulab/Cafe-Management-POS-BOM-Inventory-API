// อย่าลืมนำเข้า mongoose และกำหนด schema ของคุณ
const mongoose = require('mongoose')

const inventoryItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  unit: {
    type: String,
    required: true,
    enum: ['กรัม', 'มิลลิลิตร', 'ชิ้น', 'ซอง'],
  },
  quantityInStock: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
})

// เพิ่ม method สำหรับการปรับปรุงสต็อก
inventoryItemSchema.methods.adjustStock = async function (amount) {
  this.quantityInStock += amount // เพิ่มหรือลดสต็อกตามค่า amount ที่ส่งเข้ามา
  await this.save() // บันทึกการเปลี่ยนแปลงลงในฐานข้อมูล
}

module.exports = mongoose.model('InventoryItem', inventoryItemSchema)
