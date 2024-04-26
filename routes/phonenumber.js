const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const Phone = require('../models/PhoneNumber.js')

router.post('/add', async (req, res) => {
  try {
    const { phoneNumber } = req.body
    if (!phoneNumber) {
      throw new Error('Phone number is required')
    }
    const newPhone = new Phone({ phoneNumber })
    await newPhone.save()
    res.status(201).json(newPhone)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.get('/all', async (req, res) => {
  try {
    const phones = await Phone.find()
    res.json(phones)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/delete/:id', async (req, res) => {
  try {
    const phoneId = req.params.id
    const deletedPhone = await Phone.findByIdAndDelete(phoneId)
    if (!deletedPhone) {
      return res.status(404).json({ error: 'Phone number not found' })
    }
    res.json({ message: 'Phone number deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
