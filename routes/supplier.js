const express = require('express')
const router = express.Router()
const Supplier = require('../models/Supplier')

router.post('/suppliers', async (req, res) => {
  try {
    const { name, phone, address, email } = req.body
    const supplier = new Supplier({ name, phone, address, email })
    await supplier.save()
    res.status(201).json({ message: 'Supplier added successfully' })
  } catch (error) {
    console.error('Error adding supplier:', error)
    res.status(500).json({ message: 'Failed to add supplier' })
  }
})

router.get('/suppliers', async (req, res) => {
  try {
    const suppliers = await Supplier.find()
    res.status(200).json(suppliers)
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    res.status(500).json({ message: 'Failed to fetch suppliers' })
  }
})

router.delete('/suppliers/:id', async (req, res) => {
  try {
    const supplierId = req.params.id
    await Supplier.findByIdAndDelete(supplierId)
    res.status(200).json({ message: 'Supplier deleted successfully' })
  } catch (error) {
    console.error('Error deleting supplier:', error)
    res.status(500).json({ message: 'Failed to delete supplier' })
  }
})

module.exports = router
