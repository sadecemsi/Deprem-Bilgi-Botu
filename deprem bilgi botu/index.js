const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const { token } = require('./ayarlar.json');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.commands = new Collection();
const commandFiles = fs.readdirSync('./komutlar').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./komutlar/${file}`);
  client.commands.set(command.data.name, command);
}

client.once('ready', async () => {
  console.log(`${client.user.tag} olarak giriş yapıldı!`);
  
  const rest = new REST({ version: '10' }).setToken(token);
  
  try {
    console.log('Slash komutları yükleniyor...');
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: client.commands.map(command => command.data.toJSON()) },
    );
    console.log('Slash komutları başarıyla yüklendi!');
  } catch (error) {
    console.error('Slash komutları yüklenirken hata oluştu:', error);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'Komut yürütülürken bir hata oluştu!', ephemeral: true });
  }
});

client.login(token);