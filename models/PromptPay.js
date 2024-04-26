const mongoose = require('mongoose')
const Schema = mongoose.Schema

const PromptPaySchema = new Schema({
  phoneNumber: {
    type: String,
    required: true,
  },
})

module.exports = mongoose.model('PromptPay', PromptPaySchema)
