// api/send-daily.js
import fetch from 'node-fetch';
import SunCalc from 'suncalc';
import moment from 'moment-timezone';
import HijriDate from 'hijri-date';
import { engToBanglaDate } from 'bangla-calendar-converter';

// ENV vars
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TARGET_CHAT = process.env.TARGET_CHAT_ID;
const LAT = parseFloat(process.env.LAT || '23.8103'); 
const LON = parseFloat(process.env.LON || '90.4125');
const TZ = process.env.TZ || 'Asia/Dhaka';

function banglaWeekday(en) {
  const map = {
    Sunday: 'রবিবার',
    Monday: 'সোমবার',
    Tuesday: 'মঙ্গলবার',
    Wednesday: 'বুধবার',
    Thursday: 'বৃহস্পতিবার',
    Friday: 'শুক্রবার',
    Saturday: 'শনিবার'
  };
  return map[en] || en;
}

function getHijri(m) {
  const d = new Date(m.format("YYYY-MM-DD"));
  const h = new HijriDate(d);

  const months = [
    "মুহাররম","সফর","রবিউল আউয়াল","রবিউস সানি","জমাদিউল আউয়াল",
    "জমাদিউস সানি","রজব","শাবান","রমযান","শাওয়াল","জিলক্বদ","জিলহজ"
  ];

  return {
    day: h.getDate(),
    monthName: months[h.getMonth()],
    year: h.getFullYear()
  };
}

function seasonFromBangladesh(m) {
  const month = m.month() + 1;
  if ([12,1,2].includes(month)) return "শীতকাল";
  if ([3,4].includes(month)) return "বসন্তকাল";
  if ([5,6].includes(month)) return "গ্রীষ্মকাল";
  if ([7,8,9,10].includes(month)) return "বর্ষাকাল";
  return "শরৎকাল";
}

export default async function handler(req, res) {
  try {
    const now = moment.tz(TZ);

    const weekdayBn = banglaWeekday(now.format("dddd"));

    // ===== বাংলা ক্যালেন্ডার =====
    const bd = engToBanglaDate(now.year(), now.month() + 1, now.date());

    // ===== হিজরী ক্যালেন্ডার =====
    const hijri = getHijri(now);

    // ===== সূর্যোদয়/সূর্যাস্ত =====
    const times = SunCalc.getTimes(now.toDate(), LAT, LON);
    const sunrise = moment(times.sunrise).tz(TZ).format("HH:mm");
    const sunset = moment(times.sunset).tz(TZ).format("HH:mm");

    const season = seasonFromBangladesh(now);

    const message =
`আসসালামু আলাইকুম ওয়ারাহমাতুল্লাহ্।
🟧 আজ ${weekdayBn}।
🟩 ${now.format("DD MMMM YYYY")} খ্রিষ্টাব্দ।
🟦 ${String(bd.date).padStart(2,'0')} ${bd.monthBangla} ${bd.year} বঙ্গাব্দ।
🟪 ${String(hijri.day).padStart(2,'0')} ${hijri.monthName} ${hijri.year} হিজরী।
🌅 ঋতু - ${season}।
🌄 সূর্যোদয় - ${sunrise} মিনিট।
⏺ সূর্যাস্ত - ${sunset} মিনিট।`;

    // SEND MESSAGE
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TARGET_CHAT,
        text: message
      })
    });

    return res.status(200).json({ ok: true, messageSent: true });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e.toString() });
  }
}
