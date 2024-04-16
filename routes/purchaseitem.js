const express = require('express')
const router = express.Router()
const PurchaseReceipt = require('../models/PuchaseItem.js')
const InventoryItem = require('../models/InventoryItem.js')

router.post('/add-to-inventory', async (req, res) => {
  try {
    const { purchaseReceiptId } = req.body

    const purchaseReceipt = await PurchaseReceipt.findById(purchaseReceiptId)
    if (!purchaseReceipt) {
      return res.status(404).json({ message: 'Purchase receipt not found' })
    }

    for (const item of purchaseReceipt.items) {
      const { item: itemId, quantity, realquantity } = item

      if (
        typeof quantity !== 'number' ||
        typeof realquantity !== 'number' ||
        isNaN(quantity) ||
        isNaN(realquantity)
      ) {
        console.error(
          `Invalid quantity or realquantity for item with ID: ${itemId}`
        )
        continue
      }

      await InventoryItem.findByIdAndUpdate(
        itemId,
        { $inc: { quantityInStock: quantity * realquantity } },
        { upsert: true, new: true }
      )
    }

    res.status(201).json({ message: 'Items added to inventory successfully' })
  } catch (error) {
    console.error('Error adding items to inventory:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

router.post('/add', async (req, res) => {
  try {
    const { items, supplier } = req.body
    const total = items.reduce(
      (acc, item) => acc + item.quantity * item.unitPrice,
      0
    )
    const purchaseReceipt = new PurchaseReceipt({
      items,
      total,
      supplier,
    })
    await purchaseReceipt.save()
    items.forEach(async (item) => {
      const inventoryItem = await InventoryItem.findById(item._id)
      if (inventoryItem) {
        inventoryItem.quantityInStock += item.quantity
        await inventoryItem.save()
      }
    })

    res.status(201).json(purchaseReceipt)
  } catch (error) {
    console.error('Error creating purchase receipt:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

router.get('/purchase-receipts', async (req, res) => {
  try {
    const purchaseReceipts = await PurchaseReceipt.find()
    res.json(purchaseReceipts)
  } catch (error) {
    console.error('Error fetching purchase receipts:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

router.get('/all', async (req, res) => {
  try {
    const receipts = await PurchaseReceipt.find().populate('items.item')
    res.json(receipts)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
