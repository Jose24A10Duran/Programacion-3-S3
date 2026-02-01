const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// @route   POST api/products
// @desc    Create a product
// @access  Private/Admin
router.post('/', [auth, admin], async (req, res) => {
    const { name, code, price, description, image_url, stock } = req.body;

    // Simple validation
    if (!name || !code || !price) {
        return res.status(400).json({ msg: 'Por favor ingrese todos los campos requeridos' });
    }

    if (price <= 0) {
        return res.status(400).json({ msg: 'El precio debe ser mayor a 0' });
    }

    try {
        // Check if product exists
        let product = await Product.findOne({ where: { code } });
        if (product) {
            return res.status(400).json({ msg: 'Producto con este código ya existe' });
        }

        product = await Product.create({
            name,
            code,
            price,
            description,
            image_url,
            stock
        });

        res.json(product);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/products
// @desc    Get all products
// @access  Public
router.get('/', async (req, res) => {
    try {
        const products = await Product.findAll();
        res.json(products);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/products/:code
// @desc    Get product by code
// @access  Public
router.get('/:code', async (req, res) => {
    try {
        const product = await Product.findOne({ where: { code: req.params.code } });

        if (!product) {
            return res.status(404).json({ msg: 'Producto no encontrado' });
        }

        res.json(product);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/products/:id
// @desc    Update a product
// @access  Private/Admin
router.put('/:id', [auth, admin], async (req, res) => {
    const { name, code, price, description, image_url, stock } = req.body;

    try {
        let product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({ msg: 'Producto no encontrado' });
        }

        // Update fields if they exist in request
        if (name) product.name = name;
        if (code) product.code = code;
        if (price) product.price = price;
        if (description) product.description = description;
        // Keep these even if not in form, just in case
        if (image_url !== undefined) product.image_url = image_url;
        if (stock !== undefined) product.stock = stock;

        await product.save();
        res.json(product);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/products/:id
// @desc    Delete a product
// @access  Private/Admin
router.delete('/:id', [auth, admin], async (req, res) => {
    try {
        let product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({ msg: 'Producto no encontrado' });
        }

        await product.destroy();
        res.json({ msg: 'Producto eliminado' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
