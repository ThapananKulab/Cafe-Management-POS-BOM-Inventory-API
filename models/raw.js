const mongoose = require('mongoose');
const RawSchema = new mongoose.Schema({
    rawname: String,
    rawquantity: Number,
    rawunit: String,
    rawunitprice:Number,
});

module.exports = mongoose.model('Raw', RawSchema);
