import { expect, test } from "vitest";
import { formatRelativeTime } from "./formatRelativeTime";

const now = Date.parse("2026-09-15T10:00:00.000Z");
const ago = (seconds: number) => new Date(now - seconds * 1_000).toISOString();

test("rounds down to the largest unit and says just now for fresh events", () => {
  expect(formatRelativeTime(ago(2), now)).toBe("just now");
  expect(formatRelativeTime(ago(45), now)).toBe("45 seconds ago");
  expect(formatRelativeTime(ago(125), now)).toBe("2 minutes ago");
  expect(formatRelativeTime(ago(7_200), now)).toBe("2 hours ago");
  expect(formatRelativeTime(ago(200_000), now)).toBe("2 days ago");
});
