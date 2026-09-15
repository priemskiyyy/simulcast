import { createSignal, onCleanup } from "solid-js";

/** The current time, refreshed on an interval so relative timestamps stay honest. */
export const useNow = (intervalMs: number) => {
  const [now, setNow] = createSignal(Date.now());
  const timer = setInterval(() => setNow(Date.now()), intervalMs);

  onCleanup(() => clearInterval(timer));

  return now;
};
