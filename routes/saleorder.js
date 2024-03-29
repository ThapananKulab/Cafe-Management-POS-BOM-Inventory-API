const express = require('express')
const router = express.Router()
const SaleOrder = require('../models/SaleOrder.js')

router.post('/saleOrders', async (req, res) => {
  try {
    const { user, items, total, status, paymentMethod, notes } = req.body

    const newOrder = new SaleOrder({
      user,
      items,
      total,
      status,
      paymentMethod,
      notes,
    })

    // Save the new order to the database
    const savedOrder = await newOrder.save()

    res.status(201).json(savedOrder) // Respond with the created order
  } catch (error) {
    console.error('Error creating order:', error)
    res.status(500).json({ error: 'Internal Server Error' })
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

router.post('/orders', async (req, res) => {
  try {
    const { orderNumber, user, items, total, status, paymentMethod, notes } =
      req.body

    // Create a new SaleOrder document
    const newOrder = new SaleOrder({
      orderNumber,
      user,
      items,
      total,
      status,
      paymentMethod,
      notes,
    })

    // Save the new order to the database
    const savedOrder = await newOrder.save()

    res.status(201).json(savedOrder) // Respond with the created order
  } catch (error) {
    console.error('Error creating order:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

module.exports = router
