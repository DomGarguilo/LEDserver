const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    order: [{
        type: String
    }]
});

module.exports = mongoose.model('order', orderSchema);