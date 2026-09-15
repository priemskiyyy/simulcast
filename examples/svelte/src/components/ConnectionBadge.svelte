<script lang="ts">
  import { formatConnectionState, getConnectionTone } from "example-shared";
  import { CircleNotch, Plugs, PlugsConnected } from "phosphor-svelte";
  import { useConnectionState } from "simulcast-svelte";
  import { match } from "ts-pattern";
  import Badge from "src/components/Badge.svelte";

  const connection = useConnectionState();
  const icon = $derived(
    match(connection.current)
      .with("connected", () => PlugsConnected)
      .with("connecting", () => CircleNotch)
      .with("disconnected", () => Plugs)
      .exhaustive(),
  );
</script>

<Badge tone={getConnectionTone(connection.current)} {icon}>
  {formatConnectionState(connection.current)}
</Badge>
