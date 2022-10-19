const mongoose = require('mongoose')

const OrderSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  items: [{ product_title: String, quantity: Number, subtotal: Number }],
  total: {
    type: Number,
    required: true
  },
  Date: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('Order', OrderSchema)
