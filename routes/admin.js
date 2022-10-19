const express = require('express')
const bcrypt = require('bcryptjs')
const passport = require('passport')
const router = express.Router()
const User = require('../models/User')
const Product = require('../models/Product')
const Order = require('../models/Order')
const { ensureAdminAuthenticated } = require('../config/auth')
const { route } = require('.')

// Admin GET
router.get('/', ensureAdminAuthenticated, (req, res) => {
    res.render('admin/control-panel', {
        title: 'Admin Control Panel',
        user: req.user,
    })
})
// Product GET
router.get('/products', ensureAdminAuthenticated, async (req, res) => {
    let products = []
    try {
        const query = await Product.find()
        query.forEach(product => {
            products.push(product)
        })
        res.render('admin/products/view', {
            title: 'Products',
            products,
            count: products.length,
            user: req.user
        })
    } catch (err) {
        req.flash('error_msg', err.message)
        res.redirect('/admin/users')
    }
})
// Products Del GET
router.get('/products/del&:id', ensureAdminAuthenticated, getProduct, async (req, res) => {
    try {
        await res.product.remove()
        req.flash('success_msg', 'Product Deleted')
        res.redirect('/admin/products')
    }
    catch (err) {
        req.flash('error_msg', 'Product not available')
        res.redirect('/admin/products')
    }
})
// Product Add GET
router.get('/products/add', ensureAdminAuthenticated, (req, res) => {
    res.render('admin/products/add', {
        title: 'Add Product',
        user: req.user
    })
})
// Product Add POST
router.post('/products/add', ensureAdminAuthenticated, async (req, res) => {
    const { product_id, product_title, price, description, picture } = req.body
    let errors = []
    if (!product_id || !product_title || !price || !description || !picture) {
        errors.push({ msg: 'Please fill the entire form' })
    }
    if (errors.length > 0) {
        res.render('admin/products/add', {
            title: 'Add Product',
            user: req.user,
            errors,
            product_id,
            product_title,
            price,
            description,
            picture
        })
    }
    Product.findOne({ product_id: product_id }).then(product => {
        if (product) {
            errors.push({ msg: 'Product ID already used' })
            res.render('admin/products/add', {
                title: 'Add Product',
                user: req.user,
                errors,
                product_title,
                price,
                description,
                picture
            })
        }
        else {
            const newProduct = new Product({
                product_id,
                product_title,
                price,
                description,
                picture
            }).save().then(product => {
                req.flash('success_msg', 'Successfully Added')
                res.redirect('/admin/products')
            }).catch(err => {
                req.flash('error_msg', err.message)
                res.redirect('/admin/products')
            })
        }
    })
})
// Product Edit GET
router.get('/products/edit&:id', ensureAdminAuthenticated, getProduct, async (req, res) => {
    try {
        res.render('admin/products/edit', { title: 'Edit', product: res.product, user: req.user });
    } catch (err) {
        req.flash('error_msg', err.message)
        res.redirect('/admin/products')
    }
})
// Product Edit POST
router.post('/products/edit&:id', ensureAdminAuthenticated, getProduct, async (req, res) => {
    let errors = []
    let { product_title, price, description, picture } = req.body
    if (!product_title || !price || !description || !picture) {
        errors.push({ msg: 'Please fill the entire form' })
    }
    if (errors.length > 0) {
        res.render('admin/products/edit', {
            title: 'Products',
            user: req.user,
            errors,
            product: res.product
        })
    } else {
        res.product.product_title = product_title
        res.product.price = price
        res.product.description = description
        res.product.picture = picture
        try {
            await res.product.save()
            req.flash('success_msg', 'Successfully Edited')
            res.redirect('/admin/products')
        } catch (err) {
            errors.push({ msg: err.message })
            res.render('admin/products/', {
                title: 'Products',
                user: req.user,
                errors
            })
        }
    }
})
// User GET
router.get('/users', ensureAdminAuthenticated, async (req, res) => {
    let users = []
    try {
        const query = await User.find()
        query.forEach(user => {
            users.push(user)
        })
        res.render('admin/users/users', {
            title: 'Users',
            users,
            count: users.length,
            user: req.user
        })
    } catch (err) {
        req.flash('error_msg', err.message)
        res.redirect('/')
    }
})
// User Del GET
router.get('/users/del&:id', ensureAdminAuthenticated, getUser, async (req, res) => {
    try {
        await res.user.remove()
        await Order.deleteMany({ email: res.user.email })
        req.flash('success_msg', 'User Deleted')
        res.redirect('/admin/users')
    }
    catch (err) {
        req.flash('error_msg', 'User not available')
        res.redirect('/admin/users')
    }
})
// Orders GET
router.get('/orders', ensureAdminAuthenticated, async (req, res) => {
    let orders = []
    try {
        const query = await Order.find()
        query.forEach(order => {
            orders.push(order)
        })
        res.render('admin/orders/view', {
            title: 'Existing Orders',
            orders,
            count: orders.length,
            user: req.user
        })
    } catch (err) {
        req.flash('error_msg', err.message)
        res.redirect('/admin')
    }
})
// Orders Del GET
router.get('/orders/del&:id', ensureAdminAuthenticated, getOrder, async (req, res) => {
    try {
        await res.order.remove()
        req.flash('success_msg', 'Order removed')
        res.redirect('/admin/orders')
    }
    catch (err) {
        req.flash('error_msg', 'Order not available')
        res.redirect('/admin/orders')
    }
})


async function getProduct(req, res, next) {
    let product
    try {
        product = await Product.findById(req.params.id)
        if (!product) {
            req.flash('error_msg', 'Product not available')
            res.redirect('/admin')
        }
    } catch (err) {
        req.flash('error_msg', err.message)
        res.redirect('/admin')
    }
    res.product = product
    next()
}
async function getOrder(req, res, next) {
    let order
    try {
        order = await Order.findById(req.params.id)
        if (!order) {
            req.flash('error_msg', 'Order not available')
            res.redirect('/admin/orders')
        }
    } catch (err) {
        req.flash('error_msg', err.message)
        res.redirect('/admin/orders')
    }
    res.order = order
    next()
}
async function getUser(req, res, next) {
    let user
    try {
        user = await User.findById(req.params.id)
        if (!user) {
            req.flash('error_msg', 'User not available')
            res.redirect('/admin/users')
        }
    } catch (err) {
        req.flash('error_msg', err.message)
        res.redirect('/admin/users')
    }
    if (user.admin == true) {
        req.flash('error_msg', 'Admins cannot be deleted')
        res.redirect('/admin/users')
    }
    else {
        res.user = user
        next()
    }
}




module.exports = router
