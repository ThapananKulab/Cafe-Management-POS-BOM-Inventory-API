const express = require('express')
const router = express.Router()
const Recipe = require('../models/Recipe.js')
const Menu = require('../models/Menu.js')

const { notifyLine } = require("../function/notify.js");
const tokenline = "DWTW5lpLAyy8v2zXVMeKaLenXJZBei9Zs7YXeoDqdxO"

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
  console.log(req.body);
  const { name, ingredients, cost } = req.body;

  const recipe = new Recipe({
    name,
    ingredients,
    cost,
  });

  try {
    const newRecipe = await recipe.save();
    const text = `BOM ชื่อ ${name} ถูกเพิ่ม${cost} บาท ถูกเพิ่มเรียบร้อย`;
    await notifyLine(tokenline, text);
    res.status(201).json(newRecipe);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
});

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
      const text = `ID ${id}, ชื่อ BOM ${deletedRecipe.name} ถูกลบ`;
      await notifyLine(tokenline, text);
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.put('/update/:id', async (req, res) => {
  const { id } = req.params
  const { name, ingredients, cost } = req.body

  try {
    const updatedRecipe = await Recipe.findByIdAndUpdate(
      id,
      { name, ingredients, cost },
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

router.get('/reports/highest-cost-recipes', async (req, res) => {
  try {
    const recipes = await Recipe.find({})
      .sort({ cost: -1 })
      .populate('ingredients.inventoryItemId')

    if (!recipes || recipes.length === 0) {
      return res.status(404).json({ message: 'No recipes found' })
    }

    res.json(recipes)
  } catch (error) {
    console.error('Error fetching highest cost recipes:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

module.exports = router
