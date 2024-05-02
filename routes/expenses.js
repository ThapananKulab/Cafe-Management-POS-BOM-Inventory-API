const express = require("express");
const router = express.Router();
const Expenses = require("../models/Expenses.js");

router.get("/all", async (req, res) => {
  try {
    const expenses = await Expenses.find();
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/add", async (req, res) => {
  const expense = new Expenses({
    description: req.body.description,
    amount: req.body.amount,
    category: req.body.category,
    date: req.body.date,
  });

  try {
    const newExpense = await expense.save();
    res.status(201).json(newExpense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
