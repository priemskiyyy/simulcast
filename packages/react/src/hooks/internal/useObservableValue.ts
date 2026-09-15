import { useEffect, useEffectEvent, useSyncExternalStore } from "react";
import type { ObservableValue } from "@priemskiyyy/simulcast";

/**
 * Reads an external snapshot and optionally observes subsequent changes with the latest callback.
 *
 * @example
 * ```ts
 * const realtime = useRealtimeClient();
 * const state = useObservableValue(
 *   realtime.connection,
 *   (): ConnectionState => "disconnected",
 * );
 * ```
 */
export const useObservableValue = <TValue>(
  value: ObservableValue<TValue>,
  getServerSnapshot: () => TValue,
  onChange?: (value: TValue) => void | Promise<unknown>,
) => {
  const handleChange = useEffectEvent(() => {
    if (typeof onChange !== "function") {
      return;
    }

    return onChange(value.get());
  });

  const hasOnChange = typeof onChange === "function";

  // A separate effect-owned listener isolates callback errors from React's snapshot updates.
  useEffect(() => {
    if (!hasOnChange) {
      return;
    }

    return value.subscribe(() => handleChange());
  }, [value, hasOnChange]);

  return useSyncExternalStore(value.subscribe, value.get, getServerSnapshot);
};
