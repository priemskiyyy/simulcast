/** The part of the EventSource API the adapter relies on, so other runtimes and tests can supply their own. */
export type EventSourceLike = {
  readonly CLOSED: number;
  readonly readyState: number;
  close: () => void;
  addEventListener: (type: string, listener: (event: Event) => void) => void;
  removeEventListener: (type: string, listener: (event: Event) => void) => void;
};
