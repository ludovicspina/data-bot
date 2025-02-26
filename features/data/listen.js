const { Events } = require('discord.js');

module.exports = (client) => {
    const logChannelId = '1344335492224647188'; // ID du salon où les logs seront envoyés

    // Fonction utilitaire pour envoyer des messages de log formatés
    const sendLogMessage = async (logChannel, emoji, action, user, content, date) => {
        if (logChannel) {
            logChannel.send(`${emoji} **${action}** | ${user} | ${content} | ${date}`);
        }
    };

    // Fonction utilitaire pour formater la date
    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} - ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    client.on(Events.MessageCreate, async message => {
        if (message.author.bot) return;

        const logChannel = await client.channels.fetch(logChannelId);
        const formattedDate = formatDate(message.createdTimestamp);
        await sendLogMessage(logChannel, '<:greenarr:1344347076615606394>', 'NEW_MESS', message.author.tag, message.content, formattedDate);
    });

    client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
        if (newMessage.author.bot) return;

        const logChannel = await client.channels.fetch(logChannelId);
        const formattedDate = formatDate(newMessage.createdTimestamp);
        await sendLogMessage(logChannel, '<:bluearr:1344346432865435679>', 'EDIT_MESS', newMessage.author.tag, `${oldMessage.content} -> ${newMessage.content}`, formattedDate);
    });

    client.on(Events.MessageDelete, async message => {
        if (message.author.bot) return;

        const logChannel = await client.channels.fetch(logChannelId);
        const formattedDate = formatDate(message.createdTimestamp);
        await sendLogMessage(logChannel, '<:redarr:1344346399679971410>', 'DEL_MESS', message.author.tag, message.content, formattedDate);
    });

    client.on(Events.MessageReactionAdd, async (reaction, user) => {
        if (user.bot) return;

        const logChannel = await client.channels.fetch(logChannelId);
        const formattedDate = formatDate(Date.now());
        await sendLogMessage(logChannel, '<:greenarr:1344347076615606394>', 'ADD_REACT', user.tag, reaction.emoji.name, formattedDate);
    });

    client.on(Events.MessageReactionRemove, async (reaction, user) => {
        if (user.bot) return;

        const logChannel = await client.channels.fetch(logChannelId);
        const formattedDate = formatDate(Date.now());
        await sendLogMessage(logChannel, '<:redarr:1344346399679971410>', 'REM_REACT', user.tag, reaction.emoji.name, formattedDate);
    });

    client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
        if (oldState.member.user.bot || newState.member.user.bot) return;

        const logChannel = await client.channels.fetch(logChannelId);
        const formattedDate = formatDate(Date.now());
        const user = newState.member.user.tag;
        const action = oldState.channelId === null && newState.channelId !== null
            ? `JOIN_VOICE | ${newState.channel.name}`
            : `LEAVE_VOICE | ${oldState.channel.name}`;

        await sendLogMessage(logChannel, '<:voice:1344349315585413180>', action, user, '', formattedDate);
    });

    client.on(Events.GuildMemberAdd, async member => {
        if (member.user.bot) return;

        const logChannel = await client.channels.fetch(logChannelId);
        const formattedDate = formatDate(Date.now());
        await sendLogMessage(logChannel, '<:redup:1344349388096405546>', 'JOIN_SERVER', member.user.tag, '', formattedDate);
    });

    client.on(Events.GuildMemberRemove, async member => {
        if (member.user.bot) return;

        const logChannel = await client.channels.fetch(logChannelId);
        const formattedDate = formatDate(Date.now());
        await sendLogMessage(logChannel, '<:bluedown:1344349425593618432>', 'LEAVE_SERVER', member.user.tag, '', formattedDate);
    });

    client.on(Events.GuildBanAdd, async (guild, user) => {
        if (user.bot) return;

        const logChannel = await client.channels.fetch(logChannelId);
        const formattedDate = formatDate(Date.now());
        await sendLogMessage(logChannel, '<:ban:1344349582397538344>', 'BAN_USER', user.tag, '', formattedDate);
    });

    client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
        if (oldMember.user.bot) return;

        const logChannel = await client.channels.fetch(logChannelId);
        if (!logChannel) return;

        // Déterminez les rôles ajoutés et retirés
        const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
        const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));

        const formattedDate = formatDate(Date.now());

        const fetchAuditLogs = async (actionType) => {
            const auditLogs = await newMember.guild.fetchAuditLogs({
                type: actionType,
                limit: 5 // Récupérer plus d'entrées pour mieux filtrer
            });

            // Filtrer les entrées pour trouver celle qui correspond à l'utilisateur modifié
            const auditEntry = auditLogs.entries.find(entry =>
                entry.target && entry.target.id === newMember.id &&
                (actionType === 24) && // MEMBER_ROLE_UPDATE
                (addedRoles.size > 0 ? addedRoles.some(role => entry.changes.some(change => change.new && change.new.id === role.id)) :
                    removedRoles.size > 0 ? removedRoles.some(role => entry.changes.some(change => change.old && change.old.id === role.id)) :
                        false)
            );

            return auditEntry ? auditEntry.executor : null;
        };

        if (addedRoles.size > 0) {
            const roleNames = addedRoles.map(role => role.name).join(', ');
            const executor = await fetchAuditLogs(24);
            await sendLogMessage(logChannel, '<:greenarr:1344347076615606394>', 'ADD_ROLE', newMember.user.tag, `${roleNames} par ${executor ? executor.tag : 'Inconnu'}`, formattedDate);
        }

        if (removedRoles.size > 0) {
            const roleNames = removedRoles.map(role => role.name).join(', ');
            const executor = await fetchAuditLogs(24);
            await sendLogMessage(logChannel, '<:redarr:1344346399679971410>', 'REM_ROLE', newMember.user.tag, `${roleNames} par ${executor ? executor.tag : 'Inconnu'}`, formattedDate);
        }
    });






};
