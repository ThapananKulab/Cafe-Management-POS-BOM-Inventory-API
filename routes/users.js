const express = require('express');
const router = express.Router();
// const mongoose = require('mongoose');
const User = require('../models/User.js');

router.get('/', (req, res, next) => {
  User.find()
    .then(users => {
      res.json(users);
    })
    .catch(err => {
      next(err);
    });
});

router.get('/:id', (req, res, next) => {
    User.findById(req.params.id)
        .then(user => {
            res.json(user);
        })
        .catch(err => {
            next(err);
        });
});

router.post('/', (req, res, next) => {
  User.create(req.body)
    .then(user => {
      res.json(user);
    })
    .catch(err => {
      next(err);
    });
});

//with web
router.get('/deleteU/:id', (req, res, next) => {
  User.findByIdAndDelete(req.params.id)
    .then(deletedemployee => {
      res.redirect('/employee')
    })
    .catch(err => {
      next(err);
    });
});

router.post('/editU/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const editId = req.body.edit_id;
    
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      { $set: { id: editId } }, 
      { new: true }
    ).exec();

    if (!updatedUser) {
      return res.status(404).send('User not found');
    }

    // Assuming you want to redirect to the user's edit profile page
    res.redirect(`/editprofileA?id=${updatedUser._id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});




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
const multer = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/users'); // Set the destination folder for uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); 
  }
});
const upload = multer({ storage: storage });
router.post('/insert', upload.single('image'), async (req, res, next) => {
  try {
    console.log('Received form data:', req.body);
    console.log('Received file:', req.file);

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
    });

    res.redirect('/employee');
  } catch (err) {
    console.error('Error:', err);
    next(err);
  }
});

router.post('/updateU', upload.single('image'), async (req, res, next) => {
  try {
    const updateP_id = req.body.updateP_id;
    const data = {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
    };

    if (req.file) {
      data.image = req.file.filename;
    }
    console.log(updateP_id);
    console.log(data);

    await User.findByIdAndUpdate(updateP_id, data, { useFindAndModify: false });
    res.redirect('/editprofileU');
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/updateA', upload.single('image'), async (req, res, next) => {
  try {
    const updateP_id = req.body.updateP_id;
    const data = {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      role: req.body.role
    };

    if (req.file) {
      data.image = req.file.filename;
    }
    console.log(updateP_id);
    console.log(data);

    await User.findByIdAndUpdate(updateP_id, data, { useFindAndModify: false });
    res.redirect('/employee');
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).send('Internal Server Error');
  }
});








module.exports = router;
