import { createSignal, onCleanup } from "solid-js";
import type { z } from "zod";

/**
 * A signal backed by `localStorage` and kept in sync with other tabs through
 * `storage` events. Unavailable or corrupt storage falls back to in-memory state.
 */
export const useStoredValue = <TSchema extends z.ZodType>(
  key: string,
  schema: TSchema,
  fallback: z.infer<TSchema>,
) => {
  const read = (): z.infer<TSchema> => {
    try {
      const raw = localStorage.getItem(key);

      if (raw === null) {
        return fallback;
      }

      const parsed = schema.safeParse(JSON.parse(raw));

      return parsed.success ? parsed.data : fallback;
    } catch {
      return fallback;
    }
  };
  const [value, setValue] = createSignal(read());

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== key) {
      return;
    }

    setValue(() => read());
  };

  window.addEventListener("storage", handleStorage);
  onCleanup(() => window.removeEventListener("storage", handleStorage));

  const update = (next: z.infer<TSchema>) => {
    setValue(() => next);

    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      return;
    }
  };

  return [value, update] as const;
};
