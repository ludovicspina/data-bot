const { Sequelize } = require('sequelize');
require('dotenv').config();

console.log('Database Name:', process.env.DATABASE_NAME);
console.log('Database User:', process.env.DATABASE_USER);
console.log('Database Password:', process.env.DATABASE_PASSWORD);

const sequelize = new Sequelize(
    process.env.DATABASE_NAME,
    process.env.DATABASE_USER,
    process.env.DATABASE_PASSWORD,
    {
        host: '192.168.1.116',  // ou '192.168.1.116' si vous utilisez une adresse IP spécifique
        dialect: 'mysql',
        logging: false,
    }
);

module.exports = sequelize;
