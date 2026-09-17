import type { AdapterConnection } from "src/types/AdapterConnection";
import type { ChannelStatus } from "src/types/ChannelStatus";
import type { RealtimeChannel } from "src/types/RealtimeChannel";
import type { RealtimePublication } from "src/types/RealtimePublication";
import type { RealtimeSnapshot } from "src/types/RealtimeDiagnostics";
import { DETACHED_CHANNEL_STATUS } from "src/utils/constants/realtimeChannel";
import type { Diagnostics } from "src/utils/internal/Diagnostics";
import { ResourceScope } from "src/utils/internal/ResourceScope";
import { ValueStore } from "src/utils/internal/ValueStore";
import { assertUnreachable } from "src/utils/internal/assertUnreachable";
import { invokeIsolated } from "src/utils/internal/invokeIsolated";

type ChannelSession<TNativePublication, TNativeSubscription> = {
  id: number;
  connection: Pick<
    AdapterConnection<unknown, TNativePublication, TNativeSubscription>,
    "subscribe"
  >;
  scope: Pick<ResourceScope, "adopt">;
};

type SessionSource<TNativePublication, TNativeSubscription> = {
  get: () => ChannelSession<TNativePublication, TNativeSubscription> | null;
};

type Channel<TNativePublication, TNativeSubscription> = {
  name: string;
  status: ValueStore<ChannelStatus>;
  native: ValueStore<TNativeSubscription | null>;
  consumers: {
    publications: Set<{
      handle: Parameters<
        RealtimeChannel<TNativePublication, TNativeSubscription>["subscribe"]
      >[0];
    }>;
    status: Set<symbol>;
  };
  attachment: { scope: ResourceScope; sessionId: number } | null;
};

// Adapters may repeat a state, for example while a provider retries; equal snapshots stay put.
const updateStatus = (
  status: ValueStore<ChannelStatus>,
  next: ChannelStatus,
) => {
  const current = status.get();

  if (
    current.state === next.state &&
    current.error === next.error &&
    current.recovered === next.recovered
  ) {
    return;
  }

  status.set(next);
};

export class RealtimeChannels<TNativePublication, TNativeSubscription> {
  #channels = new Map<
    string,
    Channel<TNativePublication, TNativeSubscription>
  >();
  #session: SessionSource<TNativePublication, TNativeSubscription>;
  #diagnostics: Diagnostics;

  constructor(
    session: SessionSource<TNativePublication, TNativeSubscription>,
    diagnostics: Diagnostics,
  ) {
    this.#session = session;
    this.#diagnostics = diagnostics;
  }

