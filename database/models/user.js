const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const User = sequelize.define('User', {
    user_id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    username: {
        type: DataTypes.STRING,
    },
    total_messages_sent: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    total_voice_time: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    total_reactions: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
}, {
    tableName: 'users',
    timestamps: false,
});

module.exports = User;
