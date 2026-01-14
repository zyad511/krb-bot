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

/* ============ Fake Site ============ */
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (_, res) => res.send("bot start"));
app.listen(PORT);

/* ============ Discord Bot ============ */
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

async function fetchScripts(keyword) {
  let all = [];
  for (let p = 1; p <= 4; p++) {
    const r = await fetch(`https://rscripts.net/api/v2/scripts?page=${p}`);
    const d = await r.json();
    if (d.scripts) all.push(...d.scripts);
  }

  return all
    .filter(s =>
      s.title?.toLowerCase().includes(keyword) ||
      s.description?.toLowerCase().includes(keyword)
    )
    .sort((a, b) => (b.views || 0) - (a.views || 0));
}

function buildEmbed(script, index, total) {
  return new EmbedBuilder()
    .setTitle(script.title)
    .setDescription(
      (script.description || "لا يوجد وصف").slice(0, 300)
    )
    .setImage(script.image || null)
    .setColor(0x22c55e)
    .addFields(
      { name: "👁️ المشاهدات", value: String(script.views || 0), inline: true },
      { name: "🔑 الحالة", value: script.keySystem ? "بمفتاح" : "بدون مفتاح", inline: true }
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

client.on("messageCreate", async msg => {
  if (msg.author.bot) return;

  if (msg.content === "!ping") {
    return msg.reply("🏓 البوت شغال!");
  }

  if (msg.content.startsWith("!بحث")) {
    const q = msg.content.replace("!بحث", "").trim().toLowerCase();
    if (!q) return msg.reply("❌ اكتب كلمة البحث");

    const results = await fetchScripts(q);
    if (!results.length) return msg.reply("❌ لا توجد نتائج");

    sessions.set(msg.author.id, { results, index: 0 });

    const embed = buildEmbed(results[0], 0, results.length);
    const row = buildButtons(0, results.length);

    return msg.reply({ embeds: [embed], components: [row] });
  }
});

client.on("interactionCreate", async i => {
  if (!i.isButton()) return;

  const s = sessions.get(i.user.id);
  if (!s) return i.deferUpdate();

  if (i.customId === "next") s.index++;
  if (i.customId === "prev") s.index--;

  const embed = buildEmbed(s.results[s.index], s.index, s.results.length);
  const row = buildButtons(s.index, s.results.length);

  await i.update({ embeds: [embed], components: [row] });
});

client.login(process.env.DISCORD_TOKEN);
