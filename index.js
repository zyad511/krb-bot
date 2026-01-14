import express from "express";
import fetch from "node-fetch";
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder
} from "discord.js";

/* =========================
   Fake Website (Render)
========================= */
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("bot start");
});

app.listen(PORT, () => {
  console.log("🌐 Web running on port", PORT);
});

/* =========================
   Discord Bot
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

async function searchScripts(keyword) {
  let scripts = [];

  for (let page = 1; page <= 5; page++) {
    const r = await fetch(
      `https://rscripts.net/api/v2/scripts?page=${page}&orderBy=date&sort=desc`
    );
    const d = await r.json();
    if (d.scripts) scripts.push(...d.scripts);
  }

  return scripts
    .filter(s =>
      s.title?.toLowerCase().includes(keyword) ||
      s.description?.toLowerCase().includes(keyword)
    )
    .sort((a, b) => (b.views || 0) - (a.views || 0));
}

client.on("messageCreate", async message => {
  if (message.author.bot) return;

  /* ping */
  if (message.content === "!ping") {
    return message.reply("🏓 البوت شغال!");
  }

  /* بحث مباشر */
  if (message.content.startsWith("!بحث")) {
    const q = message.content.replace("!بحث", "").trim().toLowerCase();
    if (!q) return message.reply("❌ اكتب كلمة البحث");

    try {
      const results = await searchScripts(q);

      if (results.length === 0) {
        return message.reply("❌ لا توجد نتائج");
      }

      const s = results[0];

      const embed = new EmbedBuilder()
        .setTitle(s.title)
        .setDescription(
          (s.description || "لا يوجد وصف")
            .replace(/\n+/g, " ")
            .slice(0, 300)
        )
        .setColor(0x22c55e)
        .setImage(s.image || null)
        .addFields(
          {
            name: "👁️ المشاهدات",
            value: String(s.views || 0),
            inline: true
          },
          {
            name: "🔑 الحالة",
            value: s.keySystem ? "بمفتاح" : "بدون مفتاح",
            inline: true
          }
        )
        .setFooter({ text: "KRB Scripts" });

      message.reply({ embeds: [embed] });

    } catch (e) {
      console.error(e);
      message.reply("❌ خطأ أثناء البحث");
    }
  }
});

/* =========================
   Login
========================= */
client.login(process.env.DISCORD_TOKEN);
