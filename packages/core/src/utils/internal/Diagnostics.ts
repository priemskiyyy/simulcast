import type {
  RealtimeDiagnostics,
  RealtimeDiagnosticEvent,
  RealtimeSnapshot,
} from "src/types/RealtimeDiagnostics";
import { invokeIsolated } from "src/utils/internal/invokeIsolated";

export class Diagnostics {
  #read: () => RealtimeSnapshot;
  #snapshot: RealtimeSnapshot | undefined;
  #listeners = new Set<() => void>();
  #eventListeners = new Set<(event: RealtimeDiagnosticEvent) => void>();
  #scheduled = false;

  constructor(read: () => RealtimeSnapshot) {
    this.#read = read;
  }

  api: RealtimeDiagnostics = {
    get: () => {
      if (this.#snapshot === undefined) {
        this.#snapshot = this.#read();
      }

      return this.#snapshot;
    },
    subscribe: (listener) => {
      const notify = () => listener();
      this.#listeners.add(notify);
      return () => {
        this.#listeners.delete(notify);
      };
    },
    events: {
      subscribe: (listener) => {
        const handle = (event: RealtimeDiagnosticEvent) => listener(event);
        this.#eventListeners.add(handle);
        return () => {
          this.#eventListeners.delete(handle);
        };
      },
    },
  };

  changed = () => {
    this.#snapshot = undefined;

    if (this.#listeners.size === 0) {
      return;
    }

    if (this.#scheduled) {
      return;
    }

    this.#scheduled = true;
    queueMicrotask(() => {
      this.#scheduled = false;

      for (const listener of [...this.#listeners]) {
        if (!this.#listeners.has(listener)) {
          continue;
        }

        invokeIsolated(listener);
      }
    });
  };

  record = (
    source: RealtimeDiagnosticEvent["source"],
    type: string,
    context: unknown,
    channel: string | null = null,
  ) => {
    if (this.#eventListeners.size === 0) {
      return;
    }

    const event = { source, type, context, channel, timestamp: Date.now() };

    for (const listener of [...this.#eventListeners]) {
      if (!this.#eventListeners.has(listener)) {
        continue;
      }

      invokeIsolated(() => listener(event));
    }
  };
}
