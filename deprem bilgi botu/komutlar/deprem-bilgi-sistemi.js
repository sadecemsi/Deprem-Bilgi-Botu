const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const axios = require('axios');

let lastEarthquakeTime = 0;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deprem-bilgi-sistemi')
    .setDescription('Deprem bilgi sistemini belirtilen kanalda başlatır')
    .addChannelOption(option => 
      option.setName('kanal')
        .setDescription('Deprem bilgilerinin gönderileceği kanal')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction, client) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Bu komutu kullanmak için yönetici yetkisine sahip olmalısınız!', ephemeral: true });
    }

    const channel = interaction.options.getChannel('kanal');
    
    if (!channel.isTextBased()) {
      return interaction.reply({ content: '❌ Lütfen bir metin kanalı seçin!', ephemeral: true });
    }

    if (client.depremKanali) {
      return interaction.reply(`❗ Deprem bilgi sistemi zaten ${client.depremKanali} kanalında aktif.`);
    }

    client.depremKanali = channel;
    interaction.reply(`✅ Deprem bilgi sistemi ${channel} kanalında aktif edildi.`);
    channel.send('🚨 Deprem bilgi sistemi başlatıldı! Yeni depremler burada görüntülenecek.');

    // Deprem kontrolü başlat
    if (!client.depremKontrolIntervalId) {
      client.depremKontrolIntervalId = setInterval(() => checkEarthquakes(client), 5 * 60 * 1000);
    }
  },
};

async function checkEarthquakes(client) {
  try {
    const response = await axios.get('https://www.msii.xyz/api/deprem');
    const earthquakes = response.data.result;

    if (client.depremKanali && earthquakes.length > 0) {
      const latestEarthquake = earthquakes[0];
      const newEarthquakeTime = new Date(latestEarthquake.unix_timestamp * 1000).getTime();

      if (newEarthquakeTime > lastEarthquakeTime) {
        lastEarthquakeTime = newEarthquakeTime;

        const mapUrl = `https://www.google.com/maps?q=${latestEarthquake.coordinates.latitude},${latestEarthquake.coordinates.longitude}`;
        
        const embed = new EmbedBuilder()
          .setColor('#FF4500')
          .setTitle('🚨 Yeni Deprem Bilgisi 🚨')
          .setDescription(`📍 **Lokasyon:** ${latestEarthquake.location}`)
          .addFields(
            { name: '🌍 Koordinatlar', value: `${latestEarthquake.coordinates.latitude}°, ${latestEarthquake.coordinates.longitude}°`, inline: true },
            { name: '📏 Şiddet', value: `${latestEarthquake.magnitude} Mw`, inline: true },
            { name: '🔍 Derinlik', value: `${latestEarthquake.depth} km`, inline: true },
            { name: '🕰️ Zaman', value: new Date(newEarthquakeTime).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }) },
            { name: '🗺️ Harita', value: `[Google Maps'te Görüntüle](${mapUrl})` }
          )
          .setTimestamp()
          .setFooter({ text: 'Deprem Bilgi Sistemi' });

        client.depremKanali.send({ embeds: [embed] });
      }
    }
  } catch (error) {
    console.error('Deprem verisi alınamadı:', error.message);
    if (client.depremKanali) {
      await client.depremKanali.send('⚠️ Deprem verisi şu anda alınamıyor. Lütfen daha sonra tekrar deneyin.');
    }
  }
}