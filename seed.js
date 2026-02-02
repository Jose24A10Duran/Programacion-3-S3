const sequelize = require('./config/database');
const Product = require('./models/Product');
const User = require('./models/User');

// Define products to seed
const products = [
    {
        name: 'MacBook Pro M3',
        code: 'APP-MAC-M3',
        price: 2500000.00,
        description: 'Potencia desatada con el chip M3 Pro. Pantalla Liquid Retina XDR.',
        image_url: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp14-spacegray-select-202310?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1697311054290'
    },
    {
        name: 'iPhone 15 Pro Max',
        code: 'APP-IPH-15P',
        price: 1800000.00,
        description: 'Titanio. Chip A17 Pro. Botón de Acción. La cámara más potente.',
        image_url: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-max-natural-titanium-select?wid=940&hei=1112&fmt=png-alpha&.v=1692875661000'
    },
    {
        name: 'Sony WH-1000XM5',
        code: 'SON-WH-XM5',
        price: 450000.00,
        description: 'Cancelación de ruido líder en la industria. Sonido premium.',
        image_url: 'https://m.media-amazon.com/images/I/51SKmu2G9FL._AC_UF894,1000_QL80_.jpg'
    },
    {
        name: 'Samsung Galaxy S24 Ultra',
        code: 'SAM-S24-ULT',
        price: 1750000.00,
        description: 'Galaxy AI is here. Zoom de 100x. S-Pen integrado.',
        image_url: 'https://images.samsung.com/is/image/samsung/p6pim/ar/sm-s928bztqaro/gallery/ar-galaxy-s24-s928-sm-s928bztqaro-539294248?$650_519_PNG$'
    },
    {
        name: 'iPad Air 5',
        code: 'APP-IPAD-A5',
        price: 900000.00,
        description: 'Chip M1. Pantalla inmersiva. 5G ultrarrápido.',
        image_url: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-air-select-wifi-blue-202203?wid=940&hei=1112&fmt=png-alpha&.v=1645065732688'
    },
    {
        name: 'NVIDIA RTX 4090',
        code: 'NVI-RTX-4090',
        price: 2200000.00,
        description: 'Más allá de la rapidez. Para gamers y creadores.',
        image_url: 'https://assets.nvidia.partners/images/png/geforce-rtx-4090-product-photo.png'
    }
];

const seed = async () => {
    try {
        await sequelize.sync({ force: true }); // Reset Database completely
        console.log('Database synced & cleared.');

        await Product.bulkCreate(products);
        console.log('Products seeded successfully.');

        // Optional: Create an admin user for convenience
        // Note: Password hashing is usually handled in hooks/controller, but for raw seed simple is fine or skip
        // Skipping user creation to let user register.

        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
};

seed();
