const mongoose = require('mongoose');
const moment = require('moment-timezone');


const ProductSchema = new mongoose.Schema({
    productname: String,
    type: String,
    price: Number,
    image: String,
    created: {
        type: Date,
        default: () => moment().tz('Asia/Bangkok').toDate(),
    },
});

module.exports = mongoose.model('Product', ProductSchema);
