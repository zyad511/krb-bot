import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";
import fetch from "node-fetch";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ----------------
// إعدادات البوت
// ----------------
const KRB_API = "https://krbaq.onrender.com/api/search"; // رابط موقعك
const sendInterval = 20 * 60 * 1000; // 20 دقيقة
let sentScripts = new Set(); // لتجنب التكرار
let intervalRunning = false;

client.once("ready", () => {
  console.log(`🤖 البوت شغال كـ ${client.user.tag}`);
});

// ----------------
// الرد على !ping
// ----------------
client.on("messageCreate", msg => {
  if (msg.content === "!ping") {
    msg.reply("🏓 البوت شغال!");
  }
});

// ----------------
// البحث عن سكربت
// ----------------
client.on("messageCreate", async msg => {
  if (!msg.content.startsWith("!بحث ")) return;

  const query = msg.content.slice(5).trim();
  if (!query) return msg.reply("اكتب اسم السكربت بعد !بحث");

  try {
    const res = await fetch(`${KRB_API}?q=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      return msg.reply("❌ ما في نتائج للبحث");
    }

    for (let script of data.results.slice(0, 5)) {
      const embed = new EmbedBuilder()
        .setTitle(script.title || script.title_ar)
        .setDescription(
          (script.description || script.description_ar || "بدون وصف").slice(0, 200)
        )
        .setURL(script.rawScript) // رابط السكربت
        .setImage(script.image || null)
        .addFields([
          { name: "🔑 مفتاح", value: script.key ? "نعم" : "لا", inline: true },
          { name: "👁️ مشاهدات", value: String(script.views || 0), inline: true }
        ])
        .setColor("#22c55e");

      msg.channel.send({ embeds: [embed] });
    }
  } catch (err) {
    console.error(err);
    msg.reply("❌ حصل خطأ أثناء البحث");
  }
});

// ----------------
// !ابدا - إرسال سكربتات عشوائية كل 20 دقيقة
// ----------------
client.on("messageCreate", async msg => {
  if (msg.content === "!ابدا") {
    if (intervalRunning) return msg.reply("⚠️ البوت يعمل بالفعل");

    msg.reply("✅ تم تشغيل الإرسال التلقائي للسكربتات");

    intervalRunning = true;

    const channel = msg.channel;

    const sendRandomScript = async () => {
      try {
        const res = await fetch(`${KRB_API}`);
        const data = await res.json();

        const scripts = data.results.filter(s => !sentScripts.has(s._id));
        if (!scripts.length) {
          sentScripts.clear(); // إعادة استخدام السكربتات إذا خلصت
          return;
        }

        const script = scripts[Math.floor(Math.random() * scripts.length)];
        sentScripts.add(script._id);

        const embed = new EmbedBuilder()
          .setTitle(script.title || script.title_ar)
          .setDescription(
            (script.description || script.description_ar || "بدون وصف").slice(0, 200)
          )
          .setURL(script.rawScript)
          .setImage(script.image || null)
          .addFields([
            { name: "🔑 مفتاح", value: script.key ? "نعم" : "لا", inline: true },
            { name: "👁️ مشاهدات", value: String(script.views || 0), inline: true }
          ])
          .setColor("#22c55e");

        channel.send({ embeds: [embed] });
      } catch (err) {
        console.error(err);
      }
    };

    // إرسال أول سكربت مباشرة
    sendRandomScript();

    // بعدين كل 20 دقيقة
    setInterval(sendRandomScript, sendInterval);
  }
});

// ----------------
// تسجيل الدخول
// ----------------
client.login(process.env.DISCORD_TOKEN);
