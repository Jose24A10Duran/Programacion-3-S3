const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cart = sequelize.define('Cart', {
    // Only needs ID and association to User
});

module.exports = Cart;
