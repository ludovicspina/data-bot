module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Channel', {
        channel_id: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        guild_id: {
            type: DataTypes.STRING,
            allowNull: false,
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
};
