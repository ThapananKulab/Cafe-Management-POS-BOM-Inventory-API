const express = require('express')
const router = express.Router()
const InventoryItem = require('../models/InventoryItem.js')

// Fetch all inventory items
router.get('/all', async (req, res) => {
  try {
    const items = await InventoryItem.find()
    res.json(items)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Add a new inventory item
router.post('/add', async (req, res) => {
  const { name, unit, quantityInStock, unitPrice } = req.body
  const item = new InventoryItem({
    name,
    unit,
    quantityInStock,
    unitPrice,
  })

  try {
    const newItem = await item.save()
    res.status(201).json(newItem)
  } catch (error) {
    res.status(400).send(error.message)
  }
})

// Delete an inventory item
router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params
    const deletedItem = await InventoryItem.findByIdAndDelete(id)

    if (!deletedItem) {
      return res.status(404).json({ message: 'No item found with that ID.' })
    }

    res
      .status(200)
      .json({ message: 'Item deleted successfully.', item: deletedItem })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.patch('/update-stock/:id', async (req, res) => {
  const { id } = req.params
  const { adjustment } = req.body

  try {
    const item = await InventoryItem.findById(id)
    if (!item) {
      return res.status(404).json({ message: 'No item found with that ID.' })
    }
    item.quantityInStock += adjustment
    const updatedItem = await item.save()
    res.status(200).json({
      message: `Stock for ${item.name} adjusted by ${adjustment}. New stock is ${updatedItem.quantityInStock}.`,
    })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

module.exports = router
