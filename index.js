import express from "express";
import fetch from "node-fetch";
import { Client, GatewayIntentBits } from "discord.js";

/* =========================
   سيرفر ويب وهمي (Render)
========================= */
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("🤖 krb-bot is running");
});

app.listen(PORT, () => {
  console.log("🌐 Web server running on port", PORT);
});

/* =========================
   بوت Discord
========================= */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async message => {
  if (message.author.bot) return;

  /* ping */
  if (message.content === "!ping") {
    message.reply("🏓 البوت شغال!");
  }

  /* بحث */
  if (message.content.startsWith("!بحث")) {
    const q = message.content.replace("!بحث", "").trim();
    if (!q) return message.reply("❌ اكتب كلمة بحث");

    try {
      const r = await fetch(
        `https://krbaq.onrender.com/api/search?q=${encodeURIComponent(q)}`
      );
      const d = await r.json();

      if (!d.results || d.results.length === 0) {
        return message.reply("❌ لا توجد نتائج");
      }

      const s = d.results[0];

      message.reply(
        `📜 **${s.title}**\n` +
        `👁️ المشاهدات: ${s.views || 0}\n` +
        `🔑 ${s.keySystem ? "بمفتاح" : "بدون مفتاح"}`
      );
    } catch (e) {
      console.error(e);
      message.reply("❌ فشل الاتصال بالموقع");
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
