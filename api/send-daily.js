import { BanglaDate } from "bangla-calendar";
import hijri from "hijri-js";
import moment from "moment-timezone";
import fetch from "node-fetch";
import SunCalc from "suncalc";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TARGET_CHAT = process.env.TARGET_CHAT_ID;
const TZ = process.env.TZ || "Asia/Dhaka";
const LAT = parseFloat(process.env.LAT || "23.8103");
const LON = parseFloat(process.env.LON || "90.4125");

function banglaWeekday(eng) {
  const map = {
    Sunday: "রবিবার",
    Monday: "সোমবার",
    Tuesday: "মঙ্গলবার",
    Wednesday: "বুধবার",
    Thursday: "বৃহস্পতিবার",
    Friday: "শুক্রবার",
    Saturday: "শনিবার",
  };
  return map[eng] || eng;
}

function getHijriDate(m) {
  const h = hijri.convert(new Date(m.format("YYYY-MM-DD")));
  const months = [
    "মুহাররম",
    "সফর",
    "রবিউল আউয়াল",
    "রবিউস সানি",
    "জমাদিউল আউয়াল",
    "জমাদিউস সানি",
    "রজব",
    "শাবান",
    "রমযান",
    "শাওয়াল",
    "জিলক্বদ",
    "জিলহজ",
  ];
  return {
    day: h.hd,
    monthName: months[h.hm - 1],
    year: h.hy,
  };
}

function season(m) {
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

    // Bengali Date
    const bd = new BanglaDate(now.toDate());
    const bnDate = bd.getDate();
    const bnMonth = bd.getMonthName();
    const bnYear = bd.getYear();

    // Hijri Date
    const hijriDate = getHijriDate(now);

    // Sunrise/Sunset
    const times = SunCalc.getTimes(now.toDate(), LAT, LON);
    const sunrise = moment(times.sunrise).tz(TZ).format("HH:mm");
    const sunset = moment(times.sunset).tz(TZ).format("HH:mm");

    const msg = `
আসসালামু আলাইকুম ওয়ারাহমাতুল্লাহ্।
🟧 আজ ${banglaWeekday(now.format("dddd"))}।
🟩 ${now.format("DD MMMM YYYY")} খ্রিষ্টাব্দ।
🟦 ${bnDate} ${bnMonth} ${bnYear} বঙ্গাব্দ।
🟪 ${hijriDate.day} ${hijriDate.monthName} ${hijriDate.year} হিজরী।
🌅 ঋতু: ${season(now)}।
🌄 সূর্যোদয়: ${sunrise} মিনিট।
⏺ সূর্যাস্ত: ${sunset} মিনিট।
`;

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TARGET_CHAT, text: msg }),
    });

    res.status(200).json({ ok: true, sent: true });

  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.toString() });
  }
        }
