const { Sequelize } = require('sequelize');
const User = require('./models/user');
const Channel = require('./models/channel');
const Message = require('./models/message');
const VoiceConnection = require('./models/voiceConnection');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DATABASE_NAME,
    process.env.DATABASE_USER,
    process.env.DATABASE_PASSWORD,
    {
        host: '192.168.1.116',
        dialect: 'mysql',
        logging: false,
    }
);

sequelize.sync().then(() => {
    console.log('Base de données synchronisée');
}).catch(err => {
    console.error('Erreur lors de la synchronisation de la base de données :', err);
});

module.exports = sequelize;
