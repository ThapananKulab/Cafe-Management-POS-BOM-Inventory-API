const express = require('express')
const router = express.Router()
const moment = require('moment-timezone')
const SaleOrder = require('../models/SaleOrder.js')
const InventoryItem = require('../models/InventoryItem')

router.post('/:orderId/deductStock', async (req, res) => {
  const { orderId } = req.params

  try {
    const saleOrder = await SaleOrder.findById(orderId).populate({
      path: 'items.menuItem',
      populate: {
        path: 'recipe',
        model: 'Recipe',
      },
    })

    if (!saleOrder) {
      return res.status(404).json({ message: 'Sale order not found.' })
    }

    for (const item of saleOrder.items) {
      const menuItem = item.menuItem

      if (!menuItem.recipe || !menuItem.recipe.ingredients) {
        continue
      }

      for (const ingredient of menuItem.recipe.ingredients) {
        const inventoryItem = await InventoryItem.findById(
          ingredient.inventoryItemId
        )

        if (!inventoryItem) {
          console.warn(
            `Inventory item not found for ID: ${ingredient.inventoryItemId}`
          )
          continue
        }

        const quantityUsed = ingredient.quantity * item.quantity
        const newQuantityInStock = inventoryItem.quantityInStock - quantityUsed

        // Check if the new quantity is valid
        if (newQuantityInStock < 0) {
          return res.status(400).json({
            message: `Not enough stock for item ID: ${ingredient.inventoryItemId}.`,
          })
        }
        inventoryItem.quantityInStock = newQuantityInStock
        inventoryItem.useInStock += quantityUsed // Update useInStock to reflect usage
        await inventoryItem.save()
      }
    }

    res.status(200).json({ message: 'Stock deducted successfully.' })
  } catch (error) {
    console.error('Error deducting stock:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})
router.post('/saleOrders', async (req, res) => {
  try {
    const { user, items, total, status, paymentMethod, notes, change } =
      req.body

    const newOrder = new SaleOrder({
      user,
      items,
      total,
      status,
      paymentMethod,
      notes,
      change,
    })

    const savedOrder = await newOrder.save()

    res.status(201).json(savedOrder)
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

router.get('/dashboard/saleOrders', async (req, res) => {
  try {
    const saleOrders = await SaleOrder.find({
      status: { $nin: ['Pending', 'Cancelled'] },
    })
    const numberOfOrders = saleOrders.length
    res.json({ numberOfOrders, saleOrders })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get('/all/saleOrders', async (req, res) => {
  try {
    const saleOrders = await SaleOrder.find()
    const numberOfOrders = saleOrders.length // นับจำนวนออเดอร์ทั้งหมด
    res.json({ numberOfOrders, saleOrders }) // ส่งกลับจำนวนออเดอร์และข้อมูลออเดอร์ทั้งหมด
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get('/dashboard/dailySales', async (req, res) => {
  try {
    const asiaBangkokTimezone = 'Asia/Bangkok'
    const today = new Date()
    const asiaBangkokToday = new Date(
      today.toLocaleString('en-US', { timeZone: asiaBangkokTimezone })
    )

    const startOfDay = new Date(asiaBangkokToday)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(asiaBangkokToday)
    endOfDay.setHours(23, 59, 59, 999)

    // ค้นหายอดขายในช่วงเวลาที่กำหนด
    const dailySales = await SaleOrder.aggregate([
      {
        $match: {
          status: { $nin: ['Pending', 'Cancelled'] },
          date: { $gte: startOfDay, $lte: endOfDay },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
        },
      },
    ])

    if (dailySales.length === 0) {
      return res.status(404).json({ message: 'No sales found for today' })
    }

    res.json({ totalSales: dailySales[0].totalSales })
  } catch (error) {
    // จัดการข้อผิดพลาด
    res.status(500).json({ message: error.message })
  }
})

router.get('/dashboard/mostPurchasedMenuItems', async (req, res) => {
  try {
    const orders = await SaleOrder.find({
      status: { $nin: ['Pending', 'Cancelled'] },
    })

    if (orders.length === 0) {
      return res.status(404).json({ message: 'No orders found' })
    }
    const menuItemsMap = new Map()
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const menuItemId = item.menuItem
        const menuItem = item.name
        if (menuItemId && menuItem) {
          if (!menuItemsMap.has(menuItem)) {
            menuItemsMap.set(menuItem, 0)
          }
          menuItemsMap.set(menuItem, menuItemsMap.get(menuItem) + item.quantity)
        }
      })
    })
    const mostPurchasedMenuItemsData = Array.from(menuItemsMap.entries()).map(
      ([name, quantity]) => ({
        name,
        quantity,
      })
    )
    mostPurchasedMenuItemsData.sort((a, b) => b.quantity - a.quantity)
    const top10MostPurchasedMenuItems = mostPurchasedMenuItemsData.slice(0, 10)

    res.json(top10MostPurchasedMenuItems)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get('/saleOrders/currentdate', async (req, res) => {
  try {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const endOfToday = new Date()
    endOfToday.setHours(23, 59, 59, 999)
    const saleOrders = await SaleOrder.find({
      date: {
        $gte: startOfToday,
        $lte: endOfToday,
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

    const newOrder = new SaleOrder({
      orderNumber,
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

router.get('/saleOrders/date/:formattedDate', async (req, res) => {
  try {
    const { formattedDate } = req.params
    const saleOrders = await SaleOrder.find({ date: formattedDate })

    res.json(saleOrders)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get('/saleOrders/date/:formattedDate', async (req, res) => {
  try {
    const { formattedDate } = req.params

    // Convert formattedDate to Date object
    const date = new Date(formattedDate)

    // Set start of the day
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    // Set end of the day
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    // Find orders within the specified date range
    const saleOrders = await SaleOrder.find({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    })

    res.json(saleOrders)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

const checkStockSufficiency = async (orderId) => {
  try {
    // Retrieve the order from the database
    const order = await SaleOrder.findById(orderId)

    // Check if the order exists
    if (!order) {
      console.error('Order not found')
      return false
    }

    for (const item of order.items) {
      const inventoryItem = await InventoryItem.findOne({
        itemId: item.itemId,
      })
      if (!inventoryItem || inventoryItem.quantityInStock < item.quantity) {
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Error checking stock sufficiency:', error)
    return false
  }
}

router.post('/:orderId/accept', async (req, res) => {
  const { orderId } = req.params

  try {
    const isStockSufficient = await checkStockSufficiency(orderId)

    if (!isStockSufficient) {
      const updatedOrder = await SaleOrder.findByIdAndUpdate(
        orderId,
        { status: 'Pending' },
        { new: true }
      )

      return res.status(400).json({
        error: 'วัตถุดิบใน Stock ไม่เพียงพอ',
      })
    }
    const updatedOrder = await SaleOrder.findByIdAndUpdate(
      orderId,
      { status: 'Completed' },
      { new: true }
    )

    // Return the updated order
    res.json(updatedOrder)
  } catch (error) {
    console.error('Error accepting order:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

router.post('/:orderId/cancel', async (req, res) => {
  const { orderId } = req.params

  try {
    // Update order status to 'Cancelled'
    const updatedOrder = await SaleOrder.findByIdAndUpdate(
      orderId,
      { status: 'Cancelled' },
      { new: true }
    )

    res.json(updatedOrder)
  } catch (error) {
    console.error('Error cancelling order:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

router.get('/dashboard/weeklyTotal', async (req, res) => {
  try {
    const currentDate = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Bangkok',
    })
    const currentThaiDate = new Date(currentDate)
    const startOfWeek = new Date(currentThaiDate)
    startOfWeek.setDate(currentThaiDate.getDate() - currentThaiDate.getDay())
    const endOfWeek = new Date(currentThaiDate)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    const weeklyOrders = await SaleOrder.find({
      status: { $nin: ['Pending', 'Cancelled'] },
      date: { $gte: startOfWeek, $lte: endOfWeek },
    })
    const dailySales = {}
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek)
      currentDate.setDate(startOfWeek.getDate() + i)
      dailySales[currentDate.toISOString().slice(0, 10)] = 0
    }
    for (const order of weeklyOrders) {
      const orderDate = new Date(order.date)
      const orderDateISOString = orderDate.toISOString().slice(0, 10)
      dailySales[orderDateISOString] += order.total
    }
    res.json({ dailySales })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get('/dashboard/previousWeeklyTotal', async (req, res) => {
  try {
    const currentDate = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Bangkok',
    })
    const currentThaiDate = new Date(currentDate)

    const startOfPreviousWeek = new Date(currentThaiDate)
    startOfPreviousWeek.setDate(
      currentThaiDate.getDate() - currentThaiDate.getDay() - 7
    )
    const endOfPreviousWeek = new Date(startOfPreviousWeek)
    endOfPreviousWeek.setDate(startOfPreviousWeek.getDate() + 6)

    const previousWeeklyOrders = await SaleOrder.find({
      status: { $nin: ['Pending', 'Cancelled'] },
      date: { $gte: startOfPreviousWeek, $lte: endOfPreviousWeek },
    })

    let previousWeeklyTotalSales = 0
    for (const order of previousWeeklyOrders) {
      previousWeeklyTotalSales += order.total
    }

    res.json({ totalSales: previousWeeklyTotalSales })
  } catch (error) {
    // Handle errors
    res.status(500).json({ message: error.message })
  }
})

router.get('/report/dailySales', async (req, res) => {
  try {
    const currentDate = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Bangkok',
    })
    const currentThaiDate = new Date(currentDate)
    const startOfDay = new Date(currentThaiDate)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(currentThaiDate)
    endOfDay.setHours(23, 59, 59, 999)

    const dailyOrders = await SaleOrder.find({
      status: { $nin: ['Pending', 'Cancelled'] },
      date: { $gte: startOfDay, $lte: endOfDay },
    })

    let totalSales = 0
    for (const order of dailyOrders) {
      totalSales += order.total
    }
    const formattedDate = currentThaiDate.toISOString().slice(0, 10)
    const dailySales = [{ date: formattedDate, totalSales }]
    res.json({ dailySales })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get('/report/weeklySales', async (req, res) => {
  try {
    const currentDate = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Bangkok',
    })
    const currentThaiDate = new Date(currentDate)
    const startOfWeek = new Date(currentThaiDate)
    const currentDayOfWeek = startOfWeek.getDay()
    startOfWeek.setDate(startOfWeek.getDate() - currentDayOfWeek)
    startOfWeek.setHours(0, 0, 0, 0) 

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    const weeklyOrders = await SaleOrder.find({
      status: { $nin: ['Pending', 'Cancelled'] },
      date: { $gte: startOfWeek, $lte: endOfWeek },
    })
    const weeklySales = []
    let totalSales = 0
    for (let i = 0; i <= currentDayOfWeek; i++) {
      const currentDate = new Date(startOfWeek)
      currentDate.setDate(startOfWeek.getDate() + i)
      currentDate.setHours(0, 0, 0, 0)

      const endOfDay = new Date(currentDate)
      endOfDay.setHours(23, 59, 59, 999)

      let dailySales = 0
      for (const order of weeklyOrders) {
        if (order.date >= currentDate && order.date <= endOfDay) {
          dailySales += order.total
          totalSales += order.total
        }
      }
      const formattedDate = currentDate.toISOString().slice(0, 10)
      weeklySales.push({ date: formattedDate, dailySales })
    }

    res.json({ weeklySales, totalSales })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get('report/monthlySales', async (req, res) => {
  try {
    const currentDate = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Bangkok',
    })
    const currentThaiDate = new Date(currentDate)
    const startOfMonth = new Date(currentThaiDate)
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const endOfMonth = new Date(currentThaiDate)
    endOfMonth.setMonth(endOfMonth.getMonth() + 1)
    endOfMonth.setDate(0)
    endOfMonth.setHours(23, 59, 59, 999)

    const monthlyOrders = await SaleOrder.find({
      status: { $nin: ['Pending', 'Cancelled'] },
      date: { $gte: startOfMonth, $lte: endOfMonth },
    })

    let totalSales = 0
    for (const order of monthlyOrders) {
      totalSales += order.total
    }

    res.json({ totalSales })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get('/yearlySales', async (req, res) => {
  try {
    const currentDate = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Bangkok',
    })
    const currentThaiDate = new Date(currentDate)
    const startOfYear = new Date(currentThaiDate)
    startOfYear.setMonth(0)
    startOfYear.setDate(1)
    startOfYear.setHours(0, 0, 0, 0)

    const endOfYear = new Date(currentThaiDate)
    endOfYear.setMonth(11)
    endOfYear.setDate(31)
    endOfYear.setHours(23, 59, 59, 999)
    const yearlyOrders = await SaleOrder.find({
      status: { $nin: ['Pending', 'Cancelled'] },
      date: { $gte: startOfYear, $lte: endOfYear },
    })

    let totalSales = 0
    for (const order of yearlyOrders) {
      totalSales += order.total
    }

    res.json({ totalSales })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router
