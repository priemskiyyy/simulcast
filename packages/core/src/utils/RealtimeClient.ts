import type { AdapterConnection } from "src/types/AdapterConnection";
import type { ConnectionState } from "src/types/ConnectionState";
import type { ObservableValue } from "src/types/ObservableValue";
import type { RealtimeAdapter } from "src/types/RealtimeAdapter";
import { RealtimeChannels } from "src/utils/RealtimeChannels";
import { Diagnostics } from "src/utils/internal/Diagnostics";
import { ResourceScope } from "src/utils/internal/ResourceScope";
import { ValueStore } from "src/utils/internal/ValueStore";
import { notifyOnChange } from "src/utils/internal/notifyOnChange";

type Session<TNativeConnection, TNativePublication> =
  | {
      id: number;
      connection: AdapterConnection<TNativeConnection, TNativePublication>;
      scope: ResourceScope;
    }
  | {
      connection: null;
      scope: ResourceScope;
    };

/**
 * Owns one connection session at a time and the logical channels shared by
 * its consumers. Creating a client opens nothing; `connect` does.
 *
 * @example
 * ```ts
 * const realtime = new RealtimeClient({ adapter: centrifugo({ transport }) });
 * const disconnect = realtime.connect();
 * const unsubscribe = realtime.channel("rooms:demo").subscribe((publication) => {
 *   console.log(publication.data);
 * });
 * ```
 */
export class RealtimeClient<
  TNativeConnection = unknown,
  TNativePublication = unknown,
> {
  #adapter: RealtimeAdapter<TNativeConnection, TNativePublication, unknown>;
  #sessions = 0;
  #state = new ValueStore<Session<
    TNativeConnection,
    TNativePublication
  > | null>(null);
  #connection = new ValueStore<ConnectionState>("disconnected");
  #diagnostics: Diagnostics = new Diagnostics(() => {
    const session = this.#getSession();

    return {
      adapter: this.#adapter.name,
      session: session === null ? null : { id: session.id },
      connection: this.#connection.get(),
      channels: this.#channels.inspect(),
    };
  });
  #channels: RealtimeChannels<TNativePublication> = new RealtimeChannels(
    { get: () => this.#getSession() },
    this.#diagnostics,
  );

  constructor({
    adapter,
  }: {
    adapter: RealtimeAdapter<TNativeConnection, TNativePublication, unknown>;
  }) {
    this.#adapter = adapter;
    this.#state.subscribe(this.#diagnostics.changed);
    this.#connection.subscribe(this.#diagnostics.changed);
  }

  diagnostics = this.#diagnostics.api;

  connection: ObservableValue<ConnectionState> = {
    get: this.#connection.get,
    subscribe: this.#connection.subscribe,
  };

  /** The adapter's native client, or `null` while no session is active. */
  native: ObservableValue<TNativeConnection | null> = {
    get: () => {
      const session = this.#getSession();

      if (session === null) {
        return null;
      }

      return session.connection.native;
    },
    subscribe: (listener) =>
      this.#state.subscribe(notifyOnChange(this.native.get, listener)),
  };

  channel = (name: string) => this.#channels.get(name);

  /**
   * Starts a session and returns its cleanup. Calling it again replaces the
   * session; demanded channels move to the new connection.
   */
  connect = () => {
    const previous = this.#state.get();
    const scope = new ResourceScope();
    scope.addCleanup(() => {
      const current = this.#state.get();

      if (current === null) {
        return;
      }

      if (current.scope !== scope) {
        return;
      }

      this.#state.set(null);
    });

    // Reserve this replacement before callbacks can start another session.
    this.#state.set({ connection: null, scope });

    // Adapter callbacks and observer cleanup can replace this session synchronously.
    return scope.setup(() => {
      if (previous !== null) {
        previous.scope.dispose();
      }

      if (!scope.isActive()) {
        return scope.dispose;
      }

      this.#sessions += 1;
      const id = this.#sessions;
      scope.addCleanup(() => this.#connection.set("disconnected"));
      const connection = this.#adapter.connect({
        state: (state) => {
          if (!scope.isActive()) {
            return;
          }

          this.#diagnostics.record("connection", "state", state);
          this.#connection.set(state);
        },
        error: (error) => {
          if (!scope.isActive()) {
            return;
          }

          this.#diagnostics.record("connection", "error", error);
        },
      });
      scope.addCleanup(connection.dispose);

      if (!scope.isActive()) {
        return scope.dispose;
      }

      this.#state.set({ id, connection, scope });
      this.#diagnostics.record("runtime", "session.started", { id });
      scope.addCleanup(() =>
        this.#diagnostics.record("runtime", "session.ended", { id }),
      );

      if (!scope.isActive()) {
        return scope.dispose;
      }

      this.#channels.subscribeAll();
      return scope.dispose;
    });
  };

  #getSession = () => {
    const session = this.#state.get();

    if (session === null) {
      return null;
    }

    if (session.connection === null) {
      return null;
    }

    if (!session.scope.isActive()) {
      return null;
    }

    return session;
  };
}
