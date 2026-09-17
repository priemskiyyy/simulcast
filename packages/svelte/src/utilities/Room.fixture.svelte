<script lang="ts">
  import type { RealtimeClient } from "@priemskiyyy/simulcast";
  import {
    useChannel,
    useChannelStatus,
    useConnectionState,
    useNativeChannel,
    useNativeConnection,
    useRealtimeClient,
  } from "../index.js";
  import type { PublicationHandler } from "../index.js";
  import { useChannelEvent } from "./events.fixture.js";

  type Props = {
    channel: string;
    enabled?: boolean;
    onFirst?: PublicationHandler<string>;
    onSecond?: PublicationHandler<unknown>;
    onCreated?: PublicationHandler<unknown>;
    onClient?: (client: RealtimeClient) => void;
    onNative?: (native: unknown) => void;
    onNativeChannel?: (subscription: unknown) => void;
  };

  let {
    channel,
    enabled = true,
    onFirst = () => {},
    onSecond = () => {},
    onCreated = () => {},
    onClient = () => {},
    onNative = () => {},
    onNativeChannel = () => {},
  }: Props = $props();

  const client = useRealtimeClient();
  const connection = useConnectionState();
  const native = useNativeConnection();
  const status = useChannelStatus(() => channel);
  const subscription = useNativeChannel(() => channel);

  useChannel(
    () => channel,
    (data, publication) => onFirst(data, publication),
    { enabled: () => enabled, parse: (data: unknown) => `${String(data)}!` },
  );
  useChannel(
    () => channel,
    (data, publication) => onSecond(data, publication),
  );
  useChannelEvent(
    () => channel,
    "created",
    (data, publication) => onCreated(data, publication),
  );

  $effect(() => {
    onClient(client.current);
  });
  $effect(() => {
    onNative(native.current);
  });
  $effect(() => {
    onNativeChannel(subscription.current);
  });
</script>

<span data-testid="connection">{connection.current}</span>
<span data-testid="status">{status.current.state}</span>
