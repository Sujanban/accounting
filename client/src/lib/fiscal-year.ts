import NepaliDate from "nepali-date-converter";

type FiscalYearDefaults = {
  name: string;
  startDateBS: string;
  endDateBS: string;
};

/** Returns the current Nepali fiscal year (Shrawan 1 through the following Ashadh's final day). */
export function getCurrentFiscalYearDefaults(today = new Date()): FiscalYearDefaults {
  const todayBs = NepaliDate.fromAD(today);
  const fiscalStartYear = todayBs.getMonth() >= 3 ? todayBs.getYear() : todayBs.getYear() - 1;
  const startBs = new NepaliDate(fiscalStartYear, 3, 1);
  const nextFiscalStartBs = new NepaliDate(fiscalStartYear + 1, 3, 1);
  const endAd = nextFiscalStartBs.toJsDate();
  endAd.setDate(endAd.getDate() - 1);
  const endBs = NepaliDate.fromAD(endAd);

  return {
    name: `${fiscalStartYear}/${String(fiscalStartYear + 1).slice(-2)}`,
    startDateBS: startBs.format("YYYY-MM-DD"),
    endDateBS: endBs.format("YYYY-MM-DD")
  };
}
