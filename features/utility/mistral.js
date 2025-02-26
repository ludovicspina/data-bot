const { SlashCommandBuilder } = require('discord.js');
const { Mistral } = require('@mistralai/mistralai');
require('dotenv').config();

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

const client = new Mistral({ apiKey: MISTRAL_API_KEY });

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mistral')
        .setDescription('Pose une question à Mistral.ai')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('La question que tu veux poser à Mistral.ai')
                .setRequired(true)),
    async execute(interaction) {
        const question = interaction.options.getString('question');

        await interaction.deferReply(); // Permet au bot de prendre du temps pour répondre

        try {
            const chatResponse = await client.chat.complete({
                model: 'mistral-tiny', // Remplacez par le modèle approprié si nécessaire
                messages: [{ role: 'user', content: question }],
            });

            const answer = chatResponse.choices[0].message.content;

            // Affiche la question avant la réponse
            await interaction.editReply(`**Question :** ${question}`);

            // Diviser la réponse en segments de 2000 caractères
            const messages = answer.match(/[\s\S]{1,2000}/g);

            for (const msg of messages) {
                await interaction.followUp(msg);
            }
        } catch (error) {
            console.error(error);
            await interaction.editReply("Une erreur est survenue lors de la requête à l'API Mistral.");
        }
    },
};
