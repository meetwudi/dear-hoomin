import { describe, expect, it } from "vitest";
import { isDailyThoughtGenerationWindow } from "../../lib/user-context/timezone";

describe("isDailyThoughtGenerationWindow", () => {
  it("allows scheduled daily generation any time after 6am local time", () => {
    const context = {
      hoominId: "hoomin-1",
      timeZone: "America/Los_Angeles",
      localDate: "2026-05-05",
      localHour: 7,
    };

    expect(isDailyThoughtGenerationWindow(context)).toBe(true);
  });

  it("blocks scheduled daily generation before 6am local time", () => {
    const context = {
      hoominId: "hoomin-1",
      timeZone: "America/Los_Angeles",
      localDate: "2026-05-05",
      localHour: 5,
    };

    expect(isDailyThoughtGenerationWindow(context)).toBe(false);
  });
});
