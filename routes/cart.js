const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');
const Product = require('../models/Product');
const User = require('../models/User');

// @route   GET api/cart
// @desc    Get user's cart
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        let cart = await Cart.findOne({
            where: { UserId: req.user.id },
            include: [
                {
                    model: CartItem,
                    include: [Product]
                }
            ]
        });

        if (!cart) {
            // Create if not exists
            cart = await Cart.create({ UserId: req.user.id });
            return res.json({ items: [], total: 0 });
        }

        const items = cart.CartItems.map(item => ({
            id: item.Product.id,
            name: item.Product.name,
            price: parseFloat(item.Product.price),
            image: item.Product.image_url,
            quantity: item.quantity,
            total: item.quantity * parseFloat(item.Product.price)
        }));

        const total = items.reduce((acc, item) => acc + item.total, 0);

        res.json({ items, total });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/cart
// @desc    Add item to cart
// @access  Private
router.post('/', auth, async (req, res) => {
    const { productId } = req.body;

    try {
        let cart = await Cart.findOne({ where: { UserId: req.user.id } });
        if (!cart) {
            cart = await Cart.create({ UserId: req.user.id });
        }

        let cartItem = await CartItem.findOne({
            where: {
                CartId: cart.id,
                ProductId: productId
            }
        });

        if (cartItem) {
            cartItem.quantity += 1;
            await cartItem.save();
        } else {
            await CartItem.create({
                CartId: cart.id,
                ProductId: productId,
                quantity: 1
            });
        }

        res.json({ msg: 'Producto agregado al carrito' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/cart
// @desc    Clear cart
// @access  Private
router.delete('/', auth, async (req, res) => {
    try {
        const cart = await Cart.findOne({ where: { UserId: req.user.id } });
        if (cart) {
            await CartItem.destroy({ where: { CartId: cart.id } });
        }
        res.json({ msg: 'Carrito vaciado' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
