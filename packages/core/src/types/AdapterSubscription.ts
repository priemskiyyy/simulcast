/**
 * One provider subscription owned by the adapter.
 *
 * `dispose` releases it, is idempotent, and marks the end of observer calls.
 * The core reports `detached` itself, so the adapter emits nothing on dispose.
 */
export type AdapterSubscription<TNativeSubscription = unknown> = {
  native: TNativeSubscription;
  dispose: () => void;
};
