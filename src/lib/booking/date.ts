import { addDays, format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

export const CLUB_TIMEZONE = "Europe/Paris";

export function getTodayDateString() {
  return format(
    toZonedTime(new Date(), CLUB_TIMEZONE),
    "yyyy-MM-dd"
  );
}

export function isValidDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function getDayOfWeek(dateString: string) {
  const date = parseISO(`${dateString}T12:00:00`);

  // JS :
  // 0 dimanche
  // 1 lundi
  // ...
  // 6 samedi
  return date.getDay();
}

export function getPreviousDate(dateString: string) {
  return format(
    addDays(parseISO(dateString), -1),
    "yyyy-MM-dd"
  );
}

export function getNextDate(dateString: string) {
  return format(
    addDays(parseISO(dateString), 1),
    "yyyy-MM-dd"
  );
}

export function getFormattedDate(dateString: string) {
  return format(
    parseISO(dateString),
    "EEEE d MMMM yyyy",
    {
      locale: fr,
    }
  );
}

export function localDateTimeToUtc(
  dateString: string,
  timeString: string
) {
  return fromZonedTime(
    `${dateString}T${timeString}`,
    CLUB_TIMEZONE
  );
}

export function utcToLocalTime(date: string | Date) {
  return format(
    toZonedTime(
      typeof date === "string"
        ? new Date(date)
        : date,
      CLUB_TIMEZONE
    ),
    "HH:mm"
  );
}

export function formatBookingDate(
  date: string | Date
) {
  return format(
    toZonedTime(
      typeof date === "string"
        ? new Date(date)
        : date,
      CLUB_TIMEZONE
    ),
    "EEEE d MMMM",
    {
      locale: fr,
    }
  );
}

export function formatBookingTime(
  date: string | Date
) {
  return format(
    toZonedTime(
      typeof date === "string"
        ? new Date(date)
        : date,
      CLUB_TIMEZONE
    ),
    "HH:mm"
  );
}