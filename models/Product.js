const mongoose = require('mongoose')
const moment = require('moment-timezone')

const ProductSchema = new mongoose.Schema({
  productname: String,
  type: String,
  price: Number,
  image: {
    url: String, // แก้ไขจาก String เป็น Object ที่มีคีย์ url
  },
  quantity: Number,
  created: {
    type: Date,
    default: () => moment().tz('Asia/Bangkok').toDate(),
  },
})

module.exports = mongoose.model('Product', ProductSchema)
