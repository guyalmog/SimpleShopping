const express = require('express')
const expressLayouts = require('express-ejs-layouts')
const mongoose = require('mongoose')
const flash = require('connect-flash-plus')
const session = require('express-session')
const dotenv = require('dotenv')
const path = require('path')
const MongoStore = require('connect-mongo')
const connectDB = require('./config/db')
const passport = require('passport')

// Load .env configurations
dotenv.config({ path: './config/config.env' })

const app = express()

// Passport Config
require('./config/passport')(passport)

// Database Config
connectDB()


// View Engine
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(__dirname + '/public')) 
app.use(expressLayouts)
app.set('view engine', 'ejs')

// Parser
app.use(express.urlencoded({ extended: false })) 
app.use(express.json())

// Express Session
app.use(session({
  secret: 'Mitzi Meow',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000, secure: false },
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI, })
}))

// Passport Middleware
app.use(passport.initialize())
app.use(passport.session())

// Flash messages
app.use(flash())
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg')
  res.locals.error_msg = req.flash('error_msg')
  res.locals.error = req.flash('error')
  res.locals.session = req.session
  res.locals.user = req.user
  next();
})

// Routes
app.use('/', require('./routes/index'))
app.use('/user', require('./routes/user'))
app.use('/admin', require('./routes/admin'))
app.use('/cart', require('./routes/cart'))
app.use((req, res) => {
  res.status(404).render('404', {
    title: 'Not Found',
    user: req.user,
    cart: req.session.cart
  });
})



const PORT = process.env.PORT || 1234
app.listen(PORT, console.log(`Server started on port ${PORT}`))