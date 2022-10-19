var express = require('express')
var router = express.Router()
var Product = require('../models/Product')
const { ensureAuthenticated } = require('../config/auth')
const { session } = require('passport')

// Cart GET
router.get('/', ensureAuthenticated, (req, res) => {
    let count = 0
    if (typeof req.session.cart !== 'undefined') {
        count = req.session.cart.length
    }
    res.render('cart', {
        title: 'Cart',
        cart: req.session.cart,
        count
    })
})
// Cart Add POST
router.post('/add&:id', ensureAuthenticated, getProduct, (req, res) => {
    let product = res.product
    let cart = req.session.cart
    let quantity = req.body.qty

    if (typeof req.body.qty == 'undefined' || quantity === '') {
        res.redirect('/shop')
    }
    if (quantity > 50) {
        req.flash('error_msg', 'Quantity cannot exceed 50 KG')
        res.redirect('/shop')
    }

    if (!cart) {
        req.session.cart = new Array()
        req.session.cart.push({
            product: { product_id: product.product_id, product_title: product.product_title, price: product.price, picture: product.picture, quantity }
        })
    }
    else {
        let isNewItem = true
        for (let i = 0; i < cart.length; i++) {
            if (cart[i].product.product_id == product.product_id) {
                isNewItem = false
                if (parseFloat(cart[i].product.quantity) + parseFloat(quantity) > 50) {
                    req.flash('error_msg', 'Max quantity is 50 KG (Currently have ' + cart[i].product.quantity + ' ' + cart[i].product.product_title + 's)')
                    res.redirect('/shop')
                }
                else {
                    cart[i].product.quantity = parseFloat(quantity) + parseFloat(cart[i].product.quantity)
                    break
                }
            }
        }
        if (isNewItem) {
            cart.push({
                product: { product_id: product.product_id, product_title: product.product_title, price: product.price, picture: product.picture, quantity }
            })
        }
    }
    req.flash('success_msg', 'Added ' + quantity + ' KG of ' + product.product_title)
    res.redirect('/shop')
})
// Cart Update GET
router.get('/update&:id', ensureAuthenticated, (req, res) => {
    let action = req.query.action
    let cart = req.session.cart
    let id = req.params.id

    if (!cart) {
        res.redirect('/')
    }

    for (let i = 0; i < cart.length; i++) {
        if (cart[i].product.product_id == id) {
            switch (action) {
                case "inc":
                    if (parseFloat(cart[i].product.quantity) <= 49.5) {
                        cart[i].product.quantity = parseFloat(cart[i].product.quantity) + 0.5
                    } else {
                        req.flash('error_msg', 'Cannot exceed max quantity (50 KG)')
                        res.redirect('/cart')
                    }
                    break
                case "dec":
                    if (parseFloat(cart[i].product.quantity) >= 0.5) {
                        cart[i].product.quantity = parseFloat(cart[i].product.quantity) - 0.5
                        if (cart[i].product.quantity == 0) {
                            cart.splice(i, 1)
                        }
                    }
                    break
                case "del":
                    cart.splice(i, 1)
                    break

            }
        }
    }
    res.redirect('/cart')
})
// Cart Checkout GET
router.get('/checkout', ensureAuthenticated, (req, res) => {
    if (typeof req.session.cart == 'undefined') {
        res.redirect('/cart')
    }
    if (req.session.cart && req.session.cart.length == 0) {
        delete req.session.cart;
        res.redirect('/cart');
    } else {
        res.render('checkout', {
            title: 'Checkout',
            cart: req.session.cart
        })
    }
})
// Cart Checkout-Buy GET
router.get('/checkout/buy', ensureAuthenticated, (req, res) => {
    let cart = req.session.cart
    if (cart == 'undefined') {
        res.redirect('/shop')
    } else {
        res.redirect('/user/pay&' + req.session.id)
    }
})
// Cart Del GET
router.get('/delete&:id', ensureAuthenticated, (req, res) => {
    let id = req.params.id
    if (typeof req.session.cart == 'undefined') {
        res.redirect('/shop')
    }
    else {
        let cart = req.session.cart
        for (let i = 0; i < cart.length; i++) {
            if (cart[i].product.product_id == id) {
                cart.splice(i, 1)
                break
            }
        }
        req.flash('success_msg', 'Product removed')
        res.redirect('/cart')
    }
})
// Cart Clear GET
router.get('/clear', ensureAuthenticated, clearCart, (req, res) => {
    res.redirect('/shop')
})

async function clearCart(req, res, next) {
    if (typeof req.session.cart !== 'undefined') {
        delete req.session.cart;
    }
    next()
}
async function getProduct(req, res, next) {
    let product
    try {
        product = await Product.findById(req.params.id)
        if (!product) {
            req.flash('error_msg', 'Product not available')
            res.redirect('/shop')
        }
    } catch (err) {
        req.flash('error_msg', err.message)
        res.redirect('/shop')
    }
    res.product = product
    next()
}



module.exports = router