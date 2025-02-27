const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Channel = sequelize.define('Channel', {
    channel_id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    channel_name: {
        type: DataTypes.STRING,
    },
    total_messages: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
}, {
    tableName: 'channels',
    timestamps: false,
});

module.exports = Channel;
