/**
 * Date-range helpers for the Reports page. Dates are "YYYY-MM-DD" strings in the user's LOCAL
 * calendar (not UTC), so "today" is correct in Bangladesh (UTC+6) right after midnight.
 */

/** @typedef {import('../api/reportsApi').ReportDateRange} ReportDateRange */

export const REPORT_RANGE_PRESET_KEYS = Object.freeze({
  ALL_TIME: 'allTime',
  TODAY: 'today',
  LAST_7_DAYS: 'last7Days',
  LAST_30_DAYS: 'last30Days',
  THIS_MONTH: 'thisMonth',
  CUSTOM: 'custom',
});

export const REPORT_RANGE_PRESETS = [
  { key: REPORT_RANGE_PRESET_KEYS.ALL_TIME, label: 'All time' },
  { key: REPORT_RANGE_PRESET_KEYS.TODAY, label: 'Today' },
  { key: REPORT_RANGE_PRESET_KEYS.LAST_7_DAYS, label: 'Last 7 days' },
  { key: REPORT_RANGE_PRESET_KEYS.LAST_30_DAYS, label: 'Last 30 days' },
  { key: REPORT_RANGE_PRESET_KEYS.THIS_MONTH, label: 'This month' },
  { key: REPORT_RANGE_PRESET_KEYS.CUSTOM, label: 'Custom range' },
];

export const DEFAULT_REPORT_RANGE_PRESET_KEY = REPORT_RANGE_PRESET_KEYS.ALL_TIME;

/** Unbounded range: the report API treats missing `from` / `to` as "no limit". */
export const ALL_TIME_DATE_RANGE = Object.freeze({ fromDate: null, toDate: null });

export const isAllTimeRange = (dateRange) => !dateRange.fromDate && !dateRange.toDate;

const padToTwoDigits = (dateNumber) => String(dateNumber).padStart(2, '0');

/** Date → "YYYY-MM-DD" in local time (the format of <input type="date"> and the report API). */
export const toIsoDateString = (date) =>
  `${date.getFullYear()}-${padToTwoDigits(date.getMonth() + 1)}-${padToTwoDigits(date.getDate())}`;

/** "YYYY-MM-DD" → Date at local midnight. */
export function parseIsoDateString(isoDateString) {
  const [year, month, day] = isoDateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

const addDays = (date, dayCount) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + dayCount);

/** Inclusive number of days in the range ("today" = 1). */
export function countDaysInRange({ fromDate, toDate }) {
  const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;
  const differenceInMs = parseIsoDateString(toDate) - parseIsoDateString(fromDate);
  return Math.round(differenceInMs / ONE_DAY_IN_MS) + 1;
}

/** @returns {ReportDateRange} */
export function getDateRangeForPreset(presetKey, referenceDate = new Date()) {
  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const endingToday = (dayCount) => ({
    fromDate: toIsoDateString(addDays(today, -(dayCount - 1))),
    toDate: toIsoDateString(today),
  });

  switch (presetKey) {
    case REPORT_RANGE_PRESET_KEYS.ALL_TIME:
      return ALL_TIME_DATE_RANGE;
    case REPORT_RANGE_PRESET_KEYS.TODAY:
      return endingToday(1);
    case REPORT_RANGE_PRESET_KEYS.LAST_7_DAYS:
      return endingToday(7);
    case REPORT_RANGE_PRESET_KEYS.THIS_MONTH:
      return {
        fromDate: toIsoDateString(new Date(today.getFullYear(), today.getMonth(), 1)),
        toDate: toIsoDateString(today),
      };
    case REPORT_RANGE_PRESET_KEYS.LAST_30_DAYS:
    default:
      return endingToday(30);
  }
}

/**
 * The equally long period that ends the day before `dateRange` starts — the comparison baseline.
 * `null` for "All time": an unbounded range has no previous period.
 * @returns {ReportDateRange | null}
 */
export function getPreviousDateRange(dateRange) {
  if (isAllTimeRange(dateRange)) return null;
  const rangeLengthInDays = countDaysInRange(dateRange);
  const previousRangeEnd = addDays(parseIsoDateString(dateRange.fromDate), -1);
  const previousRangeStart = addDays(previousRangeEnd, -(rangeLengthInDays - 1));
  return { fromDate: toIsoDateString(previousRangeStart), toDate: toIsoDateString(previousRangeEnd) };
}

const dayMonthFormatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const dayMonthYearFormatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** "24 Oct – 22 Nov 2026", "22 Nov 2026" for a single day, full years when they differ. */
export function formatDateRangeLabel({ fromDate, toDate }) {
  if (!fromDate && !toDate) return 'All time';
  const rangeStart = parseIsoDateString(fromDate);
  const rangeEnd = parseIsoDateString(toDate);
  if (fromDate === toDate) return dayMonthYearFormatter.format(rangeEnd);
  const isSameYear = rangeStart.getFullYear() === rangeEnd.getFullYear();
  const rangeStartLabel = (isSameYear ? dayMonthFormatter : dayMonthYearFormatter).format(rangeStart);
  return `${rangeStartLabel} – ${dayMonthYearFormatter.format(rangeEnd)}`;
}

/** ISO date strings compare correctly as plain strings. */
export const isValidReportDateRange = ({ fromDate, toDate }) =>
  Boolean(fromDate && toDate) && fromDate <= toDate;
