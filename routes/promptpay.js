const express = require('express')
const router = express.Router()
const PromptPay = require('../models/PromptPay')

router.post('/addOrUpdate', async (req, res) => {
  try {
    const { id, phoneNumber } = req.body
    if (!id) {
      throw new Error('ID is required')
    }
    const updatedPromptPay = await PromptPay.findByIdAndUpdate(
      id,
      { phoneNumber },
      { new: true }
    )

    if (!updatedPromptPay) {
      throw new Error('PromptPay not found')
    }

    res.status(200).json(updatedPromptPay)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.get('/all', async (req, res) => {
  try {
    const promptPayData = await PromptPay.find({}, { phoneNumber: 1, _id: 0 }) // แสดงเฉพาะ phoneNumber และไม่แสดง _id
    let phoneNumbers = promptPayData.map((data) => data.phoneNumber) // ดึงเฉพาะ phoneNumber จากข้อมูล

    // นำหมายเลขโทรศัพท์มารวมเป็นข้อความเดียวๆ
    const combinedPhoneNumbers = phoneNumbers.join(', ')

    res.json(combinedPhoneNumbers) // ส่งกลับข้อมูลในรูปแบบข้อความเดี่ยวๆ
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
