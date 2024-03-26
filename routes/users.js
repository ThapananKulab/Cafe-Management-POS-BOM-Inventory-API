const express = require('express')
const router = express.Router()
// const mongoose = require('mongoose');
const User = require('../models/User.js')

router.get('/', (req, res, next) => {
  User.find()
    .then((users) => {
      res.json(users)
    })
    .catch((err) => {
      next(err)
    })
})

router.get('/:id', (req, res, next) => {
  User.findById(req.params.id)
    .then((user) => {
      res.json(user)
    })
    .catch((err) => {
      next(err)
    })
})

router.post('/', (req, res, next) => {
  User.create(req.body)
    .then((user) => {
      res.json(user)
    })
    .catch((err) => {
      next(err)
    })
})

//with web
router.get('/deleteU/:id', (req, res, next) => {
  User.findByIdAndDelete(req.params.id)
    .then((deletedemployee) => {
      res.redirect('/employee')
    })
    .catch((err) => {
      next(err)
    })
})

router.post('/editU/:id', async (req, res) => {
  try {
    const userId = req.params.id
    const editId = req.body.edit_id

    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      { $set: { id: editId } },
      { new: true }
    ).exec()

    if (!updatedUser) {
      return res.status(404).send('User not found')
    }
    res.redirect(`/update-profile-user?id=${updatedUser._id}`) // Changed to redirect to /update-profile-user
  } catch (err) {
    console.error(err)
    res.status(500).send('Internal Server Error')
  }
})

// router.post('/updateU/:id', async (req, res, next) => {
//   const userId = req.params.userId;

//   try {
//     const updatedUser = await User.findByIdAndUpdate(userId, {
//       username: req.body.username,
//       password: req.body.password,
//       firstname: req.body.firstname,
//       lastname: req.body.lastname,
//       email: req.body.email,
//       phone: req.body.phone,
//       address: req.body.address,
//       role: req.body.role,
//     }, { new: true });

//     // Check if the user was found and updated successfully
//     if (!updatedUser) {
//       return res.status(404).send('User not found');
//     }

//     res.status(200).json({ message: 'User updated successfully', user: updatedUser });
//     res.redirect('/editU')
//   } catch (error) {
//     console.error('Error updating user:', error);
//     res.status(500).send('Internal Server Error');
//   }
// });

// Multer configuration
const multer = require('multer')
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/users') // Set the destination folder for uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  },
})
const upload = multer({ storage: storage })
router.post('/insert', upload.single('image'), async (req, res, next) => {
  try {
    console.log('Received form data:', req.body)
    console.log('Received file:', req.file)

    const user = await User.create({
      username: req.body.username,
      password: req.body.password,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      role: req.body.role,
      image: req.file.filename,
    })

    res.redirect('/employee')
  } catch (err) {
    console.error('Error:', err)
    next(err)
  }
})

router.post('/updateU', upload.single('image'), async (req, res, next) => {
  try {
    const updateP_id = req.body.updateP_id
    const data = {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
    }

    if (req.file) {
      data.image = req.file.filename
    }
    console.log(updateP_id)
    console.log(data)

    await User.findByIdAndUpdate(updateP_id, data, { useFindAndModify: false })
    res.redirect('/editprofileU')
  } catch (err) {
    console.error('Error updating product:', err)
    res.status(500).send('Internal Server Error')
  }
})

router.post('/updateA', upload.single('image'), async (req, res, next) => {
  try {
    const updateP_id = req.body.updateP_id
    const data = {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      role: req.body.role,
    }

    if (req.file) {
      data.image = req.file.filename
    }
    console.log(updateP_id)
    console.log(data)

    await User.findByIdAndUpdate(updateP_id, data, { useFindAndModify: false })
    res.redirect('/employee')
  } catch (err) {
    console.error('Error updating product:', err)
    res.status(500).send('Internal Server Error')
  }
})

router.delete('/:id', (req, res, next) => {
  // delete user
  User.findByIdAndDelete(req.params.id)
    .then((deletedUser) => {
      if (!deletedUser) {
        return res.status(404).json({ error: 'ไม่เจอผู้ใช้' })
      }
      res.json({ message: 'ผู้ใช้ถูกลบเรียบร้อยแล้ว', deletedUser })
    })
    .catch((err) => {
      next(err)
    })
})

router.post('/insertReact', upload.single('image'), async (req, res) => {
  const {
    username,
    password,
    firstname,
    lastname,
    email,
    phone,
    address,
    role,
  } = req.body

  try {
    const existingUser = await User.findOne({ username })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว โปรดเลือกชื่อผู้ใช้อื่น',
        data: null,
      })
    }
    const imageName = req.file ? req.file.filename : null

    const newUser = new User({
      username,
      password,
      firstname,
      lastname,
      email,
      phone,
      address,
      role,
      image: imageName,
    })

    const savedUser = await newUser.save()

    res.json({
      success: true,
      message: `User registration successful for ${username}`,
      data: savedUser,
    })
  } catch (error) {
    console.error(error)
    res
      .status(500)
      .json({ success: false, message: 'Server error', data: null })
  }
})

// router.post('/updateProfile', upload.single('image'), async (req, res) => {
//   const { username, firstname, lastname, phone, address } = req.body;

//   try {
//     const existingUser = await User.findOne({ username });

//     if (!existingUser) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//         data: null,
//       });
//     }

//     // Update user information
//     existingUser.firstname = firstname;
//     existingUser.lastname = lastname;
//     existingUser.phone = phone;
//     existingUser.address = address;

//     // Handle image update if provided
//     if (req.file) {
//       existingUser.image = req.file.filename;
//     }

//     // Save the updated user
//     const updatedUser = await existingUser.save();

//     res.json({
//       success: true,
//       message: 'User profile updated successfully',
//       data: updatedUser,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       data: null,
//     });
//   }
// });

router.post(
  '/updateProfile',
  upload.single('image'),
  async (req, res, next) => {
    try {
      const updateP_id = req.body.updateP_id
      const data = {
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
        role: req.body.role,
      }
      console.log('Product ID:', req.params.productId)
      console.log('Body:', req.body)
      if (req.file) {
        console.log('Received file with filename:', req.file.filename)
      }

      console.log(updateP_id)
      console.log(data)

      const updatedUser = await User.findByIdAndUpdate(updateP_id, data, {
        useFindAndModify: false,
      })

      res.json(updatedUser)
    } catch (err) {
      console.error('Error updating product:', err)
      res.status(500).send('Internal Server Error')
    }
  }
)

router.post('/updateUser/:userId', upload.single('image'), async (req, res) => {
  const userId = req.params.userId
  const { username, firstname, lastname, email, phone, address, role } =
    req.body
  const data = {
    username,
    firstname,
    lastname,
    email,
    phone,
    address,
    role,
  }

  if (req.file) {
    data.image = req.file.filename
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(userId, data, {
      new: true,
      runValidators: true,
    })

    if (!updatedUser) {
      return res.status(404).send('User not found')
    }

    res.json(updatedUser)
  } catch (err) {
    console.error('Error updating user:', err)
    res.status(500).send('Internal Server Error')
  }
})

module.exports = router
