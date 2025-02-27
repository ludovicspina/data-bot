module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Channel', {
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
};
