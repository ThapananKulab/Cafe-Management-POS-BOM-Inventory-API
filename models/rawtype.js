const mongoose = require('mongoose');
const RawtypeSchema = new mongoose.Schema({
    raw_typename: String,
});
module.exports = mongoose.model('Rawtype',RawtypeSchema);
