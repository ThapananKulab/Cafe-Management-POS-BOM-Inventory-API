const express = require('express')
const router = express.Router()
const Product = require('../models/Product.js')
const cloudinary = require('../utils/cloudinary.js') // Import Cloudinary SDK
const multer = require('multer')

// Multer setup
const storage = multer.diskStorage({}) // You can customize this storage as needed
const parser = multer({ storage: storage })

router.post('/createProduct', parser.single('image'), async (req, res) => {
  const { productname, type, price, quantity } = req.body

  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: 'No image file provided.' })
  }

  const imageUrl = req.file.path

  try {
    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(imageUrl, { folder: 'products' })

    // Create product in database
    const product = await Product.create({
      productname,
      type,
      price: Number(price),
      image: {
        url: result.secure_url, // Use secure_url from Cloudinary upload result
      },
      quantity: Number(quantity),
    })

    res.status(201).json({
      success: true,
      product,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Error creating product' })
  }
})

module.exports = router
