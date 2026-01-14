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

/* ========== Fake Web (Render) ========== */
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (_, res) => res.send("bot start"));
app.listen(PORT);

/* ========== Discord Bot ========== */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const sessions = new Map();

client.once("ready", () => {
  console.log("🤖 Bot ready");
});

/* ========== Helpers ========== */
function buildEmbed(script, index, total) {
  return new EmbedBuilder()
    .setTitle(script.title || "بدون عنوان")
    .setDescription(
      (script.description || "لا يوجد وصف")
        .replace(/\n+/g, " ")
        .slice(0, 300)
    )
    .setColor(0x22c55e)
    .setImage(script.image || null)
    .addFields(
      { name: "👁️ المشاهدات", value: String(script.views || 0), inline: true },
      {
        name: "🔑 الحالة",
        value: script.keySystem ? "بمفتاح" : "بدون مفتاح",
        inline: true
      }
    )
    .setFooter({ text: `النتيجة ${index + 1} من ${total}` });
}

function buildButtons(i, total) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("prev")
      .setLabel("⬅️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(i === 0),
    new ButtonBuilder()
      .setCustomId("next")
      .setLabel("➡️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(i === total - 1)
  );
}

/* ========== Commands ========== */
client.on("messageCreate", async msg => {
  if (msg.author.bot) return;

  if (msg.content === "!ping") {
    return msg.reply("🏓 البوت شغال!");
  }

  if (msg.content.startsWith("!بحث")) {
    const q = msg.content.replace("!بحث", "").trim();
    if (!q) return msg.reply("❌ اكتب كلمة البحث");

    try {
      const r = await fetch(
        `https://krbaq.onrender.com/api/search?q=${encodeURIComponent(q)}`
      );
      const data = await r.json();

      if (!data.results || data.results.length === 0) {
        return msg.reply("❌ لا توجد نتائج");
      }

      // ترتيب بالأكثر مشاهدة
      data.results.sort((a, b) => (b.views || 0) - (a.views || 0));

      sessions.set(msg.author.id, {
        index: 0,
        results: data.results
      });

      const embed = buildEmbed(data.results[0], 0, data.results.length);
      const row = buildButtons(0, data.results.length);

      return msg.reply({ embeds: [embed], components: [row] });

    } catch (e) {
      console.error(e);
      return msg.reply("❌ فشل الاتصال بالموقع");
    }
  }
});

/* ========== Buttons ========== */
client.on("interactionCreate", async i => {
  if (!i.isButton()) return;

  const session = sessions.get(i.user.id);
  if (!session) return i.deferUpdate();

  if (i.customId === "next") session.index++;
  if (i.customId === "prev") session.index--;

  const embed = buildEmbed(
    session.results[session.index],
    session.index,
    session.results.length
  );
  const row = buildButtons(session.index, session.results.length);

  await i.update({ embeds: [embed], components: [row] });
});

/* ========== Login ========== */
client.login(process.env.DISCORD_TOKEN);
