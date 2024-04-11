const express = require('express')
const router = express.Router()
const ChatMessage = require('../models/ChatMessage')
const User = require('../models/User.js')

router.post('/send-message', async (req, res) => {
  try {
    const { senderId, receiverId, message } = req.body
    const newMessage = new ChatMessage({ senderId, receiverId, message })
    await newMessage.save()
    res
      .status(200)
      .json({ success: true, message: 'Message sent successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Failed to send message' })
  }
})

router.get('/get-messages/:userId', async (req, res) => {
  try {
    const userId = req.params.userId
    const messages = await ChatMessage.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    })
      .sort({ timestamp: 1 })
      .populate('senderId')
      .populate('receiverId')
    res.status(200).json({ success: true, messages })
  } catch (error) {
    console.error(error)
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch messages' })
  }
})

module.exports = router
