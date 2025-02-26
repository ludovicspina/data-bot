const { Events, EmbedBuilder } = require('discord.js');

module.exports = (client) => {
    const logChannelId = '1344335492224647188'; // ID du salon où les logs seront envoyés

    // Fonction utilitaire pour envoyer des messages de log formatés
    const sendLogMessage = async (logChannel, color, title, description, fields, footer) => {
        if (logChannel) {
            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle(title);

            // Ajouter la description uniquement si elle n'est pas vide
            if (description) {
                embed.setDescription(description);
            }

            if (fields) {
                for (const field of fields) {
                    embed.addFields(field);
                }
            }

            if (footer) {
                embed.setFooter({ text: footer });
            }

            await logChannel.send({ embeds: [embed] });
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
        const fields = [
            { name: 'Auteur', value: message.author.tag, inline: true },
            { name: 'Contenu', value: message.content, inline: false },
            { name: 'Salon', value: `[${message.channel.name}](${message.url})`, inline: true }
        ];

        await sendLogMessage(logChannel, 0x00FF00, 'Nouveau Message', '', fields, `Date: ${formattedDate}`);
    });

    client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
        if (newMessage.author.bot) return;

        const logChannel = await client.channels.fetch(logChannelId);
        const formattedDate = formatDate(newMessage.createdTimestamp);
        const fields = [
            { name: 'Auteur', value: newMessage.author.tag, inline: true },
            { name: 'Ancien Contenu', value: oldMessage.content, inline: false },
            { name: 'Nouveau Contenu', value: newMessage.content, inline: false },
            { name: 'Salon', value: `[${newMessage.channel.name}](${newMessage.url})`, inline: true }
        ];

        await sendLogMessage(logChannel, 0x0000FF, 'Message Édité', '', fields, `Date: ${formattedDate}`);
    });

    client.on(Events.MessageDelete, async message => {
        if (message.author.bot) return;

        const logChannel = await client.channels.fetch(logChannelId);
        const formattedDate = formatDate(message.createdTimestamp);
        const fields = [
            { name: 'Auteur', value: message.author.tag, inline: true },
            { name: 'Contenu', value: message.content, inline: false },
            { name: 'Salon', value: `[${message.channel.name}](${message.url})`, inline: true }
        ];

        await sendLogMessage(logChannel, 0xFF0000, 'Message Supprimé', '', fields, `Date: ${formattedDate}`);
    });

    client.on(Events.MessageReactionAdd, async (reaction, user) => {
        if (user.bot) return;

        const logChannel = await client.channels.fetch(logChannelId);
        const formattedDate = formatDate(Date.now());
        const fields = [
            { name: 'Utilisateur', value: user.tag, inline: true },
            { name: 'Émoji', value: reaction.emoji.name, inline: true },
            { name: 'Salon', value: `[${reaction.message.channel.name}](${reaction.message.url})`, inline: true }
        ];

        await sendLogMessage(logChannel, 0x00FF00, 'Réaction Ajoutée', '', fields, `Date: ${formattedDate}`);
    });

    client.on(Events.MessageReactionRemove, async (reaction, user) => {
        if (user.bot) return;

        const logChannel = await client.channels.fetch(logChannelId);
        const formattedDate = formatDate(Date.now());
        const fields = [
            { name: 'Utilisateur', value: user.tag, inline: true },
            { name: 'Émoji', value: reaction.emoji.name, inline: true },
            { name: 'Salon', value: `[${reaction.message.channel.name}](${reaction.message.url})`, inline: true }
        ];

        await sendLogMessage(logChannel, 0xFF0000, 'Réaction Retirée', '', fields, `Date: ${formattedDate}`);
    });

    client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
        if (oldState.member.user.bot || newState.member.user.bot) return;

        const logChannel = await client.channels.fetch(logChannelId);
        const formattedDate = formatDate(Date.now());
        const user = newState.member.user.tag;
        const action = oldState.channelId === null && newState.channelId !== null
            ? `Rejoint le salon vocal | ${newState.channel.name}`
            : `Quitte le salon vocal | ${oldState.channel.name}`;

        const fields = [
            { name: 'Utilisateur', value: user, inline: true },
            { name: 'Action', value: action, inline: true }
        ];

        await sendLogMessage(logChannel, 0xFFA500, 'Mise à Jour Vocale', '', fields, `Date: ${formattedDate}`);
    });

    client.on(Events.GuildMemberAdd, async member => {
        if (member.user.bot) return;

        const logChannel = await client.channels.fetch(logChannelId);
        const formattedDate = formatDate(Date.now());
        const fields = [
            { name: 'Utilisateur', value: member.user.tag, inline: true }
        ];

        await sendLogMessage(logChannel, 0xFF0000, 'Rejoint le Serveur', '', fields, `Date: ${formattedDate}`);
    });

    client.on(Events.GuildMemberRemove, async member => {
        if (member.user.bot) return;

        const logChannel = await client.channels.fetch(logChannelId);
        const formattedDate = formatDate(Date.now());
        const fields = [
            { name: 'Utilisateur', value: member.user.tag, inline: true }
        ];

        await sendLogMessage(logChannel, 0x0000FF, 'Quitte le Serveur', '', fields, `Date: ${formattedDate}`);
    });

    client.on(Events.GuildBanAdd, async (guild, user) => {
        if (user.bot) return;

        const logChannel = await client.channels.fetch(logChannelId);
        const formattedDate = formatDate(Date.now());
        const fields = [
            { name: 'Utilisateur', value: user.tag, inline: true }
        ];

        await sendLogMessage(logChannel, 0xFF0000, 'Utilisateur Banni', '', fields, `Date: ${formattedDate}`);
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
            const fields = [
                { name: 'Utilisateur', value: newMember.user.tag, inline: true },
                { name: 'Rôles Ajoutés', value: roleNames, inline: true },
                { name: 'Par', value: executor ? executor.tag : 'Inconnu', inline: true }
            ];

            await sendLogMessage(logChannel, 0x00FF00, 'Rôles Ajoutés', '', fields, `Date: ${formattedDate}`);
        }

        if (removedRoles.size > 0) {
            const roleNames = removedRoles.map(role => role.name).join(', ');
            const executor = await fetchAuditLogs(24);
            const fields = [
                { name: 'Utilisateur', value: newMember.user.tag, inline: true },
                { name: 'Rôles Retirés', value: roleNames, inline: true },
                { name: 'Par', value: executor ? executor.tag : 'Inconnu', inline: true }
            ];

            await sendLogMessage(logChannel, 0xFF0000, 'Rôles Retirés', '', fields, `Date: ${formattedDate}`);
        }
    });
};
