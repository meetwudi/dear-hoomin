export const defaultTimeZone = "America/Los_Angeles";

function assertIntlTimeZoneSupport() {
  if (typeof Intl.DateTimeFormat !== "function") {
    throw new Error("intl_time_zone_support_unavailable");
  }
}

export function validateTimeZone(timeZone: string) {
  assertIntlTimeZoneSupport();
  const trimmedTimeZone = timeZone.trim();

  if (!trimmedTimeZone) {
    throw new Error("time_zone_required");
  }

  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: trimmedTimeZone,
    }).resolvedOptions().timeZone;
  } catch {
    throw new Error("invalid_time_zone");
  }
}

export function getSupportedTimeZones() {
  if (typeof Intl.supportedValuesOf !== "function") {
    throw new Error("intl_supported_time_zones_unavailable");
  }

  const timeZones = Intl.supportedValuesOf("timeZone");

  if (!timeZones.includes(defaultTimeZone)) {
    return [defaultTimeZone, ...timeZones];
  }

  return timeZones;
}

export function getLocalIsoDate(timeZone: string, instant = new Date()) {
  const validTimeZone = validateTimeZone(timeZone);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: validTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("local_date_unavailable");
  }

  return `${year}-${month}-${day}`;
}

export function getLocalHour(timeZone: string, instant = new Date()) {
  const validTimeZone = validateTimeZone(timeZone);
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone: validTimeZone,
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant).find((part) => part.type === "hour")?.value;

  if (!hour) {
    throw new Error("local_hour_unavailable");
  }

  return Number(hour);
}
