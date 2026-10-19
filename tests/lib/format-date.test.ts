import { afterEach, describe, expect, it } from "vitest";

import { formatDate, isIsoDate } from "@/lib/format-date";

describe("isIsoDate", () => {
  it.each(["2026-10-20", "2024-02-29"])("accepts %s", (value) => {
    expect(isIsoDate(value)).toBe(true);
  });

  it.each([
    "2026-02-30",
    "2025-02-29",
    "2026-13-01",
    "2026-1-5",
    "20261020",
    "",
    null,
    20261020,
  ])("rejects %j", (value) => {
    expect(isIsoDate(value)).toBe(false);
  });
});

describe("formatDate", () => {
  const originalTz = process.env.TZ;

  afterEach(() => {
    if (originalTz === undefined) delete process.env.TZ;
    else process.env.TZ = originalTz;
  });

  it("formats as a medium date in the given locale", () => {
    expect(formatDate("2026-10-20", "en-US")).toBe("Oct 20, 2026");
  });

  // The todo-list spec: the displayed day matches the selected day in UTC−10
  // and UTC+14.
  it.each(["Pacific/Honolulu", "Pacific/Kiritimati"])(
    "shows the same calendar day in %s",
    (timeZone) => {
      const offsetBefore = new Date(0).getTimezoneOffset();
      process.env.TZ = timeZone;
      expect(
        new Date(0).getTimezoneOffset(),
        `setting TZ=${timeZone} had no effect`,
      ).not.toBe(offsetBefore);

      expect(formatDate("2026-10-20", "en-US")).toBe("Oct 20, 2026");
    },
  );
});