  inspect = (): RealtimeSnapshot["channels"] =>
    [...this.#channels.values()].map((channel) => ({
      name: channel.name,
      ...channel.status.get(),
      consumers: {
        publications: channel.consumers.publications.size,
        status: channel.consumers.status.size,
      },
    }));

  get = (
    name: string,
  ): RealtimeChannel<TNativePublication, TNativeSubscription> => ({
    subscribe: (onPublication) =>
      this.#registerConsumer(name, (channel) => {
        const consumer = { handle: onPublication };
        channel.consumers.publications.add(consumer);
        return () => {
          channel.consumers.publications.delete(consumer);
        };
      }),
    status: {
      get: () => {
        const channel = this.#channels.get(name);

        if (channel === undefined) {
          return DETACHED_CHANNEL_STATUS;
        }

        return channel.status.get();
      },
      subscribe: (listener) =>
        this.#registerConsumer(name, (channel) => {
          const consumer = Symbol("status observer");
          channel.consumers.status.add(consumer);
          const stop = channel.status.subscribe(listener);
          return () => {
            stop();
            channel.consumers.status.delete(consumer);
          };
        }),
    },
    native: {
      get: () => {
        const channel = this.#channels.get(name);

        if (channel === undefined) {
          return null;
        }

        return channel.native.get();
      },
      // Observing is passive, like `status`: it retains the channel record so
      // the observer keeps following it, and never creates demand.
      subscribe: (listener) =>
        this.#registerConsumer(name, (channel) => {
          const consumer = Symbol("native observer");
          channel.consumers.status.add(consumer);
          const stop = channel.native.subscribe(listener);
          return () => {
            stop();
            channel.consumers.status.delete(consumer);
          };
        }),
    },
  });

  subscribeAll = () => {
    for (const channel of [...this.#channels.values()]) {
      // Earlier acquisitions can remove entries from this snapshot.
      if (this.#channels.get(channel.name) !== channel) {
        continue;
      }

      this.#subscribe(channel);
    }
  };

  #registerConsumer = (
    name: string,
    register: (
      channel: Channel<TNativePublication, TNativeSubscription>,
    ) => () => void,
  ) => {
    const channel = this.#getOrCreateChannel(name);
    const consumer = new ResourceScope();

    consumer.addCleanup(() => {
      this.#diagnostics.changed();

      // Native demand comes from publication consumers only; status observers just watch.
      if (channel.consumers.publications.size > 0) {
        return;
      }

      if (channel.consumers.status.size === 0) {
        this.#channels.delete(name);
        this.#diagnostics.record("runtime", "channel.removed", {}, name);
      }

      if (channel.attachment === null) {
        return;
      }

      channel.attachment.scope.dispose();
    });

    return consumer.setup(() => {
      consumer.addCleanup(register(channel));
      this.#diagnostics.changed();
      this.#subscribe(channel);
      return consumer.dispose;
    });
  };

  #getOrCreateChannel = (
    name: string,
  ): Channel<TNativePublication, TNativeSubscription> => {
    const existing = this.#channels.get(name);

    if (existing !== undefined) {
      return existing;
    }

    const channel: Channel<TNativePublication, TNativeSubscription> = {
      name,
      status: new ValueStore<ChannelStatus>(DETACHED_CHANNEL_STATUS),
      native: new ValueStore<TNativeSubscription | null>(null),
      consumers: { publications: new Set(), status: new Set() },
      attachment: null,
    };
    this.#channels.set(name, channel);
    channel.status.subscribe(this.#diagnostics.changed);
    this.#diagnostics.record("runtime", "channel.added", {}, name);
    return channel;
  };

  #subscribe = (channel: Channel<TNativePublication, TNativeSubscription>) => {
    if (channel.consumers.publications.size === 0) {
      return;
    }

    const session = this.#session.get();

    if (session === null) {
      return;
    }

    if (channel.attachment !== null) {
      if (channel.attachment.sessionId === session.id) {
        return;
      }

      // Cleanup can replace the session or remove the last consumer.
      channel.attachment.scope.dispose();
    }

    if (!this.#isAttachable(channel, session)) {
      return;
    }

    this.#attach(channel, session);
  };

  #isAttachable = (
    channel: Channel<TNativePublication, TNativeSubscription>,
    session: ChannelSession<TNativePublication, TNativeSubscription>,
  ) => {
    if (channel.consumers.publications.size === 0) {
      return false;
    }

    if (channel.attachment !== null) {
      return false;
    }

    const current = this.#session.get();

    if (current === null) {
      return false;
    }

    return current.id === session.id;
  };

  #attach = (
    channel: Channel<TNativePublication, TNativeSubscription>,
    session: ChannelSession<TNativePublication, TNativeSubscription>,
  ) => {
    // Reserve the channel before adapter callbacks can acquire it again.
    const scope = new ResourceScope();
    channel.attachment = { scope, sessionId: session.id };
    scope.addCleanup(() => {
      if (channel.attachment === null) {
        return;
      }

      if (channel.attachment.scope !== scope) {
        return;
      }

      channel.attachment = null;
      channel.native.set(null);
      channel.status.set(DETACHED_CHANNEL_STATUS);
      this.#diagnostics.record(
        "runtime",
        "subscription.detached",
        {},
        channel.name,
      );
    });
    session.scope.adopt(scope);

    scope.setup(() => {
      const subscription = session.connection.subscribe({
        channel: channel.name,
        observer: {
          state: (state, detail = { recovered: false }) => {
            if (!scope.isActive()) {
              return;
            }

            this.#diagnostics.record("channel", "state", state, channel.name);

            if (state === "subscribed") {
              updateStatus(channel.status, {
                state,
                error: null,
                recovered: detail.recovered,
              });
              return;
            }

            if (state === "subscribing" || state === "unsubscribed") {
              updateStatus(channel.status, {
                state,
                error: channel.status.get().error,
                recovered: false,
              });
              return;
            }

            assertUnreachable(state);
          },
          error: (error) => {
            if (!scope.isActive()) {
              return;
            }

            this.#diagnostics.record("channel", "error", error, channel.name);
            updateStatus(channel.status, { ...channel.status.get(), error });
          },
          publication: (publication) => {
            if (!scope.isActive()) {
              return;
            }

            this.#diagnostics.record(
              "channel",
              "publication",
              publication,
              channel.name,
            );
            this.#dispatch(channel, scope, publication);
          },
        },
      });
      scope.addCleanup(subscription.dispose);
      channel.native.set(subscription.native);
    });
  };

  #dispatch = (
    channel: Channel<TNativePublication, TNativeSubscription>,
    scope: ResourceScope,
    publication: RealtimePublication<TNativePublication>,
  ) => {
    for (const consumer of [...channel.consumers.publications]) {
      if (!scope.isActive()) {
        return;
      }

      if (!channel.consumers.publications.has(consumer)) {
        continue;
      }

      invokeIsolated(() => consumer.handle(publication));
    }
  };
}
