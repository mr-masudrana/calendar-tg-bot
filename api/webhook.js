import fetch from 'node-fetch';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).send("OK");

  const update = req.body;
  const msg = update.message;

  if (msg?.text === "/start") {
    await sendMessage(msg.chat.id, "আসসালামু আলাইকুম! ডেইলি মেসেজ বট অ্যাক্টিভ।");
  }

  return res.status(200).json({ ok: true });
}

async function sendMessage(chatId, text) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text })
  });
}
