const express = require('express')
const router = express.Router()
const StockOut = require('../models/StockOut.js')
const PurchaseReceipt = require('../models/PuchaseItem.js')

router.post('/stockout', async (req, res) => {
  try {
    const { purchaseOrderId, items } = req.body
    const purchaseOrder = await PurchaseReceipt.findById(purchaseOrderId)
    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found' })
    }

    const stockOutItems = []
    for (const item of items) {
      const { itemId, quantity } = item
      const stockOutItem = new StockOut({ item: itemId, quantity })
      stockOutItems.push(stockOutItem)
      const updatedItem = await InventoryItem.findByIdAndUpdate(
        itemId,
        { $inc: { quantityInStock: -quantity } },
        { new: true }
      )
      if (!updatedItem) {
        return res.status(404).json({ message: 'Inventory item not found' })
      }
    }

    await StockOut.insertMany(stockOutItems)

    res.status(201).json({ message: 'Stock out successfully created' })
  } catch (error) {
    console.error('Error creating stock out:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

module.exports = router
