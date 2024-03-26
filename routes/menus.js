const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const Menu = require('../models/Menu.js')
const cloudinary = require('../utils/cloudinary.js')
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const multer = require('multer')

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'menus',
  },
})

const parser = multer({ storage: storage })

router.post('/addMenu', parser.single('image'), async (req, res) => {
  const { name, description, price, recipe } = req.body

  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: 'No image file provided.' })
  }

  const imageUrl = req.file.path

  try {
    const menuItem = new Menu({
      name,
      description,
      price,
      recipe,
      image: imageUrl,
    })

    const savedItem = await menuItem.save()
    res.status(201).json({
      success: true,
      menuItem: savedItem,
    })
  } catch (error) {
    console.error(error)
    res.status(400).json({ success: false, message: 'Error adding menu item' })
  }
})

module.exports = router

router.get('/allMenus', async (req, res) => {
  try {
    const menuItems = await Menu.find().populate('recipe') // Use .populate('recipe') if you want to include recipe details based on the recipe ID
    res.status(200).json(menuItems)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// DELETE a menu item by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const deletedItem = await Menu.findByIdAndDelete(id)

    if (!deletedItem) {
      return res
        .status(404)
        .json({ success: false, message: 'Menu item not found' })
    }

    // Optionally, you can also delete the associated image from Cloudinary here
    // if you store the public_id from Cloudinary in your Menu model
    // await cloudinary.uploader.destroy(deletedItem.cloudinaryPublicId);

    res.json({
      success: true,
      message: 'Menu item deleted successfully',
      deletedItem: deletedItem,
    })
  } catch (error) {
    console.error(error)
    res
      .status(500)
      .json({ success: false, message: 'Error deleting menu item' })
  }
})

router.get('/checkName', async (req, res) => {
  try {
    const { name } = req.query // รับชื่อเมนูจาก query parameter
    const menuItem = await Menu.findOne({ name }) // ค้นหาเมนูที่มีชื่อตรงกับที่ระบุ

    if (menuItem) {
      // ถ้าพบเมนูนี้ในฐานข้อมูล
      res.json({
        exists: true,
        message: 'A menu item with this name already exists.',
      })
    } else {
      // ถ้าไม่พบ
      res.json({ exists: false, message: 'Name is available.' })
    }
  } catch (error) {
    console.error(error)
    res
      .status(500)
      .json({ success: false, message: 'Error checking menu name' })
  }
})

module.exports = router
