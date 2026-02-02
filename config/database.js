const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './tech_store.sqlite',
    logging: false // Disable logging for cleaner output
});

module.exports = sequelize;
