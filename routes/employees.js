const express = require('express')
const router = express.Router()
const multer = require('multer')
const User = require('../models/User.js')
const cloudinary = require('../utils/cloudinary.js') // Import Cloudinary SDK

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

  try {
    const existingUser = await User.findOne({ username })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว โปรดเลือกชื่อผู้ใช้อื่น',
        data: null,
      })
    }

    let imageUrl = ''
    if (req.file) {
      // Upload image to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, { folder: 'users' })
      imageUrl = result.secure_url
    }

    const newUser = new User({
      username,
      password,
      firstname,
      lastname,
      email,
      phone,
      address,
      role,
      image: imageUrl,
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

    // Check if there is a file uploaded
    ...(req.file && { image: req.file.path }), // If you want to save file path, otherwise, upload to Cloudinary
  }

  try {
    // If there is a file uploaded, upload it to Cloudinary
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, { folder: 'users' })
      updateData.image = result.secure_url
    }

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
////
module.exports = router
