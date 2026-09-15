<!--
@component
Owns the client's session while mounted. Changing the session ID or disabling
it releases the previous connection; utilities keep their registrations.
Effects do not run on the server, so server rendering opens nothing.

@example
```svelte
<RealtimeProvider client={realtime} session={{ id: user.id }}>
  <Room />
</RealtimeProvider>
```
-->
<script lang="ts">
  import { setRealtimeClient } from "../context/realtimeClientContext.js";
  import type { RealtimeProviderProps } from "../types/RealtimeProviderProps.js";

  const props: RealtimeProviderProps = $props();

  // Deriveds only change by value, so a new session object with the same ID is
  // inert. The ID is part of the active value so that changing it reconnects.
  const client = $derived(props.client);
  const id = $derived(props.session?.id);
  const enabled = $derived(props.session?.enabled ?? true);
  const active = $derived(enabled ? { client, id } : null);

  setRealtimeClient({
    get current() {
      return client;
    },
  });

  $effect(() => {
    if (active === null) {
      return;
    }

    return active.client.connect();
  });
</script>

{#if props.children}
  {@render props.children()}
{/if}
