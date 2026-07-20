const NepaliDate = require("nepali-date-converter").default;
const { ApiError } = require("../utils/apiError");

const MONTHS = Object.freeze({
  en: ["Baisakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin", "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"],
  ne: ["बैशाख", "जेठ", "असार", "श्रावण", "भदौ", "आश्विन", "कार्तिक", "मंसिर", "पौष", "माघ", "फाल्गुण", "चैत"]
});

function parseDate(value, label) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new ApiError(400, `${label} must use YYYY-MM-DD format.`);
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
}

function format({ year, month, day }) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function adToBs(adDate) {
  const { year, month, day } = parseDate(adDate, "AD date");
  try {
    const converted = NepaliDate.fromAD(new Date(year, month - 1, day));
    return { date: converted.format("YYYY-MM-DD"), year: converted.getYear(), month: converted.getMonth() + 1, day: converted.getDate(), monthName: MONTHS.en[converted.getMonth()] };
  } catch (_error) { throw new ApiError(422, "AD date is outside the supported Bikram Sambat calendar range."); }
}

function bsToAd(bsDate) {
  const { year, month, day } = parseDate(bsDate, "BS date");
  try {
    const converted = new NepaliDate(year, month - 1, day).toJsDate();
    const result = { year: converted.getFullYear(), month: converted.getMonth() + 1, day: converted.getDate() };
    return { date: format(result), ...result };
  } catch (_error) { throw new ApiError(422, "BS date is invalid or outside the supported calendar range."); }
}

function todayBs() {
  const now = new Date();
  return adToBs(format({ year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() }));
}

function monthName(month, language = "en") {
  const index = Number(month) - 1;
  if (!Number.isInteger(index) || index < 0 || index > 11) throw new ApiError(400, "BS month must be between 1 and 12.");
  return MONTHS[language === "ne" ? "ne" : "en"][index];
}

module.exports = { adToBs, bsToAd, todayBs, monthName };
