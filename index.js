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

client.on("messageCreate", async message => {
  if (message.author.bot) return;

  /* =====================
     PING
  ===================== */
  if (message.content === "!ping") {
    return message.reply("🏓 البوت شغال!");
  }

  /* =====================
     بحث
  ===================== */
  if (message.content.startsWith("!بحث")) {
    const q = message.content.replace("!بحث", "").trim();
    if (!q) return message.reply("❌ اكتب كلمة البحث");

    try {
      const r = await fetch(
        `https://krbaq.onrender.com/api/search?q=${encodeURIComponent(q)}`
      );
      const d = await r.json();

      if (!d.results || d.results.length === 0) {
        return message.reply("❌ لا توجد نتائج");
      }

      // ترتيب بالأكثر مشاهدة
      d.results.sort((a, b) => (b.views || 0) - (a.views || 0));

      const s = d.results[0];

      const embed = new EmbedBuilder()
        .setTitle(s.title || "بدون عنوان")
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
        .setFooter({
          text: "KRB Scripts"
        });

      await message.reply({ embeds: [embed] });

    } catch (err) {
      console.error(err);
      message.reply("❌ حصل خطأ في البحث");
    }
  }
});

/* =========================
   Login
========================= */
client.login(process.env.DISCORD_TOKEN);
