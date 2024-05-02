const mongoose = require("mongoose");

const ExpensesSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ["ค่าเช่าพื่นที่", "ค่าพนักงาน", "อื่นๆ"],
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Expenses", ExpensesSchema);
