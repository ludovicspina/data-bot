const { SlashCommandBuilder } = require('discord.js');
const PDFDocument = require('pdfkit');
const fs = require('fs').promises; // Utiliser fs.promises pour async/await

module.exports = {
    data: new SlashCommandBuilder()
        .setName('transcript')
        .setDescription('Génère un PDF des messages d\'un salon ou d\'une catégorie')
        .addChannelOption(option =>
            option.setName('salon')
                .setDescription('Le salon dont vous souhaitez récupérer l\'historique')
                .setRequired(true)
        ),

    async execute(interaction) {
        // Vérification des permissions d'administrateur
        const { PermissionsBitField } = require('discord.js');

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'Seuls les administrateurs peuvent utiliser cette commande.', ephemeral: true });
        }

        const commandName = interaction.options.getString('commande');


        const channel = interaction.options.getChannel('salon');

        if (!channel.isTextBased()) {
            return interaction.reply({ content: 'Le salon sélectionné n\'est pas un salon texte.', ephemeral: true });
        }

        await interaction.reply({ content: `Génération du transcript pour le salon : ${channel.name}...`, ephemeral: true });

        try {
            const messages = await fetchMessages(channel);
            const filePath = `./transcripts/${channel.name}_transcript.pdf`;
            await generatePDF(messages, channel.name, filePath);

            await interaction.followUp({
                content: 'Voici le transcript :',
                files: [filePath],
            });

            // Suppression du fichier après l'envoi
            await fs.unlink(filePath);
            console.log(`Le fichier ${filePath} a été supprimé avec succès.`);
        } catch (error) {
            console.error(error);
            await interaction.followUp({ content: 'Une erreur est survenue lors de la génération du PDF.', ephemeral: true });
        }
    },
};

// Fonction pour récupérer les messages
async function fetchMessages(channel) {
    let messages = [];
    let lastId;

    while (true) {
        const fetchedMessages = await channel.messages.fetch({ limit: 100, before: lastId });
        if (fetchedMessages.size === 0) break;
        messages = messages.concat(Array.from(fetchedMessages.values()));
        lastId = fetchedMessages.last().id;
    }

    return messages.reverse();
}

// Fonction pour générer le PDF
async function generatePDF(messages, channelName, filePath) {
    return new Promise((resolve, reject) => {
        const PDFDocument = require('pdfkit');
        const fs = require('fs');
        const path = require('path');

        if (!fs.existsSync('./transcripts')) {
            fs.mkdirSync('./transcripts', { recursive: true });
        }

        const doc = new PDFDocument();
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        doc.fontSize(20).text(`Transcript du salon #${channelName}`, { align: 'center' });
        doc.moveDown(2);

        messages.forEach((msg) => {
            const date = msg.createdAt.toLocaleString();
            doc.fontSize(12).text(`[${date}] ${msg.author.tag}: ${msg.content}`);
            doc.moveDown(0.5);
        });

        doc.end();

        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
    });
}
