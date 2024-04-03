const express = require('express')
const router = express.Router()
const SaleOrder = require('../models/SaleOrder.js')
const InventoryItem = require('../models/InventoryItem')

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

router.post('/:orderId/accept', async (req, res) => {
  const { orderId } = req.params

  try {
    // Update order status to 'Completed'
    const updatedOrder = await SaleOrder.findByIdAndUpdate(
      orderId,
      { status: 'Completed' },
      { new: true }
    )

    res.json(updatedOrder)
  } catch (error) {
    console.error('Error accepting order:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// router.post('/:orderId/accept', async (req, res) => {
//   const { orderId } = req.params

//   try {
//     // Check stock availability
//     const stockDeducted = await deductStock(orderId)

//     if (stockDeducted) {
//       // Update order status to 'Completed' if stock deduction is successful
//       const updatedOrder = await SaleOrder.findByIdAndUpdate(
//         orderId,
//         { status: 'Completed' },
//         { new: true }
//       )
//       res.json(updatedOrder)
//     } else {
//       // หากสต็อกไม่เพียงพอ, แสดงว่าการหักล้างสต็อกล้มเหลว
//       // ไม่มีการอัปเดตสถานะของ Order ในฐานข้อมูล และส่งคืนการแจ้งเตือนผ่าน API response
//       res.status(400).json({ message: 'Stock ไม่เพียงพอ' })
//     }
//   } catch (error) {
//     console.error('Error accepting order:', error)
//     res.status(500).json({ error: 'Internal Server Error' })
//   }
// })

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

// router.post('/saleOrders/:orderId/deductStock', async (req, res) => {
//   const { orderId } = req.params

//   try {
//     // Find the sale order by ID
//     const saleOrder = await SaleOrder.findById(orderId)
//     for (const item of saleOrder.items) {
//       const inventoryItem = await InventoryItem.findById(item.menuItem)

//       // Check if the inventory item exists
//       if (!inventoryItem) {
//         return res.status(404).json({ message: 'Inventory item not found.' })
//       }

//       // Deduct the quantity from the inventory
//       inventoryItem.quantityInStock -= item.quantity
//       inventoryItem.useInStock += item.quantity

//       // Save the updated inventory item
//       await inventoryItem.save()
//     }

//     res.status(200).json({ message: 'Stock deducted successfully.' })
//   } catch (error) {
//     console.error('Error deducting stock:', error)
//     res.status(500).json({ error: 'Internal Server Error' })
//   }
// })

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
        continue // Skip if no recipe or ingredients
      }

      for (const ingredient of menuItem.recipe.ingredients) {
        const inventoryItem = await InventoryItem.findById(
          ingredient.inventoryItemId
        )

        if (!inventoryItem) {
          console.warn(
            `Inventory item not found for ID: ${ingredient.inventoryItemId}`
          )
          continue // Skip if the inventory item is not found
        }

        // Calculate the new quantity in stock and the amount used
        const quantityUsed = ingredient.quantity * item.quantity
        const newQuantityInStock = inventoryItem.quantityInStock - quantityUsed

        // Check if the new quantity is valid
        if (newQuantityInStock < 0) {
          return res.status(400).json({
            message: `Not enough stock for item ID: ${ingredient.inventoryItemId}.`,
          })
        }

        // Update the inventory item
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

// router.post('/:orderId/deductStock', async (req, res) => {
//   const { orderId } = req.params

//   try {
//     const saleOrder = await SaleOrder.findById(orderId).populate({
//       path: 'items.menuItem',
//       populate: {
//         path: 'recipe',
//         model: 'Recipe',
//       },
//     })

//     if (!saleOrder) {
//       return res.status(404).json({ message: 'Sale order not found.' })
//     }

//     for (const item of saleOrder.items) {
//       const menu = item.menuItem

//       if (!menu.recipe) {
//         return res
//           .status(404)
//           .json({ message: 'Recipe not found for menu item.' })
//       }

//       // Loop through ingredients in the recipe
//       for (const ingredient of menu.recipe.ingredients) {
//         console.log(
//           'Searching for inventory item with ID:',
//           ingredient.inventoryItemId
//         )

//         const inventoryItem = await InventoryItem.findById(
//           ingredient.inventoryItemId
//         )
//         if (!inventoryItem) {
//           return res.status(404).json({ message: 'Inventory item not found.' })
//         }

//         inventoryItem.quantityInStock -= ingredient.quantity * item.quantity
//         await inventoryItem.save()
//       }
//     }

//     res.status(200).json({ message: 'Stock deducted successfully.' })
//   } catch (error) {
//     console.error('Error deducting stock:', error)
//     res.status(500).json({ error: 'Internal Server Error' })
//   }
// })

module.exports = router
