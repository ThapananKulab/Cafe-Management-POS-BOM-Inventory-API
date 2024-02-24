const mongoose = require('mongoose');
const CategorySchema = new mongoose.Schema({
    categoryname: String,
    description:String,
});

module.exports = mongoose.model('Category',CategorySchema);
