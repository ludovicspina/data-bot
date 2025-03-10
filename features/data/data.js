const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
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
        // Vérifiez si l'utilisateur a les permissions d'administrateur
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply('Vous n\'avez pas les permissions nécessaires pour utiliser cette commande.');
        }

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

            // Récupérer les utilisateurs avec leurs réactions
            const users = await User.findAll({
                where: {
                    guild_id: guildId,
                },
            });

            // Calculer les totaux par utilisateur
            const userData = {};

            messages.forEach(message => {
                if (!userData[message.user_id]) {
                    userData[message.user_id] = { messages: 0, voiceTime: 0, reactions: 0 };
                }
                userData[message.user_id].messages++;
            });

            voiceConnections.forEach(connection => {
                const voiceTime = connection.disconnection_time - connection.connection_time;
                if (!userData[connection.user_id]) {
                    userData[connection.user_id] = { messages: 0, voiceTime: 0, reactions: 0 };
                }
                userData[connection.user_id].voiceTime += voiceTime;
            });

            users.forEach(user => {
                if (!userData[user.user_id]) {
                    userData[user.user_id] = { messages: 0, voiceTime: 0, reactions: 0 };
                }
                userData[user.user_id].reactions = user.total_reactions;
            });

            const userMap = {};
            users.forEach(user => {
                userMap[user.user_id] = user.username;
            });

            // Convertir userData en tableau pour le tri
            const userArray = Object.keys(userData).map(userId => ({
                userId,
                ...userData[userId],
                username: userMap[userId] || 'Utilisateur inconnu',
            }));

            // Trier et sélectionner le top 5 pour les messages
            const topMessages = userArray.sort((a, b) => b.messages - a.messages).slice(0, 5);
            const topMessagesResult = topMessages.map(user =>
                `- <@${user.userId}>: ${user.messages} messages`
            ).join('\n');

            // Trier et sélectionner le top 5 pour la durée en vocal
            const topVoiceTime = userArray.sort((a, b) => b.voiceTime - a.voiceTime).slice(0, 5);
            const topVoiceTimeResult = topVoiceTime.map(user =>
                `- <@${user.userId}>: ${(user.voiceTime / 3600000).toFixed(2)} heures en vocal`
            ).join('\n');

            // Trier et sélectionner le top 5 pour les réactions
            const topReactions = userArray.sort((a, b) => b.reactions - a.reactions).slice(0, 5);
            const topReactionsResult = topReactions.map(user =>
                `- <@${user.userId}>: ${user.reactions} réactions`
            ).join('\n');

            const embed = new EmbedBuilder()
                .setTitle(`Données pour la période : ${period}`)
                .setColor(0x00AE86)
                .addFields(
                    { name: 'Top 5 des utilisateurs par messages envoyés', value: topMessagesResult },
                    { name: 'Top 5 des utilisateurs par durée en vocal', value: topVoiceTimeResult },
                    { name: 'Top 5 des utilisateurs par réactions envoyées', value: topReactionsResult }
                );

            // Vérifiez la longueur de la réponse
            if (embed.data.description?.length > 2000 || embed.data.fields.some(field => field.value.length > 1024)) {
                console.error('La réponse dépasse la limite de 2000 caractères.');
                return interaction.reply('La réponse est trop longue pour être affichée.');
            }

            console.log('Réponse envoyée :', embed);
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Erreur lors de la récupération des données :', error);
            await interaction.reply('Une erreur est survenue lors de la récupération des données.');
        }
    }
};
