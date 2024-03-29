const express = require('express')
const router = express.Router()
const SaleOrder = require('../models/SaleOrder.js')

router.post('/saleOrders', async (req, res) => {
  try {
    const saleOrder = new SaleOrder(req.body)
    const savedSaleOrder = await saleOrder.save()
    res.status(201).json(savedSaleOrder)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

router.get('/saleOrders', async (req, res) => {
  try {
    const saleOrders = await SaleOrder.find()
    res.json(saleOrders)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router
