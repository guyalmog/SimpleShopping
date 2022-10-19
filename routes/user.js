const express = require('express')
const bcrypt = require('bcryptjs')
const passport = require('passport')
const router = express.Router()
const User = require('../models/User')
const Order = require('../models/Order')
const { ensureNotLogged, ensureAuthenticated } = require('../config/auth')

// Login GET
router.get('/login', ensureNotLogged, (req, res) => {
    res.render('login', {
        title: 'Log In',
    })
})
// Logout GET
router.get('/logout', ensureAuthenticated, (req, res) => {
    req.logout()
    req.flash('success_msg', 'You have logged out')
    res.redirect('/')
})
// Signup GET
router.get('/signup', ensureNotLogged, (req, res) => {
    res.render('signup', {
        title: 'Sign Up'
    })
})
// Signup POST
router.post('/signup', ensureNotLogged, (req, res) => {
    const { name, email, password, passwordConfirm } = req.body
    let errors = []
    if (!name || !email || !password || !passwordConfirm) {
        errors.push({ msg: 'Please fill the entire form' })
    }
    else if (password.length < 6) {
        errors.push({ msg: 'Password needs to be at least 6 characters' })
    }
    else if (password !== passwordConfirm) {
        errors.push({ msg: 'Passwords do not match' })
    }
    if (errors.length > 0) {
        res.render('signup', {
            title: 'Sign Up',
            errors,
            name,
            email,
            password,
            passwordConfirm
        })
    }
    else {
        User.findOne({ email: email }).then(user => {
            if (user) {
                errors.push({ msg: 'Email already exists' });
                res.render('signup', {
                    title: 'Sign Up',
                    errors,
                    name,
                    email,
                    password,
                    passwordConfirm
                });
            } else {
                const newUser = new User({
                    name,
                    email,
                    password
                })

                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                        if (err) throw err;
                        newUser.password = hash;
                        newUser
                            .save()
                            .then(user => {
                                req.flash('success_msg', 'Successfully registered, Please log in')
                                res.redirect('/user/login')
                            })
                            .catch(err => {
                                req.flash('error_msg', 'Failed registering! Please retry')
                                res.redirect('/user/signup')                            })
                    })
                })
            }
        })
    }
})
// Login POST
router.post('/login', ensureNotLogged, (req, res, next) => {
    const { email, password } = req.body
    let errors = []
    if (!email || !password) {
        errors.push({ msg: 'Please fill the entire form' })
        return res.render('login', { title: 'Log in', errors })
    }
    else {
        passport.authenticate('user-local', (err, user, info) => {
            if (err) {
                errors.push({ msg: info.message })
                return res.status(401)  /// change to 401
            }
            if (!user) {
                errors.push({ msg: 'Wrong Username or Password' })
                return res.render('login', {
                    title: 'Log in',
                    errors
                })
            }
            else {
                req.logIn(user, function (err) {
                    req.session.save(() => {
                        return res.redirect('/')
                    })
                })
            }
        })(req, res, next)
    }
})
// Orders GET
router.get('/orders', ensureAuthenticated, async (req, res) => {
    let history = []
    try {
        const query = await Order.find({ email: req.user.email }).lean()
        query.forEach(order => {
            history.push(order)
        })
        res.render('order-history', {
            title: 'Order History',
            user: req.user,
            count: history.length,
            cart: req.session.cart,
            history
        })
    } catch (err) {
        res.redirect('/')
    }
})
// Order (specific) GET
router.get('/orders&:id', ensureAuthenticated, async (req, res) => {
    let id = req.params.id
    items = []
    const query = await (await Order.find({ email: req.user.email, _id: id })).forEach(item => {
        item.items.forEach(product => {
            items.push(product)
        })
    })
    if(items.length == 0) {
        res.redirect('/user/orders')
    }
    res.render('order-view', {
        title: 'View Order',
        user: req.user,
        cart: req.session.cart,
        items
    })
})
// Payment GET
router.get('/payment&:id', ensureAuthenticated, (req, res) => {
    if (typeof req.session.cart == 'undefined') {
        res.redirect('/')
    }
    if (req.session.cart.length == 0) {
        res.redirect('/')
    }
    else {
        res.render('payment', {
            title: 'Payment',
            user: req.user,
            cart: req.session.cart
        })
    }
})
// Payment Done GET
router.post('/payment/done', ensureAuthenticated, (req, res) => {
    if (typeof req.session.cart == 'undefined') {
        res.redirect('/')
    }
    if (req.session.cart.length == 0) {
        res.redirect('/')
    }
    let cart = req.session.cart
    let newTotal = 0
    const newOrder = new Order({
        email: req.user.email
    })
    for (let i = 0; i < cart.length; i++) {
        newOrder.items.push({
            product_title: cart[i].product.product_title,
            quantity: cart[i].product.quantity,
            subtotal: cart[i].product.price * cart[i].product.quantity
        })
        newTotal += + parseFloat(cart[i].product.price) * parseFloat(cart[i].product.quantity)
    }
    newOrder.total = newTotal
    newOrder.save().then(order => {
        delete req.session.cart
        req.flash('success_msg', 'Your order has been placed. Thank you!')
        res.redirect('/')
    }).catch(err => {
        req.flash('error_msg', err.message)
        res.redirect('/shop')
    })
})


module.exports = router