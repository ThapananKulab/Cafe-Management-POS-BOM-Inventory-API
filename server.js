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

const _ = require('lodash')
const generatePayload = require('promptpay-qr')
const QRCode = require('qrcode')

app.use(cors())
app.use(cookieParser())
app.use(bodyParser.json())
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }))

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
app.get('/favicon.ico', (req, res) => {
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
    const token = req.headers.authorization
    if (!token || !token.startsWith('Bearer ')) {
      res.status(401).json({ status: 'error', message: 'กรุณาเข้าสู่ระบบ' })
      return
    }
    const tokenValue = token.split(' ')[1]
    const decoded = jwt.verify(tokenValue, secret)
    res.json({ status: 'ok', decoded })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// app.post("/api/authen", jsonParser, (req, res) => {
//   try {
//     const token = req.headers.authorization.split(" ")[1];
//     var decoded = jwt.verify(token, secret);
//     res.json({ status: "ok", decoded });
//   } catch (err) {
//     res.json({ status: "error", message: err.message });
//   }
// });

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

app.post('/generateQR', (req, res) => {
  try {
    const { phoneNumber, amount } = req.body

    if (!phoneNumber || !amount) {
      throw new Error('Missing phone number or amount')
    }

    const amountFloat = parseFloat(amount)
    if (isNaN(amountFloat)) {
      throw new Error('Invalid amount')
    }

    const mobileNumber = '0819139936'
    const payload = generatePayload(mobileNumber, { amount: amountFloat })

    const option = {
      color: {
        dark: '#000',
        light: '#fff',
      },
    }

    QRCode.toDataURL(payload, option, (err, url) => {
      if (err) {
        console.error('Failed to generate QR code:', err)
        return res.status(400).json({
          RespCode: 400,
          RespMessage: 'Failed to generate QR code',
        })
      } else {
        return res.status(200).json({
          RespCode: 200,
          RespMessage: 'Success',
          Result: url,
        })
      }
    })
  } catch (error) {
    console.error('Error generating QR code:', error.message)
    return res.status(400).json({
      RespCode: 400,
      RespMessage: error.message,
    })
  }
})

app.listen(3000, () => {
  console.log('Server is running...')
})

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

const saleorder = require('./routes/saleorder')
app.use('/api/saleorder', saleorder)

const salerounds = require('./routes/salerounds')
app.use('/api/salerounds', salerounds)

const chatmessage = require('./routes/chatmessage')
app.use('/api/chatmessage', chatmessage)

const post = require('./routes/post')
app.use('/api/post', post)

const supplier = require('./routes/supplier')
app.use('/api/supplier', supplier)

const purchaseitem = require('./routes/purchaseitem')
app.use('/api/purchaseitem', purchaseitem)
