const cloudinary = require('../utils/cloudinary.js')
const express = require('express')
const router = express.Router()
const multer = require('multer')
const User = require('../models/User.js')

const storage = multer.diskStorage({}) // You can customize this storage as needed
const parser = multer({ storage: storage })

router.post('/add-user', parser.single('image'), async (req, res) => {
  const {
    username,
    password,
    firstname,
    lastname,
    email,
    phone,
    address,
    role,
  } = req.body
  const imageUrl = req.file ? req.file.path : ''

  try {
    const existingUser = await User.findOne({ username })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว โปรดเลือกชื่อผู้ใช้อื่น',
        data: null,
      })
    }

    const folder = 'users' // Specify the folder here
    const result = await cloudinary.uploader.upload(imageUrl, { folder }) // Upload with folder parameter

    const newUser = new User({
      username,
      password,
      firstname,
      lastname,
      email,
      phone,
      address,
      role,
      image: result.secure_url,
    })
    const savedUser = await newUser.save()

    res.json({
      success: true,
      message: `User registration successful for ${username}`,
      data: savedUser,
    })
  } catch (error) {
    console.error(error)
    res
      .status(500)
      .json({ success: false, message: 'Server error', data: null })
  }
})

module.exports = router
