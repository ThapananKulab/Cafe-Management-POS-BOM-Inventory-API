const express = require('express')
const router = express.Router()
const Recipe = require('../models/Recipe')
const InventoryItem = require('../models/InventoryItem.js')

router.get('/all', async (req, res) => {
  try {
    const items = await InventoryItem.find()
    res.json(items)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get('/dashboard/all', async (req, res) => {
  try {
    const items = await InventoryItem.find()
    const itemCount = items.length
    res.json({ itemCount })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get('/nearEmpty', async (req, res) => {
  try {
    const nearEmptyItems = await InventoryItem.find({
      quantityInStock: { $lte: 10 },
    })
    res.json(nearEmptyItems)
    console.log(nearEmptyItems)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Add a new inventory item
router.post('/add', async (req, res) => {
  const { name, type, unit, realquantity, quantityInStock, unitPrice } =
    req.body
  const item = new InventoryItem({
    name,
    type,
    unit,
    realquantity,
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
      message: `${item.name} เพิ่มไป ${adjustment}. จำนวนคงเหลือ ${updatedItem.quantityInStock}.`,
    })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

router.patch('/update/:id', async (req, res) => {
  const { id } = req.params
  const { name, type, unit, realquantity, quantityInStock, unitPrice } =
    req.body
  try {
    const updatedItem = await InventoryItem.findByIdAndUpdate(
      id,
      {
        name,
        type,
        unit,
        realquantity,
        quantityInStock,
        unitPrice,
      },
      { new: true }
    )
    if (!updatedItem) {
      return res.status(404).json({ message: 'Inventory item not found.' })
    }
    res.status(200).json(updatedItem)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

router.get('/:id', async (req, res) => {
  console.log(req.params.id) // Check the ID value
  InventoryItem.findById(req.params.id)
    .then((inventoryItem) => {
      res.json(inventoryItem)
    })
    .catch((err) => {
      next(err)
    })
})

router.delete('/inventory/delete/:inventoryItemId', async (req, res) => {
  try {
    const { inventoryItemId } = req.params

    // Check if the inventory item is being used in any recipes
    const isUsedInRecipe = await Recipe.findOne({
      'ingredients.inventoryItemId': inventoryItemId,
    })

    if (isUsedInRecipe) {
      return res.status(400).json({
        message: 'Cannot delete: This inventory item is being used in recipes.',
      })
    }
    const deletedInventoryItem = await InventoryItem.findByIdAndDelete(
      inventoryItemId
    )

    if (!deletedInventoryItem) {
      return res
        .status(404)
        .json({ message: 'No inventory item found with that ID.' })
    }

    res.status(200).json({ message: 'Inventory item deleted successfully.' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.post('/reduce-stock', async (req, res) => {
  const { orderId, quantity } = req.body

  try {
    const inventoryItem = await InventoryItem.findOne({ orderId })

    if (!inventoryItem) {
      return res.status(404).json({ message: 'Inventory item not found' })
    }

    if (inventoryItem.quantityInStock < quantity) {
      return res.status(400).json({ message: 'Not enough stock available' })
    }

    inventoryItem.quantityInStock -= quantity

    await inventoryItem.save()

    res.status(200).json({ message: 'Stock reduced successfully' })
  } catch (error) {
    console.error('Error reducing stock:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// router.patch('/update-order', async (req, res) => {
//   try {
//     const { orderUpdates } = req.body
//     for (const { id, newPosition } of orderUpdates) {
//       console.log(`Updating item ${id} to new order ${newPosition}`)
//       await InventoryItem.findByIdAndUpdate(id, {
//         $set: { order: newPosition },
//       })
//     }

//     res.status(200).json({ message: 'Orders updated successfully' })
//   } catch (error) {
//     res.status(500).json({ message: error.message })
//   }
// })

// router.get('/check-name-exists', async (req, res) => {
//   const { name, excludeId } = req.query

//   try {
//     let query = { name: name }
//     if (excludeId) {
//       query._id = { $ne: mongoose.Types.ObjectId(excludeId) } // Convert to ObjectId
//     }

//     const itemExists = await InventoryItem.findOne(query)
//     if (itemExists) {
//       return res.json({ exists: true })
//     } else {
//       return res.json({ exists: false })
//     }
//   } catch (error) {
//     console.error('Failed to check name existence:', error)
//     res.status(500).json({ error: 'Internal server error' })
//   }
// })

module.exports = router
