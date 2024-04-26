const mongoose = require('mongoose')

const PhoneSchema = new mongoose.Schema({
  phoneNumber: { type: String, unique: true },
})

module.exports = mongoose.model('phonenumber', PhoneSchema)
