<script lang="ts">
  import type { ComponentProps } from "svelte";
  import RealtimeProvider from "../components/RealtimeProvider.svelte";
  import type { RealtimeProviderProps } from "../types/RealtimeProviderProps.js";
  import Demand from "./Demand.fixture.svelte";
  import Room from "./Room.fixture.svelte";

  type Props = {
    client: RealtimeProviderProps["client"];
    session?: NonNullable<RealtimeProviderProps["session"]>;
    room?: ComponentProps<typeof Room>;
    demand?: ComponentProps<typeof Demand>;
  };

  let { client, session = {}, room, demand }: Props = $props();
</script>

<RealtimeProvider {client} {session}>
  {#if room}
    <Room {...room} />
  {/if}
  {#if demand}
    <Demand {...demand} />
  {/if}
</RealtimeProvider>
