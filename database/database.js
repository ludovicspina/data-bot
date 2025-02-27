const { Sequelize } = require('sequelize');
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

// Importez les modèles après avoir initialisé Sequelize
const User = require('./models/user')(sequelize, Sequelize.DataTypes);
const Channel = require('./models/channel')(sequelize, Sequelize.DataTypes);
const Message = require('./models/message')(sequelize, Sequelize.DataTypes);
const VoiceConnection = require('./models/voiceConnection')(sequelize, Sequelize.DataTypes);

sequelize.sync().then(() => {
    console.log('Base de données synchronisée');
}).catch(err => {
    console.error('Erreur lors de la synchronisation de la base de données :', err);
});

module.exports = sequelize;
