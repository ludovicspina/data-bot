const { DataTypes } = require('sequelize');
const sequelize = require('../database');
const User = require('./user');
const Channel = require('./channel');

const VoiceConnection = sequelize.define('VoiceConnection', {
    connection_id: {
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
    connection_time: {
        type: DataTypes.DATE,
    },
    disconnection_time: {
        type: DataTypes.DATE,
    },
}, {
    tableName: 'voice_connections',
    timestamps: false,
});

module.exports = VoiceConnection;
