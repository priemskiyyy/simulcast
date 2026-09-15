<script lang="ts">
  import type { ComponentProps } from "svelte";
  import RealtimeProvider from "../components/RealtimeProvider.svelte";
  import type { RealtimeProviderProps } from "../types/RealtimeProviderProps.js";
  import Room from "./Room.fixture.svelte";

  type Props = {
    client: RealtimeProviderProps["client"];
    session?: NonNullable<RealtimeProviderProps["session"]>;
    room: ComponentProps<typeof Room>;
  };

  let { client, session = {}, room }: Props = $props();
</script>

<RealtimeProvider {client} {session}>
  <Room {...room} />
</RealtimeProvider>
