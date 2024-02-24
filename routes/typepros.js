const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Typepro = require('../models/typepro.js');

router.post('/insertU', async (req, res, next) => { //with thunder client
  try {
    const post = await Typepro.create(req.body);
    res.redirect('/product');
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => { //with thunder client
  try {
    const post = await Typepro.create(req.body);
    res.json(post);
  } catch (err) {
    next(err);
  }
});

router.get('/', (req, res, next) => { //read
  Typepro.find().exec()
      .then(Typepro => {
        res.json(Typepro);
      })
      .catch(err => {
        next(err);
      });
  });

router.get('/deleteU/:id', async (req, res, next) => {
  try {
    const deletedTypepro = await Typepro.findByIdAndDelete(req.params.id);
    if (!deletedTypepro) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    next(err);
  }
});

  



  module.exports = router;
  