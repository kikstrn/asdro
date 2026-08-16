export function formatGoogleCalendarDate(
  value: string | Date
) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

type GoogleCalendarEvent = {
  title: string;
  startsAt: string | Date;
  endsAt: string | Date;
  location?: string;
  description?: string;
};

export function buildGoogleCalendarUrl({
  title,
  startsAt,
  endsAt,
  location = "",
  description = "",
}: GoogleCalendarEvent) {
  const params =
    new URLSearchParams({
      action: "TEMPLATE",

      dates:
        `${formatGoogleCalendarDate(
          startsAt
        )}/${formatGoogleCalendarDate(
          endsAt
        )}`,

      stz:
        "Europe/Paris",

      etz:
        "Europe/Paris",

      text:
        title,

      location,

      details:
        description,
    });

  return `https://calendar.google.com/calendar/r/eventedit?${params.toString()}`;
}
