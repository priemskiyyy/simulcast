<script lang="ts">
  import { RealtimeProvider } from "simulcast-svelte";
  import { createClient } from "../../shared/createClient";
  import { inspect } from "../../shared/inspection";
  import Session from "./Session.svelte";
  import "../../shared/styles.css";

  let user = $state(
    new URLSearchParams(location.search).get("user") ?? "browser-test",
  );
  let enabled = $state(true);
  let mounted = $state(true);
  let diagnostics = $state("");
  const client = $derived(createClient(user));
</script>

<main>
  <header><h1>Simulcast browser tests</h1></header>
  <label>User<input aria-label="User" bind:value={user} /></label>
  <label><input type="checkbox" bind:checked={enabled} />Session enabled</label>
  <label><input type="checkbox" bind:checked={mounted} />Provider mounted</label
  >
  <button type="button" onclick={() => (diagnostics = inspect())}>
    Inspect resources
  </button>
  <output data-testid="diagnostics">{diagnostics}</output>
  {#if mounted}
    <RealtimeProvider {client} session={{ enabled }}>
      <Session {user} />
    </RealtimeProvider>
  {/if}
</main>
