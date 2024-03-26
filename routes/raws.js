const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const Raw = require('../models/raw.js')

router.get('/:id', (req, res, next) => {
  //find products
  Raw.findById(req.params.id)
    .then((raw) => {
      res.json(raw)
    })
    .catch((err) => {
      next(err)
    })
})

router.post('/', (req, res, next) => {
  //Create products
  Raw.create(req.body)
    .then((raw) => {
      res.json(raw)
    })
    .catch((err) => {
      next(err)
    })
})

router.put('/:id', (req, res, next) => {
  //update products
  Raw.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .then((updatedRaw) => {
      res.json(updatedRaw)
    })
    .catch((err) => {
      next(err)
    })
})

router.delete('/:id', (req, res, next) => {
  // delete products
  Raw.findByIdAndDelete(req.params.id)
    .then((deletedRaw) => {
      if (!deletedRaw) {
        return res.status(404).json({ error: 'ไม่เจอวัตถุดิบ' })
      }
      res.json({ message: 'สินค้าถูกลบเรียบร้อยแล้ว', deletedRaw })
    })
    .catch((err) => {
      next(err)
    })
})

// router.get('/', (req, res, next) => { //get ข้อมูลทั้งหมด
//   Raw.find()
//     .then(raws => {
//       res.json(raws);
//     })
//     .catch(err => {
//       next(err);
//     });
// });

router.get('/', (req, res, next) => {
  //read
  Raw.find()
    .exec()
    .then((raws) => {
      res.json(raws)
    })
    .catch((err) => {
      next(err)
    })
})

//with web
router.get('/delete/:id', (req, res, next) => {
  Raw.findByIdAndDelete(req.params.id)
    .then((deletedProduct) => {
      res.redirect('/raw')
    })
    .catch((err) => {
      next(err)
    })
})

router.post('/insert', (req, res, next) => {
  //Create products
  Raw.create(req.body)
    .then((raw) => {
      res.redirect('/raw')
    })
    .catch((err) => {
      next(err)
    })
})

router.put('/update/:id', (req, res, next) => {
  Raw.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .then((updatedRaw) => {
      res.json(updatedRaw)
    })
    .catch((err) => {
      next(err)
    })
})

router.post('/update', (req, res, next) => {
  Raw.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .then((updatedRaw) => {
      res.redirect('/raw')
    })
    .catch((err) => {
      next(err)
    })
})

//api CRUD with User

router.post('/insertU', (req, res, next) => {
  //Create products
  Raw.create(req.body)
    .then((raw) => {
      res.redirect('/raw')
    })
    .catch((err) => {
      next(err)
    })
})

router.get('/deleteU/:id', (req, res, next) => {
  //delete raw
  Raw.findByIdAndDelete(req.params.id)
    .then((deletedProduct) => {
      res.redirect('/raw')
    })
    .catch((err) => {
      next(err)
    })
})

router.post('/editU/:id', async (req, res) => {
  try {
    const rawId = req.params.id
    const editrawId = req.body.editraw_id
    const updatedRaw = await Raw.findOneAndUpdate(
      { _id: rawId },
      { $set: { id: editrawId } },
      { new: true }
    ).exec()

    if (!updatedRaw) {
      return res.status(404).send('Raw not found')
    }

    res.redirect(`/editrawU?id=${updatedRaw._id}`)
  } catch (err) {
    console.error(err)
    res.status(500).send('Internal Server Error')
  }
})

router.post('/updateU', async (req, res, next) => {
  try {
    const update_id = req.body.update_id
    const data = {
      rawname: req.body.rawname,
      rawquantity: req.body.rawquantity,
      rawunit: req.body.rawunit,
      rawunitprice: req.body.rawunitprice,
    }
    console.log(update_id)
    console.log(data)
    await Raw.findByIdAndUpdate(update_id, data, { useFindAndModify: false })
    res.redirect('/raw')
  } catch (err) {
    console.error('Error updating product:', err)
    res.status(500).send('Internal Server Error')
  }
})

router.post('/insertReact', async (req, res) => {
  const { rawname, rawquantity, rawunit, rawunitprice } = req.body

  try {
    const newRaw = new Raw({
      rawname,
      rawquantity,
      rawunit,
      rawunitprice,
    })

    const savedRaw = await newRaw.save()

    res.json({
      success: true,
      message: `เพิ่ม ${rawname} สำเร็จ`,
      data: savedRaw,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

router.post('/updateRaw/:rawId', async (req, res) => {
  const rawId = req.params.rawId
  const { rawname, rawquantity, rawunit, rawunitprice } = req.body
  const data = {
    rawname,
    rawquantity,
    rawunit,
    rawunitprice,
  }

  try {
    const updatedRaw = await Raw.findByIdAndUpdate(rawId, data, {
      new: true,
      runValidators: true,
    })

    if (!updatedRaw) {
      return res.status(404).send('Raw material not found')
    }

    res.json(updatedRaw)
  } catch (err) {
    console.error('Error updating raw material:', err)
    res.status(500).send('Internal Server Error')
  }
})

module.exports = router
