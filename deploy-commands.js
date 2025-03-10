const { REST, Routes } = require('discord.js');
const { clientId, token } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');

const commands = [];

// Récupérer tous les dossiers de commandes du répertoire features
const foldersPath = path.join(__dirname, 'features');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    // Récupérer tous les fichiers de commandes du répertoire features
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

// Préparer une instance du module REST
const rest = new REST().setToken(token);

// Déployer les commandes globalement
(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // Utiliser la route globale pour enregistrer les commandes
        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands globally.`);
    } catch (error) {
        console.error(error);
    }
})();
