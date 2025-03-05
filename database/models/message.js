module.exports = (sequelize, DataTypes) => {
    const User = require('./user')(sequelize, DataTypes);
    const Channel = require('./channel')(sequelize, DataTypes);

    return sequelize.define('Message', {
        message_id: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        guild_id: {
            type: DataTypes.STRING,
            allowNull: false,
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
};
