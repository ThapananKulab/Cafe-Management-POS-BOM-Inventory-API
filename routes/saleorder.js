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

router.get('/saleOrders/currentdate', async (req, res) => {
  try {
    // Set the start and end of the current day
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0) // Sets the time to the start of the day

    const endOfToday = new Date()
    endOfToday.setHours(23, 59, 59, 999) // Sets the time to the end of the day

    // Find orders where the date is within the current day
    const saleOrders = await SaleOrder.find({
      date: {
        // Use the 'date' field
        $gte: startOfToday, // Greater than or equal to the start of today
        $lte: endOfToday, // Less than or equal to the end of today
      },
    })

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
