const mongoose = require('mongoose');
const TypeproSchema = new mongoose.Schema({
    p_typename: String,
});

module.exports = mongoose.model('Typepro', TypeproSchema);
