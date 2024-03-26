const cloudinary = require('../utils/cloudinary.js')
const { CloudinaryStorage } = require('multer-storage-cloudinary')

const express = require('express')
const router = express.Router()
const multer = require('multer')
const Product = require('../models/Product.js')

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products',
  },
})

const parser = multer({ storage: storage })
router.post('/createProduct', parser.single('image'), async (req, res) => {
  const { productname, type, price, quantity } = req.body
  const imageUrl = req.file.path

  try {
    const product = await Product.create({
      productname,
      type,
      price: Number(price),
      image: {
        url: imageUrl,
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
