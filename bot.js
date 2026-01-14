import { Client, GatewayIntentBits } from "discord.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("ready", () => {
  console.log(`🤖 Bot logged in as ${client.user.tag}`);
});

client.on("messageCreate", msg => {
  if (msg.content === "!ping") {
    msg.reply("🏓 البوت شغال!");
  }
});

client.login(process.env.DISCORD_TOKEN);
