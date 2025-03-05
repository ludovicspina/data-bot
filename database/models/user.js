module.exports = (sequelize, DataTypes) => {
    return sequelize.define('User', {
        user_id: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        guild_id: {
            type: DataTypes.STRING,
            primaryKey: true, // Ajoutez cette ligne pour créer une clé composite
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
};
