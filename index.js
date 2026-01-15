import express from "express";
import fetch from "node-fetch";
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";

/* =====================
   Fake Web (Render)
===================== */
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (_, res) => res.send("bot start"));
app.listen(PORT);

/* =====================
   Discord Client
===================== */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("ready", () => {
  console.log("🤖 Bot ready:", client.user.tag);
});

/* =====================
   Commands
===================== */
client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  if (msg.content === "!ping") {
    return msg.reply("🏓 البوت شغال!");
  }

  if (msg.content.startsWith("!بحث")) {
    const query = msg.content.replace("!بحث", "").trim();
    if (!query) return msg.reply("❌ اكتب كلمة البحث");

    try {
      const r = await fetch(
        `https://krbaq.onrender.com/api/search?q=${encodeURIComponent(query)}`
      );
      const data = await r.json();

      if (!data.results || data.results.length === 0) {
        return msg.reply("❌ لا توجد نتائج");
      }

      // خذ الأكثر مشاهدة
      data.results.sort((a, b) => (b.views || 0) - (a.views || 0));
      const s = data.results[0];

      const embed = new EmbedBuilder()
        .setTitle(s.title || "بدون عنوان")
        .setDescription(
          (s.description || "لا يوجد وصف").slice(0, 300)
        )
        .setImage(s.image || null)
        .setColor(0x22c55e)
        .addFields(
          { name: "👁️ المشاهدات", value: String(s.views || 0), inline: true },
          {
            name: "🔑 الحالة",
            value: s.keySystem ? "بمفتاح" : "بدون مفتاح",
            inline: true
          },
          {
            name: "👨‍💻 المطور",
            value: s.user?.username || "غير معروف",
            inline: true
          }
        )
        .setFooter({ text: "KRB Scripts" });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`script_${s.rawScript}`)
          .setLabel("📋 عرض السكربت")
          .setStyle(ButtonStyle.Primary)
      );

      msg.reply({ embeds: [embed], components: [row] });

    } catch (e) {
      console.error(e);
      msg.reply("❌ خطأ أثناء البحث");
    }
  }
});

/* =====================
   Button Interaction
===================== */
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId.startsWith("script_")) {
    const url = interaction.customId.replace("script_", "");

    try {
      const r = await fetch(url);
      const script = await r.text();

      if (!script || script.length < 10) {
        return interaction.reply({
          content: "❌ فشل جلب السكربت",
          ephemeral: true
        });
      }

      // حد دسكورد
      const safe = script.slice(0, 1900);

      await interaction.reply({
        content: "```lua\n" + safe + "\n```",
        ephemeral: true
      });

    } catch {
      interaction.reply({
        content: "❌ حصل خطأ",
        ephemeral: true
      });
    }
  }
});

/* =====================
   Login
===================== */
client.login(process.env.DISCORD_TOKEN);
