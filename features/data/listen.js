const { Events } = require('discord.js');
const sequelize = require("../../database/database");
const { Sequelize } = require("sequelize");
const User = require('../../database/models/user')(sequelize, Sequelize.DataTypes);
const Channel = require('../../database/models/channel')(sequelize, Sequelize.DataTypes);
const Message = require('../../database/models/message')(sequelize, Sequelize.DataTypes);
const VoiceConnection = require('../../database/models/voiceConnection')(sequelize, Sequelize.DataTypes);

module.exports = (client) => {
    const logChannelId = '1344359532108841051'; // ID du salon où les logs seront envoyés

    // Emojis constants
    const EMOJIS = {
        NEW_MESS: '<:greenarr:1344347076615606394>',
        EDIT_MESS: '<:bluearr:1344346432865435679>',
        DEL_MESS: '<:redarr:1344346399679971410>',
        ADD_REACT: '<:greenarr:1344347076615606394>',
        REM_REACT: '<:redarr:1344346399679971410>',
        VOICE: '<:voice:1344349315585413180>',
        JOIN_SERVER: '<:redup:1344349388096405546>',
        LEAVE_SERVER: '<:bluedown:1344349425593618432>',
        BAN_USER: '<:ban:1344349582397538344>',
        ADD_ROLE: '<:greenarr:1344347076615606394>',
        REM_ROLE: '<:redarr:1344346399679971410>'
    };

    // Fonction utilitaire pour envoyer des messages de log formatés
    const sendLogMessage = async (logChannel, emoji, action, user, content, date) => {
        if (logChannel) {
            logChannel.send(`${emoji} **${action}**   ${user}   ${content}   ${date}`);
        }
    };

    // Fonction utilitaire pour formater la date
    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} - ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    // Fonction utilitaire pour récupérer le canal de logs
    const getLogChannel = async () => {
        return await client.channels.fetch(logChannelId);
    };

    client.on(Events.MessageCreate, async message => {
        if (message.author.bot) return;

        const logChannel = await getLogChannel();
        const formattedDate = formatDate(message.createdTimestamp);

        // Envoyer le log dans le salon Discord
        await sendLogMessage(logChannel, EMOJIS.NEW_MESS, 'NEW_MESS', message.author.tag, message.content, formattedDate);

        try {
            // Incrémenter total_messages_sent pour l'utilisateur
            const user = await User.findOne({ where: { user_id: message.author.id, guild_id: message.guild.id } });
            if (user) {
                await user.increment('total_messages_sent');
                console.log(`User ${user.username} - Total Messages Sent: ${user.total_messages_sent}`);
            } else {
                await User.create({
                    user_id: message.author.id,
                    guild_id: message.guild.id,
                    username: message.author.tag,
                    total_messages_sent: 1,
                });
            }

            // Incrémenter total_messages pour le canal
            const channel = await Channel.findOne({ where: { channel_id: message.channel.id, guild_id: message.guild.id } });
            if (channel) {
                await channel.increment('total_messages');
                console.log(`Channel ${channel.channel_name} - Total Messages: ${channel.total_messages}`);
            } else {
                await Channel.create({
                    channel_id: message.channel.id,
                    guild_id: message.guild.id,
                    channel_name: message.channel.name,
                    total_messages: 1,
                });
            }

            await Message.create({
                message_id: message.id,
                guild_id: message.guild.id,
                user_id: message.author.id,
                channel_id: message.channel.id,
                timestamp: message.createdTimestamp,
            });
            console.log(`Message ${message.id} created in the database.`);
        } catch (error) {
            console.error('Error updating database:', error);
        }
    });

    client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
        if (newMessage.author.bot) return;
        const logChannel = await getLogChannel();
        const formattedDate = formatDate(newMessage.createdTimestamp);
        await sendLogMessage(logChannel, EMOJIS.EDIT_MESS, 'EDIT_MESS', newMessage.author.tag, `${oldMessage.content} -> ${newMessage.content}`, formattedDate);
    });

    client.on(Events.MessageDelete, async message => {
        if (message.author.bot) return;
        const logChannel = await getLogChannel();
        const formattedDate = formatDate(message.createdTimestamp);
        await sendLogMessage(logChannel, EMOJIS.DEL_MESS, 'DEL_MESS', message.author.tag, message.content, formattedDate);
    });

    client.on(Events.MessageReactionAdd, async (reaction, user) => {
        if (user.bot) return;
        const logChannel = await getLogChannel();
        const formattedDate = formatDate(Date.now());
        await sendLogMessage(logChannel, EMOJIS.ADD_REACT, 'ADD_REACT', user.tag, reaction.emoji.name, formattedDate);

        // Enregistrer dans la base de données
        await User.increment('total_reactions', { where: { user_id: user.id, guild_id: reaction.message.guild.id } });
    });

    client.on(Events.MessageReactionRemove, async (reaction, user) => {
        if (user.bot) return;
        const logChannel = await getLogChannel();
        const formattedDate = formatDate(Date.now());
        await sendLogMessage(logChannel, EMOJIS.REM_REACT, 'REM_REACT', user.tag, reaction.emoji.name, formattedDate);
    });

    client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
        if (oldState.member.user.bot || newState.member.user.bot) return;

        const logChannel = await getLogChannel();
        const formattedDate = formatDate(Date.now());
        const user = newState.member.user.tag;
        const action = oldState.channelId === null && newState.channelId !== null
            ? `JOIN_VOICE   ${newState.channel.name}`
            : `LEAVE_VOICE   ${oldState.channel.name}`;

        await sendLogMessage(logChannel, EMOJIS.VOICE, action, user, '', formattedDate);

        if (oldState.channelId === null && newState.channelId !== null) {
            // Vérifier si le canal vocal existe
            let channel = await Channel.findOne({ where: { channel_id: newState.channelId, guild_id: newState.guild.id } });
            if (!channel) {
                // Ajouter le canal s'il n'existe pas
                channel = await Channel.create({
                    channel_id: newState.channelId,
                    guild_id: newState.guild.id,
                    channel_name: newState.channel.name,
                });
            }

            // Vérifier si l'utilisateur existe
            let dbUser = await User.findOne({ where: { user_id: newState.member.user.id, guild_id: newState.guild.id } });
            if (!dbUser) {
                // Ajouter l'utilisateur s'il n'existe pas
                dbUser = await User.create({
                    user_id: newState.member.user.id,
                    guild_id: newState.guild.id,
                    username: newState.member.user.tag,
                });
            }

            // Connexion vocale
            await VoiceConnection.create({
                connection_id: `${newState.member.user.id}-${newState.channelId}-${Date.now()}`,
                guild_id: newState.guild.id,
                user_id: newState.member.user.id,
                channel_id: newState.channelId,
                connection_time: Date.now(),
            });
        } else if (oldState.channelId !== null && newState.channelId === null) {
            // Déconnexion vocale
            const connection = await VoiceConnection.findOne({
                where: { user_id: oldState.member.user.id, channel_id: oldState.channelId, disconnection_time: null, guild_id: oldState.guild.id },
            });
            if (connection) {
                connection.disconnection_time = Date.now();
                await connection.save();

                // Calculer et incrémenter le temps vocal
                const voiceTime = connection.disconnection_time - connection.connection_time;
                await User.increment('total_voice_time', { by: voiceTime, where: { user_id: oldState.member.user.id, guild_id: oldState.guild.id } });
            }
        }
    });

    client.on(Events.GuildMemberAdd, async member => {
        if (member.user.bot) return;
        const logChannel = await getLogChannel();
        const formattedDate = formatDate(Date.now());
        await sendLogMessage(logChannel, EMOJIS.JOIN_SERVER, 'JOIN_SERVER', member.user.tag, '', formattedDate);
    });

    client.on(Events.GuildMemberRemove, async member => {
        if (member.user.bot) return;
        const logChannel = await getLogChannel();
        const formattedDate = formatDate(Date.now());
        await sendLogMessage(logChannel, EMOJIS.LEAVE_SERVER, 'LEAVE_SERVER', member.user.tag, '', formattedDate);
    });

    client.on(Events.GuildBanAdd, async (guild, user) => {
        if (user.bot) return;
        const logChannel = await getLogChannel();
        const formattedDate = formatDate(Date.now());
        await sendLogMessage(logChannel, EMOJIS.BAN_USER, 'BAN_USER', user.tag, '', formattedDate);
    });

    client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
        if (oldMember.user.bot) return;
        const logChannel = await getLogChannel();
        if (!logChannel) return;

        const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
        const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));
        const formattedDate = formatDate(Date.now());

        const fetchAuditLogs = async (actionType) => {
            const auditLogs = await newMember.guild.fetchAuditLogs({
                type: actionType,
                limit: 5
            });

            const auditEntry = auditLogs.entries.find(entry =>
                entry.target && entry.target.id === newMember.id &&
                (actionType === 24) &&
                (addedRoles.size > 0 ? addedRoles.some(role => entry.changes.some(change => change.new && change.new.id === role.id)) :
                    removedRoles.size > 0 ? removedRoles.some(role => entry.changes.some(change => change.old && change.old.id === role.id)) :
                        false)
            );

            return auditEntry ? auditEntry.executor : null;
        };

        if (addedRoles.size > 0) {
            const roleNames = addedRoles.map(role => role.name).join(', ');
            const executor = await fetchAuditLogs(24);
            await sendLogMessage(logChannel, EMOJIS.ADD_ROLE, 'ADD_ROLE', newMember.user.tag, `${roleNames} par ${executor ? executor.tag : 'Inconnu'}`, formattedDate);
        }

        if (removedRoles.size > 0) {
            const roleNames = removedRoles.map(role => role.name).join(', ');
            const executor = await fetchAuditLogs(24);
            await sendLogMessage(logChannel, EMOJIS.REM_ROLE, 'REM_ROLE', newMember.user.tag, `${roleNames} par ${executor ? executor.tag : 'Inconnu'}`, formattedDate);
        }
    });
};
