const cloudinary = require('../utils/cloudinary.js')
const express = require('express')
const router = express.Router()
const multer = require('multer')
const User = require('../models/User.js')

const storage = multer.diskStorage({})
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


router.post('/update-profile', parser.single('image'), async (req, res) => {
  const updateP_id = req.body.updateP_id
  const { firstname, lastname, email, phone, address, role } = req.body

  const updateData = {
    ...(firstname && { firstname }),
    ...(lastname && { lastname }),
    ...(email && { email }),
    ...(phone && { phone }),
    ...(address && { address }),
    ...(role && { role }),

    ...(req.file && { image: req.file.path }),
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(updateP_id, updateData, {
      new: true,
      runValidators: true,
    })

    if (!updatedUser) {
      return res.status(404).send('User not found')
    }

    res.json(updatedUser)
  } catch (err) {
    console.error('Error updating user:', err)
    res.status(500).send('Internal Server Error')
  }
})

module.exports = router
