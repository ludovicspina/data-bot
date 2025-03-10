const { SlashCommandBuilder } = require('discord.js');
const sequelize = require('../../database/database');
const { Sequelize } = require('sequelize');
const User = require('../../database/models/user')(sequelize, Sequelize.DataTypes);
const Message = require('../../database/models/message')(sequelize, Sequelize.DataTypes);
const VoiceConnection = require('../../database/models/voiceConnection')(sequelize, Sequelize.DataTypes);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('data')
        .setDescription('Affiche les données des utilisateurs pour une période donnée.')
        .addStringOption(option =>
            option.setName('period')
                .setDescription('La période pour laquelle afficher les données.')
                .setRequired(true)
                .addChoices(
                    { name: 'jour', value: 'day' },
                    { name: 'semaine', value: 'week' },
                    { name: 'mois', value: 'month' },
                )),
    async execute(interaction) {
        const period = interaction.options.getString('period');
        const guildId = interaction.guild.id;
        let startDate;

        switch (period) {
            case 'day':
                startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
                break;
            case 'week':
                startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                return interaction.reply('Période invalide.');
        }

        try {
            // Récupérer les messages et les connexions vocales pour la période spécifiée
            const messages = await Message.findAll({
                where: {
                    guild_id: guildId,
                    timestamp: {
                        [Sequelize.Op.gte]: startDate,
                    },
                },
            });

            const voiceConnections = await VoiceConnection.findAll({
                where: {
                    guild_id: guildId,
                    connection_time: {
                        [Sequelize.Op.gte]: startDate,
                    },
                    disconnection_time: {
                        [Sequelize.Op.ne]: null,
                    },
                },
            });

            // Calculer les totaux par utilisateur
            const userData = {};

            messages.forEach(message => {
                if (!userData[message.user_id]) {
                    userData[message.user_id] = { messages: 0, voiceTime: 0 };
                }
                userData[message.user_id].messages++;
            });

            voiceConnections.forEach(connection => {
                const voiceTime = connection.disconnection_time - connection.connection_time;
                if (!userData[connection.user_id]) {
                    userData[connection.user_id] = { messages: 0, voiceTime: 0 };
                }
                userData[connection.user_id].voiceTime += voiceTime;
            });

            // Récupérer les noms d'utilisateur
            const users = await User.findAll({
                where: {
                    guild_id: guildId,
                    user_id: Object.keys(userData),
                },
            });

            const userMap = {};
            users.forEach(user => {
                userMap[user.user_id] = user.username;
            });

            // Formater les résultats
            const result = Object.keys(userData).map(userId => {
                const username = userMap[userId] || 'Utilisateur inconnu';
                const messagesSent = userData[userId].messages;
                const voiceTime = Math.floor(userData[userId].voiceTime / 1000); // en secondes
                return `- **${username}**: ${messagesSent} messages, ${voiceTime} secondes en vocal`;
            });

            const response = `Données pour la période ${period} :\n${result.join('\n')}`;

            // Vérifiez la longueur de la réponse
            if (response.length > 2000) {
                console.error('La réponse dépasse la limite de 2000 caractères.');
                return interaction.reply('La réponse est trop longue pour être affichée.');
            }

            console.log('Réponse envoyée :', response);
            await interaction.reply(response);
        } catch (error) {
            console.error('Erreur lors de la récupération des données :', error);
            await interaction.reply('Une erreur est survenue lors de la récupération des données.');
        }
    }

};
