const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');
const Product = require('../models/Product');

// @route   POST api/orders
// @desc    Create new order from cart (Checkout)
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        // Get User's Cart
        const cart = await Cart.findOne({
            where: { UserId: req.user.id },
            include: [{ model: CartItem, include: [Product] }]
        });

        if (!cart || cart.CartItems.length === 0) {
            return res.status(400).json({ msg: 'El carrito está vacío' });
        }

        // Calculate Total from server-side data (secure)
        let total = 0;
        const orderItemsData = [];

        cart.CartItems.forEach(item => {
            const price = parseFloat(item.Product.price);
            total += price * item.quantity;
            orderItemsData.push({
                quantity: item.quantity,
                price: price,
                ProductId: item.Product.id
            });
        });

        // Create Order
        const order = await Order.create({
            UserId: req.user.id,
            total,
            status: 'paid' // Assuming PayPal success for now
        });

        // Create Order Items
        for (const item of orderItemsData) {
            await OrderItem.create({
                OrderId: order.id,
                ProductId: item.ProductId,
                quantity: item.quantity,
                price: item.price
            });
        }

        // Clear Cart
        await CartItem.destroy({ where: { CartId: cart.id } });

        res.json({ msg: 'Orden creada exitosamente', orderId: order.id });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/orders
// @desc    Get user's order history
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: { UserId: req.user.id },
            include: [
                {
                    model: OrderItem,
                    include: [Product]
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(orders);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
