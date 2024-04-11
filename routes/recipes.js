const express = require('express')
const router = express.Router()
const Recipe = require('../models/Recipe.js')
const Menu = require('../models/Menu.js')

//
router.get('/all', async (req, res) => {
  try {
    const recipes = await Recipe.find({}).populate(
      'ingredients.inventoryItemId'
    )
    res.json(recipes)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.post('/add', async (req, res) => {
  console.log(req.body) // Debug

  const recipe = new Recipe({
    name: req.body.name,
    ingredients: req.body.ingredients,
    cost: req.body.cost, // เพิ่มฟิลด์ cost
  })

  try {
    const newRecipe = await recipe.save()
    res.status(201).json(newRecipe)
  } catch (err) {
    console.error(err)
    res.status(400).json({ message: err.message })
  }
})

router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params
    const isUsedInMenu = await Menu.exists({ recipe: id })
    if (isUsedInMenu) {
      return res.status(400).json({
        message: 'The recipe is used in a menu and cannot be deleted.',
      })
    }
    const deletedRecipe = await Recipe.findByIdAndDelete(id)
    if (!deletedRecipe) {
      return res
        .status(404)
        .json({ message: 'Recipe not found with the specified ID.' })
    }

    res
      .status(200)
      .json({ message: 'Recipe deleted successfully.', recipe: deletedRecipe })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.put('/update/:id', async (req, res) => {
  const { id } = req.params
  const { name, ingredients, cost } = req.body // เพิ่มการรับค่า cost จากบอดี้

  try {
    const updatedRecipe = await Recipe.findByIdAndUpdate(
      id,
      { name, ingredients, cost }, // เพิ่มการอัปเดต cost ด้วย
      { new: true }
    ).populate('ingredients.inventoryItemId')

    if (!updatedRecipe) {
      return res.status(404).json({ message: 'No recipe found with that ID.' })
    }

    res
      .status(200)
      .json({ message: 'Recipe updated successfully.', recipe: updatedRecipe })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router
