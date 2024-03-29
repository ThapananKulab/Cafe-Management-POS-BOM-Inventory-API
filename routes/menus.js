const express = require('express')
const router = express.Router()
const Menu = require('../models/Menu.js')
const cloudinary = require('../utils/cloudinary.js')
const multer = require('multer')

const storage = multer.diskStorage({})
const parser = multer({ storage: storage })

router.post('/addMenu', parser.single('image'), async (req, res) => {
  const { name, description, price, sweetLevel, type, recipe } = req.body

  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: 'No image file provided.' })
  }

  const imageUrl = req.file.path

  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'menus',
    })

    const menuItem = new Menu({
      name,
      description,
      price,
      sweetLevel,
      type,
      recipe,
      image: result.secure_url,
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

router.get('/allMenus', async (req, res) => {
  try {
    const menuItems = await Menu.find().populate('recipe')
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

router.put('/:id', parser.single('image'), async (req, res) => {
  const { id } = req.params
  const { name, description, price, sweetLevel, type, recipe } = req.body

  try {
    let updatedData = {
      name,
      description,
      price,
      sweetLevel, // Ensure this is included
      type, // Ensure this is included
      recipe,
    }
    if (req.file) {
      const imageUrl = req.file.path
      const result = await cloudinary.uploader.upload(imageUrl, {
        folder: 'menus',
      })
      updatedData.image = result.secure_url
    }

    const updatedItem = await Menu.findByIdAndUpdate(id, updatedData, {
      new: true,
    })

    if (!updatedItem) {
      return res
        .status(404)
        .json({ success: false, message: 'Menu item not found' })
    }

    res.json({
      success: true,
      message: 'Menu item updated successfully',
      menuItem: updatedItem,
    })
  } catch (error) {
    console.error(error)
    res
      .status(500)
      .json({ success: false, message: 'Error updating menu item' })
  }
})

router.get('/menu/:id', async (req, res) => {
  const { id } = req.params // Extract the ID from the request parameters

  try {
    const menuItem = await Menu.findById(id).populate('recipe') // Assuming 'recipe' is a reference in your Menu model that you want populated

    if (!menuItem) {
      return res
        .status(404)
        .json({ success: false, message: 'Menu item not found' })
    }

    res.status(200).json(menuItem)
  } catch (error) {
    console.error(error)
    res
      .status(500)
      .json({ success: false, message: 'Error fetching menu item details' })
  }
})

module.exports = router
