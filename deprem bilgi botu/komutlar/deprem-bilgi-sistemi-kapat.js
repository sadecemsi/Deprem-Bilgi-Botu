const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deprem-bilgi-sistemi-kapat')
    .setDescription('Deprem bilgi sistemini kapatır')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction, client) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Bu komutu kullanmak için yönetici yetkisine sahip olmalısınız!', ephemeral: true });
    }

    if (!client.depremKanali) {
      return interaction.reply('❌ Deprem bilgi sistemi zaten kapalı.');
    }

    client.depremKanali = null;
    if (client.depremKontrolIntervalId) {
      clearInterval(client.depremKontrolIntervalId);
      client.depremKontrolIntervalId = null;
    }
    interaction.reply('✅ Deprem bilgi sistemi kapatıldı.');
  },
};