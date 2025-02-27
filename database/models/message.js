const { DataTypes } = require('sequelize');
const sequelize = require('../database');
const User = require('./user');
const Channel = require('./channel');

const Message = sequelize.define('Message', {
    message_id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.STRING,
        references: {
            model: User,
            key: 'user_id',
        },
    },
    channel_id: {
        type: DataTypes.STRING,
        references: {
            model: Channel,
            key: 'channel_id',
        },
    },
    timestamp: {
        type: DataTypes.DATE,
    },
}, {
    tableName: 'messages',
    timestamps: false,
});

module.exports = Message;
