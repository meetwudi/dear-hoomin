import { getHoominTimeZone } from "../settings/store";
import {
  defaultTimeZone,
  getLocalHour,
  getLocalIsoDate,
  validateTimeZone,
} from "../timezones";

export type HoominTimeContext = {
  hoominId: string;
  timeZone: string;
  localDate: string;
  localHour: number;
};

export async function resolveHoominTimeContext(
  hoominId: string,
  instant = new Date(),
): Promise<HoominTimeContext> {
  const timeZone = await getHoominTimeZone(hoominId);

  return resolveTimeContextForTimeZone({
    hoominId,
    timeZone,
    instant,
  });
}

export function resolveTimeContextForTimeZone({
  hoominId,
  timeZone,
  instant = new Date(),
}: {
  hoominId: string;
  timeZone: string | null | undefined;
  instant?: Date;
}): HoominTimeContext {
  const validTimeZone = validateTimeZone(timeZone ?? defaultTimeZone);

  return {
    hoominId,
    timeZone: validTimeZone,
    localDate: getLocalIsoDate(validTimeZone, instant),
    localHour: getLocalHour(validTimeZone, instant),
  };
}

export function isDailyThoughtGenerationHour(context: HoominTimeContext) {
  return context.localHour === 6;
}
