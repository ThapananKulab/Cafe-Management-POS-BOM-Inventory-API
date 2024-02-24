const mongoose = require('mongoose');
const OrderSchema = new mongoose.Schema({
    rawname: String,
    quantity: Number,
    unit: Number,
});

module.exports = mongoose.model('Raw', OrderSchema);
