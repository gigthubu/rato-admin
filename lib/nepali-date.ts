/**
 * Nepali Date (Bikram Sambat) Utility
 * Complete BS/AD conversion with fiscal year support
 */

// BS calendar data: days in each month for years 2000-2090 BS
const BS_CALENDAR_DATA: Record<number, number[]> = {
  2000: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2001: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2002: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2003: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2004: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2005: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2006: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2007: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2008: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
  2009: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2010: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2011: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2012: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2013: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2014: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2015: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2016: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2017: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2018: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2019: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2020: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2021: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2022: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2023: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2024: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2025: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2026: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2027: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2028: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2029: [31, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30],
  2030: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2031: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2032: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2033: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2034: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2035: [30, 32, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
  2036: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2037: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2038: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2039: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2040: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2041: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2042: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2043: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2044: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2045: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2046: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2047: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2048: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2049: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2050: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2051: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2052: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2053: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2054: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2055: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2056: [31, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30],
  2057: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2058: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2059: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2060: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2061: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2062: [30, 32, 31, 32, 31, 31, 29, 30, 29, 30, 29, 31],
  2063: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2064: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2065: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2066: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
  2067: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2068: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2069: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2070: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2071: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2072: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2073: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2074: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2075: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2076: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2077: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2078: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2079: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2080: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2081: [31, 31, 32, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2082: [30, 32, 31, 32, 31, 30, 30, 30, 30, 30, 30, 30],
  2083: [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30],
  2084: [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30],
  2085: [31, 32, 31, 32, 30, 31, 30, 30, 29, 30, 30, 30],
  2086: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2087: [31, 31, 32, 31, 31, 31, 30, 30, 29, 30, 30, 30],
  2088: [30, 31, 32, 32, 30, 31, 30, 30, 29, 30, 30, 30],
  2089: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2090: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
};

// Nepali month names
export const BS_MONTHS = [
  'बैशाख', 'जेठ', 'असार', 'श्रावण', 'भाद्र', 'आश्विन',
  'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत्र'
];

export const BS_MONTHS_EN = [
  'Baisakh', 'Jestha', 'Ashar', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
];

// Nepali numerals
const NEPALI_NUMERALS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

// Weekday names
export const WEEKDAYS_NP = ['आइत', 'सोम', 'मंगल', 'बुध', 'बिही', 'शुक्र', 'शनि'];
export const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Reference date: 2000/01/01 BS = 1943/04/14 AD
const BS_REF = { year: 2000, month: 1, day: 1 };
const NEPAL_TZ_OFFSET_MIN = 345; // UTC+05:45
const DAY_MS = 24 * 60 * 60 * 1000;
const AD_REF_UTC = Date.UTC(1943, 3, 14); // April 14, 1943 (local Nepal date)

export interface NepaliDate {
  year: number;
  month: number; // 1-12
  day: number;
}

export interface FiscalYear {
  code: string;       // e.g., "2082/83"
  startBs: NepaliDate;
  endBs: NepaliDate;
  startAd: Date;
  endAd: Date;
}

function getNepalDateParts(date: Date): { year: number; month: number; day: number } {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kathmandu",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const year = Number(parts.find((p) => p.type === "year")?.value || 0);
    const month = Number(parts.find((p) => p.type === "month")?.value || 0);
    const day = Number(parts.find((p) => p.type === "day")?.value || 0);
    if (year && month && day) return { year, month, day };
  } catch {
    // Fall through to offset-based fallback
  }

  const nepalMs = date.getTime() + NEPAL_TZ_OFFSET_MIN * 60 * 1000;
  const nepalDate = new Date(nepalMs);
  return {
    year: nepalDate.getUTCFullYear(),
    month: nepalDate.getUTCMonth() + 1,
    day: nepalDate.getUTCDate(),
  };
}

/**
 * Get days in a BS month
 */
export function getDaysInBsMonth(year: number, month: number): number {
  const yearData = BS_CALENDAR_DATA[year];
  if (!yearData) {
    throw new Error(`BS year ${year} not supported`);
  }
  return yearData[month - 1];
}

/**
 * Get total days in a BS year
 */
export function getDaysInBsYear(year: number): number {
  const yearData = BS_CALENDAR_DATA[year];
  if (!yearData) {
    throw new Error(`BS year ${year} not supported`);
  }
  return yearData.reduce((sum, days) => sum + days, 0);
}

/**
 * Convert AD date to BS date
 */
export function adToBs(date: Date): NepaliDate {
  // Calculate days from reference using Nepal local date parts
  const { year, month, day } = getNepalDateParts(date);
  const diffTime = Date.UTC(year, month - 1, day) - AD_REF_UTC;
  let totalDays = Math.floor(diffTime / DAY_MS);

  let bsYear = BS_REF.year;
  let bsMonth = BS_REF.month;
  let bsDay = BS_REF.day;

  // Add days to reference BS date
  while (totalDays > 0) {
    const daysInMonth = getDaysInBsMonth(bsYear, bsMonth);
    const daysRemaining = daysInMonth - bsDay;

    if (totalDays <= daysRemaining) {
      bsDay += totalDays;
      totalDays = 0;
    } else {
      totalDays -= daysRemaining + 1;
      bsDay = 1;
      bsMonth++;
      if (bsMonth > 12) {
        bsMonth = 1;
        bsYear++;
      }
    }
  }

  // Handle negative days (dates before reference)
  while (totalDays < 0) {
    bsDay--;
    if (bsDay < 1) {
      bsMonth--;
      if (bsMonth < 1) {
        bsMonth = 12;
        bsYear--;
      }
      bsDay = getDaysInBsMonth(bsYear, bsMonth);
    }
    totalDays++;
  }

  return { year: bsYear, month: bsMonth, day: bsDay };
}

/**
 * Convert BS date to AD date
 */
export function bsToAd(bs: NepaliDate): Date {
  let totalDays = 0;

  // Days from BS reference year to target year
  for (let y = BS_REF.year; y < bs.year; y++) {
    totalDays += getDaysInBsYear(y);
  }

  // Days from start of year to target month
  for (let m = 1; m < bs.month; m++) {
    totalDays += getDaysInBsMonth(bs.year, m);
  }

  // Days in target month
  totalDays += bs.day - BS_REF.day;

  // Add to AD reference (Nepal local date)
  return new Date(AD_REF_UTC + totalDays * DAY_MS);
}

/**
 * Convert number to Nepali numerals
 */
export function toNepaliNumeral(num: number): string {
  return num.toString().split('').map(d => NEPALI_NUMERALS[parseInt(d)] || d).join('');
}

/**
 * Format BS date
 */
export function formatBsDate(bs: NepaliDate, format: 'full' | 'short' | 'numeric' = 'short'): string {
  switch (format) {
    case 'full':
      return `${toNepaliNumeral(bs.year)} ${BS_MONTHS[bs.month - 1]} ${toNepaliNumeral(bs.day)}`;
    case 'short':
      return `${bs.year}/${String(bs.month).padStart(2, '0')}/${String(bs.day).padStart(2, '0')}`;
    case 'numeric':
      return `${toNepaliNumeral(bs.year)}/${toNepaliNumeral(bs.month)}/${toNepaliNumeral(bs.day)}`;
  }
}

/**
 * Format AD date for display
 */
export function formatAdDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

/**
 * Get current BS date
 */
export function getCurrentBsDate(): NepaliDate {
  return adToBs(new Date());
}

/**
 * Get current fiscal year (Shrawan 1 to Ashar end)
 */
export function getCurrentFiscalYear(): FiscalYear {
  const today = getCurrentBsDate();
  // Fiscal year starts from Shrawan (month 4)
  const fiscalStartYear = today.month >= 4 ? today.year : today.year - 1;
  return getFiscalYear(fiscalStartYear);
}

/**
 * Get fiscal year by start year
 */
export function getFiscalYear(startYear: number): FiscalYear {
  const endYear = startYear + 1;
  
  return {
    code: `${startYear}/${String(endYear).slice(-2)}`,
    startBs: { year: startYear, month: 4, day: 1 }, // Shrawan 1
    endBs: { year: endYear, month: 3, day: getDaysInBsMonth(endYear, 3) }, // Chaitra end
    startAd: bsToAd({ year: startYear, month: 4, day: 1 }),
    endAd: bsToAd({ year: endYear, month: 3, day: getDaysInBsMonth(endYear, 3) }),
  };
}

/**
 * Get list of fiscal years for dropdown
 */
export function getFiscalYearOptions(count: number = 5): FiscalYear[] {
  const current = getCurrentFiscalYear();
  const startYear = parseInt(current.code.split('/')[0]);
  
  const years: FiscalYear[] = [];
  for (let i = -2; i < count - 2; i++) {
    years.push(getFiscalYear(startYear + i));
  }
  return years.reverse(); // Most recent first
}

/**
 * Parse BS date string
 */
export function parseBsDate(dateStr: string): NepaliDate | null {
  const parts = dateStr.split(/[\/\-\.]/);
  if (parts.length !== 3) return null;
  
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const day = parseInt(parts[2]);
  
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  if (month < 1 || month > 12) return null;
  
  try {
    const daysInMonth = getDaysInBsMonth(year, month);
    if (day < 1 || day > daysInMonth) return null;
    return { year, month, day };
  } catch {
    return null;
  }
}

/**
 * Check if BS date is valid
 */
export function isValidBsDate(bs: NepaliDate): boolean {
  try {
    const daysInMonth = getDaysInBsMonth(bs.year, bs.month);
    return bs.day >= 1 && bs.day <= daysInMonth && bs.month >= 1 && bs.month <= 12;
  } catch {
    return false;
  }
}

/**
 * Get calendar grid for a month (for calendar component)
 */
export function getBsMonthCalendar(year: number, month: number): (number | null)[][] {
  const daysInMonth = getDaysInBsMonth(year, month);
  const firstDayAd = bsToAd({ year, month, day: 1 });
  const startDayOfWeek = firstDayAd.getDay(); // 0 = Sunday
  
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = new Array(startDayOfWeek).fill(null);
  
  for (let day = 1; day <= daysInMonth; day++) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  
  // Fill remaining days of last week
  if (week.length > 0) {
    while (week.length < 7) {
      week.push(null);
    }
    weeks.push(week);
  }
  
  return weeks;
}
