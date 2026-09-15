const UNITS = [
  { limit: 60, divisor: 1, unit: "second" },
  { limit: 3_600, divisor: 60, unit: "minute" },
  { limit: 86_400, divisor: 3_600, unit: "hour" },
] as const satisfies ReadonlyArray<{
  limit: number;
  divisor: number;
  unit: Intl.RelativeTimeFormatUnit;
}>;
const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** "just now", "3 minutes ago", and so on; anything older than a day falls back to days. */
export const formatRelativeTime = (iso: string, now: number) => {
  const elapsedSeconds = Math.max(0, (now - Date.parse(iso)) / 1_000);

  if (elapsedSeconds < 5) {
    return "just now";
  }

  const unit = UNITS.find((candidate) => elapsedSeconds < candidate.limit);

  if (unit === undefined) {
    return formatter.format(-Math.floor(elapsedSeconds / 86_400), "day");
  }

  return formatter.format(
    -Math.floor(elapsedSeconds / unit.divisor),
    unit.unit,
  );
};
