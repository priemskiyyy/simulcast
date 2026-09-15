<script lang="ts">
  import {
    DEFAULT_ENDPOINT,
    createRealtimeClient,
    resolveSource,
  } from "example-shared";
  import type { RealtimeSource } from "example-shared";
  import { RealtimeProvider } from "simulcast-svelte";
  import Dashboard from "src/components/Dashboard.svelte";
  import Devtools from "src/components/Devtools.svelte";
  import Header from "src/components/Header.svelte";
  import SimulationControls from "src/components/SimulationControls.svelte";

  let sourceType: RealtimeSource["type"] = $state("SIMULATION");
  let endpoint = $state(DEFAULT_ENDPOINT);
  let roomId = $state("demo");
  let enabled = $state(true);
  // The adapter captures its endpoint, so the client changes exactly when the source does.
  const client = $derived(
    createRealtimeClient(resolveSource({ sourceType, endpoint })),
  );
</script>

<RealtimeProvider {client} session={{ enabled }}>
  <Header
    bind:sourceType
    bind:endpoint
    bind:roomId
    {enabled}
    onSessionToggle={() => (enabled = !enabled)}
  />
  <main class="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
    {#if sourceType === "SIMULATION"}
      <SimulationControls {roomId} />
    {/if}
    {#key roomId}
      <Dashboard {roomId} />
    {/key}
  </main>
  {#if import.meta.env.DEV}
    <Devtools />
  {/if}
</RealtimeProvider>
