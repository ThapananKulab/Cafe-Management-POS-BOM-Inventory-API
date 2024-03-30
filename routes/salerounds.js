const express = require('express')
const router = express.Router()
const SaleRound = require('../models/saleRounds')

router.post('/open', async (req, res) => {
  const { openingTime } = req.body
  const newSaleRound = new SaleRound({
    isOpen: true,
    openedAt: openingTime ? new Date(openingTime) : new Date(),
  })

  try {
    const result = await newSaleRound.save()
    res.status(200).json({ message: 'Sale round opened successfully', result })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error opening sale round' })
  }
})

router.post('/close', async (req, res) => {
  try {
    const saleRound = await SaleRound.findOne({ isOpen: true }).sort({
      openedAt: -1,
    })

    if (!saleRound) {
      return res.status(404).json({ message: 'No open sale round found.' })
    }
    saleRound.isOpen = false
    saleRound.closedAt = new Date()
    await saleRound.save()
    res
      .status(200)
      .json({ message: 'Sale round closed successfully.', saleRound })
    console.log('Received closing time:', req.body)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error closing sale round.' })
  }
})

router.get('/status', async (req, res) => {
  try {
    // ค้นหารอบขายล่าสุด
    const saleRound = await SaleRound.findOne().sort({ openedAt: -1 })

    if (!saleRound) {
      return res.status(404).json({ message: 'No sale round found.' })
    }

    // ส่งค่าสถานะกลับ
    const status = {
      isOpen: saleRound.isOpen,
      openedAt: saleRound.openedAt,
      closedAt: saleRound.closedAt,
    }

    res
      .status(200)
      .json({ message: 'Sale round status fetched successfully.', status })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error fetching sale round status.' })
  }
})

module.exports = router
