// index.js

const fs = require('node:fs');
const path = require('node:path');
const {Client, Events, GatewayIntentBits, Collection} = require('discord.js');
const sequelize = require('./database/database');
require("dotenv").config();

const client = new Client({
    intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildExpressions,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessagePolls,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.MessageContent,
    ],
});

// Syncro DB
sequelize.sync().then(() => {
    console.log('Base de données synchronisée');
}).catch(err => {
    console.error('Erreur lors de la synchronisation de la base de données :', err);
});

// Initialisation des commandes
const foldersPath = path.join(__dirname, 'features');
const commandFolders = fs.readdirSync(foldersPath);
client.commands = new Collection();

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

// Vérification des interactions
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: 'Une erreur est survenue lors de l\'exécution de cette commande.',
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: 'Une erreur est survenue lors de l\'exécution de cette commande.',
                ephemeral: true
            });
        }
    }
});

// Importer les écouteurs d'événements
require('./features/data/listen')(client);

// Ready up
client.once(Events.ClientReady, readyClient => {
    console.log(`Up as ${readyClient.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
