var express = require('express')
var cors = require('cors')
var bodyParser = require('body-parser')
var app = express()
var jsonParser = bodyParser.json()
const mongoose = require('mongoose')
const User = require('./models/User')
const bcryptjs = require('bcryptjs')
var jwt = require('jsonwebtoken')
const secret = 'Fullstack'
const expressSession = require('express-session')
const MemoryStore = require('memorystore')(expressSession)
const cookieParser = require('cookie-parser')

app.use(cors())
app.use(cookieParser())
app.use(bodyParser.json())
app.use(express.json())

app.use(
  expressSession({
    cookie: { maxAge: 86400000 },
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    resave: false,
    saveUninitialized: true, // Add this line
    secret: 'Fullstack',
  })
)

app.use(cors())
app.use('/public', express.static('public'))

app.get('/', (req, res) => {
  res.send('Server is running')
})

// app.use(express.static(dist));

app.use(express.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

//database
mongoose.Promise = global.Promise
const db = mongoose.connection
db.on('error', (error) => console.log(error))
db.once('open', () => console.log('Database Already'))
mongoose.connect(
  process.env.MONGODB_URI ||
    'mongodb+srv://nicekrubma10:kulab12345@cluster0.uqjxafb.mongodb.net/?retryWrites=true&w=majority'
)
app.listen(process.env.PORT || 3333, () => {
  console.log(`App listening on port ${process.env.PORT || 3333}`)
})

//api
app.post('/api/login', jsonParser, async (req, res) => {
  const { username, password } = req.body
  try {
    const user = await User.findOne({ username: username })
    if (user) {
      const match = await bcryptjs.compare(password, user.password)
      if (match) {
        const payload = {
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            phone: user.phone,
            address: user.address,
            image: user.image ? { url: user.image } : null,
          },
        }
        var token = jwt.sign(payload, secret, {
          expiresIn: '7h',
        })

        res.json({ message: 'Success', token: token })
      } else {
        res.json({
          message: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง โปรดลองอีกครั้ง',
        })
      }
    } else {
      res.json({
        message: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง โปรดลองอีกครั้ง',
      })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.post('/api/authen', jsonParser, (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1]
    var decoded = jwt.verify(token, secret)
    res.json({ status: 'ok', decoded })
  } catch (err) {
    res.json({ status: 'error', message: err.message })
  }
})

// app.get('/api/authen', jsonParser, (req, res) => {
//   try {
//     const token = req.headers.authorization.split(' ')[1]
//     var decoded = jwt.verify(token, secret)
//     res.json({ status: 'ok', decoded })
//   } catch (err) {
//     res.json({ status: 'error', message: err.message })
//   }
// })

app.post('/api/logout', (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).send('Could not log out, please try again.')
      }
      res.send('Logged out successfully.')
    })
  } catch (error) {
    console.error('Error logging out:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

const multer = require('multer')
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images')
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname)
  },
})

const upload = multer({ storage })

app.post('/upload', upload.single('image'), (req, res) => {
  if (req.file) {
    res.json({ message: 'File uploaded successfully', file: req.file })
  } else {
    res.status(400).send('File upload failed')
  }
})

const path = require('path')
app.get('/images-product/:filename', (req, res) => {
  const filename = req.params.filename
  const imagePath = path.join(
    __dirname,
    'public',
    'images',
    'products',
    filename
  )
  res.sendFile(imagePath, (err) => {
    if (err) {
      console.log(err)
      res.status(404).send('Image not found')
    }
  })
})

app.get('/images-user/:filename', (req, res) => {
  const filename = req.params.filename
  const imagePath = path.join(__dirname, 'public', 'images', 'users', filename)
  sendImage(imagePath, res)
})

function sendImage(imagePath, res) {
  res.sendFile(imagePath, (err) => {
    if (err) {
      console.log(err)
      res.status(404).send('Image not found')
    }
  })
}

// app.post('/updateProfile', upload.single('image'), async (req, res) => {
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

// const QRCode = require('qrcode')

// app.get('/api/generate-qr', async (req, res) => {
//   try {
//     const { phoneNumber, amount } = req.query
//     const payload = thPromptpayQr.generatePayload(phoneNumber, {
//       amount: parseFloat(amount),
//     })

//     // Generate QR Code
//     const qrCodeDataURL = await QRCode.toDataURL(payload)

//     res.setHeader('Content-Type', 'image/png')
//     // Convert data URL to buffer
//     const base64Data = qrCodeDataURL.split(';base64,').pop()
//     const imgBuffer = Buffer.from(base64Data, 'base64')
//     res.send(imgBuffer)
//   } catch (err) {
//     console.error(err)
//     res.status(500).send('Error generating QR code')
//   }
// })

require('dotenv').config()

//api product
const products = require('./routes/products')
app.use('/api/products', products)

//api typepros
const typepros = require('./routes/typepros')
app.use('/api/typepros', typepros)

//Api add User
const users = require('./routes/users')
app.use('/api/users', users)

//Api add Raw
const raws = require('./routes/raws')
app.use('/api/raws', raws)

//Api add Menu
const menus = require('./routes/menus')
app.use('/api/menus', menus)

const inventoryitems = require('./routes/inventoryitems')
app.use('/api/inventoryitems', inventoryitems)

const recipes = require('./routes/recipes')
app.use('/api/recipes', recipes)

const test = require('./routes/test')
app.use('/api/test', test)

const employees = require('./routes/employees')
app.use('/api/employees', employees)
