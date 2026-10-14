/**
 * CodeCircle Indian Standard Time (IST / Asia/Kolkata / UTC+05:30) Utilities
 * Ensures seamless consistency for selecting time and displaying time across all features.
 */

export const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Format a Date or ISO string into `YYYY-MM-DDTHH:mm` in Asia/Kolkata timezone
 * specifically for HTML5 `<input type="datetime-local" />`.
 */
export function formatDateToISTInput(dateInput?: Date | string | number | null): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (!date || isNaN(date.getTime())) return '';

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    map[part.type] = part.value;
  }

  const hour = map.hour === '24' ? '00' : map.hour;
  return `${map.year}-${map.month}-${map.day}T${hour}:${map.minute}`;
}

/**
 * Format a Date or ISO string into `YYYY-MM-DD` in Asia/Kolkata timezone
 * specifically for HTML5 `<input type="date" />`.
 */
export function formatDateToISTDateInput(dateInput?: Date | string | number | null): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (!date || isNaN(date.getTime())) return '';

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    map[part.type] = part.value;
  }

  return `${map.year}-${map.month}-${map.day}`;
}

/**
 * Parse a datetime-local input string (`YYYY-MM-DDTHH:mm` or `YYYY-MM-DDTHH:mm:ss`)
 * explicitly as Indian Standard Time (UTC+05:30) and convert it to a standard UTC ISO string.
 */
export function parseISTInputToISO(istDateTimeStr?: string | null): string {
  if (!istDateTimeStr || typeof istDateTimeStr !== 'string') return '';
  const trimmed = istDateTimeStr.trim();
  if (!trimmed) return '';

  // If it already contains an explicit timezone offset or Z, use native parse
  if (trimmed.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(trimmed)) {
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? '' : d.toISOString();
  }

  // Ensure seconds are included if absent
  const normalized = trimmed.length === 16 ? `${trimmed}:00` : trimmed;
  // Append Indian Standard Time offset +05:30
  const istWithOffset = `${normalized}+05:30`;
  const parsed = new Date(istWithOffset);

  if (isNaN(parsed.getTime())) {
    // Fallback to direct parse if unusual format
    const fallback = new Date(trimmed);
    return isNaN(fallback.getTime()) ? '' : fallback.toISOString();
  }

  return parsed.toISOString();
}

export interface FormatISTOptions {
  showYear?: boolean;
  showTime?: boolean;
  showSeconds?: boolean;
  includeSuffix?: boolean; // Appends "IST"
  monthFormat?: 'short' | 'numeric' | 'long';
}

/**
 * Format any timestamp or Date into a user-friendly Indian Standard Time string.
 * Default output: "14 Oct 2026, 08:30 PM IST"
 */
export function formatISTDateTime(
  dateInput?: Date | string | number | null,
  options?: FormatISTOptions
): string {
  if (!dateInput) return '—';
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (!date || isNaN(date.getTime())) return '—';

  const {
    showYear = true,
    showTime = true,
    showSeconds = false,
    includeSuffix = true,
    monthFormat = 'short',
  } = options || {};

  const formatOptions: Intl.DateTimeFormatOptions = {
    timeZone: IST_TIMEZONE,
    day: 'numeric',
    month: monthFormat,
    ...(showYear ? { year: 'numeric' } : {}),
    ...(showTime
      ? {
          hour: '2-digit',
          minute: '2-digit',
          ...(showSeconds ? { second: '2-digit' } : {}),
          hour12: true,
        }
      : {}),
  };

  const formatted = new Intl.DateTimeFormat('en-IN', formatOptions).format(date);
  // Normalize am/pm to AM/PM for clean editorial style
  const normalized = formatted.replace(/\b(am|pm)\b/gi, (match) => match.toUpperCase());

  if (showTime && includeSuffix) {
    return `${normalized} IST`;
  }
  return normalized;
}

/**
 * Format only the date portion in Indian Standard Time, e.g. "14 Oct 2026" or "14 Oct".
 */
export function formatISTDate(
  dateInput?: Date | string | number | null,
  options?: { showYear?: boolean; monthFormat?: 'short' | 'numeric' | 'long' }
): string {
  return formatISTDateTime(dateInput, {
    showYear: options?.showYear ?? true,
    showTime: false,
    includeSuffix: false,
    monthFormat: options?.monthFormat ?? 'short',
  });
}

/**
 * Format only the time portion in Indian Standard Time, e.g. "08:30 PM IST" or "08:30 PM".
 */
export function formatISTTime(
  dateInput?: Date | string | number | null,
  options?: { includeSuffix?: boolean; showSeconds?: boolean }
): string {
  if (!dateInput) return '—';
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (!date || isNaN(date.getTime())) return '—';

  const { includeSuffix = true, showSeconds = false } = options || {};

  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    ...(showSeconds ? { second: '2-digit' } : {}),
    hour12: true,
  });

  const formatted = formatter.format(date).replace(/\b(am|pm)\b/gi, (m) => m.toUpperCase());
  return includeSuffix ? `${formatted} IST` : formatted;
}

/**
 * Format a start and end schedule range concisely in Indian Standard Time.
 * Example (same day): "14 Oct 2026, 08:00 PM – 10:00 PM IST"
 * Example (diff days): "14 Oct, 08:00 PM – 21 Oct 2026, 08:00 PM IST"
 */
export function formatISTRange(
  startInput?: Date | string | number | null,
  endInput?: Date | string | number | null
): string {
  if (!startInput && !endInput) return '—';
  if (!startInput) return `Until ${formatISTDateTime(endInput)}`;
  if (!endInput) return `From ${formatISTDateTime(startInput)}`;

  const startDate = typeof startInput === 'string' || typeof startInput === 'number' ? new Date(startInput) : startInput;
  const endDate = typeof endInput === 'string' || typeof endInput === 'number' ? new Date(endInput) : endInput;

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return '—';

  const startDay = formatDateToISTDateInput(startDate);
  const endDay = formatDateToISTDateInput(endDate);

  if (startDay === endDay) {
    const datePart = formatISTDate(startDate, { showYear: true });
    const startTimePart = formatISTTime(startDate, { includeSuffix: false });
    const endTimePart = formatISTTime(endDate, { includeSuffix: true });
    return `${datePart}, ${startTimePart} – ${endTimePart}`;
  }

  const startPart = formatISTDateTime(startDate, { showYear: false, includeSuffix: false });
  const endPart = formatISTDateTime(endDate, { showYear: true, includeSuffix: true });
  return `${startPart} – ${endPart}`;
}

/**
 * Relative remaining countdown helper (e.g., "2h 15m left" or "Ended")
 */
export function formatRemainingTime(targetIso: string | Date): string {
  const targetTime = typeof targetIso === 'string' ? new Date(targetIso).getTime() : targetIso.getTime();
  const diff = targetTime - Date.now();
  if (diff <= 0) return 'Ended';

  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);

  if (h > 24) {
    const days = Math.floor(h / 24);
    const remHours = h % 24;
    return `${days}d ${remHours}h left`;
  }
  if (h > 0) {
    return `${h}h ${m}m left`;
  }
  return `${Math.max(1, m)}m left`;
}
