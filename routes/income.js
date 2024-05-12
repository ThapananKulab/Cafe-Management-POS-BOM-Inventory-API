const express = require('express')
const router = express.Router()
const IncomeReport = require('../models/Income')
const Expenses = require('../models/Expenses')
const PurchaseReceipt = require('../models/PuchaseItem')
const SaleOrder = require('../models/SaleOrder') // Import SaleOrder model

// GET all sale orders
router.get('/sale-orders', async (req, res) => {
  try {
    const saleOrders = await SaleOrder.find({ status: 'Completed' }) // Retrieve sale orders with status "Completed" from the database
    res.json(saleOrders) // Send the retrieved sale orders as JSON response
  } catch (error) {
    res.status(500).json({ message: error.message }) // Handle errors
  }
})

// GET all income reports
router.get('/income-reports', async (req, res) => {
  try {
    const incomeReports = await IncomeReport.find()
    res.json(incomeReports)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// GET all expenses
router.get('/expenses', async (req, res) => {
  try {
    const expenses = await Expenses.find()
    res.json(expenses)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// GET all purchase receipts
router.get('/purchase-receipts', async (req, res) => {
  try {
    const purchaseReceipts = await PurchaseReceipt.find()
    res.json(purchaseReceipts)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router
