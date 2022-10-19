const express = require('express')
const router = express.Router()
const Product = require('../models/Product')
const Order = require('../models/Order')
const { ensureAuthenticated, ensureNotLogged } = require('../config/auth')

// Index GET
router.get('/', (req, res) => {
    res.render('home', {
        title: 'Organic Food - Home',
        user: req.user,
        cart: req.session.cart
    })
})
// User GET
router.get('/user', ensureNotLogged, (req, res) => {
    res.render('auth', {
        title: 'Organic Food - Sign In',
    })
})
// Shop GET
router.get('/shop', getProducts, (req, res) => {
    res.render('shop', {
        title: 'Organic Food - Shop',
        user: req.user,
        products: res.products,
        cart: req.session.cart
    })
})

async function getProducts(req, res, next) {
    let products = []
    try {
        const query = await Product.find()
        query.forEach(product => {
            products.push(product)
        })
    } catch (err) {
        req.flash('error_msg', err.message)
        res.redirect('/admin')
    }
    res.products = products
    next()
}



module.exports = router