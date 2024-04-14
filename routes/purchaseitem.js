const express = require('express')
const router = express.Router()
const PurchaseReceipt = require('../models/PuchaseItem.js')
const InventoryItem = require('../models/InventoryItem.js')

router.post('/add', async (req, res) => {
  try {
    const { items } = req.body

    // คำนวณ total โดยคูณจำนวนและราคาต่อหน่วยของแต่ละรายการ
    const total = items.reduce(
      (acc, item) => acc + item.quantity * item.unitPrice,
      0
    )

    // บันทึกข้อมูลการสั่งซื้อ
    const purchaseReceipt = new PurchaseReceipt({
      items,
      total,
    })

    // บันทึกลงในฐานข้อมูล
    await purchaseReceipt.save()

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
