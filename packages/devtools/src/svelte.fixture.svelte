<script lang="ts">
  import type { RealtimeClient } from "simulcast";
  import { RealtimeProvider } from "simulcast-svelte";
  import Host from "src/svelteHost.fixture.svelte";

  let { client }: { client: RealtimeClient } = $props();
</script>

<RealtimeProvider {client}>
  <Host />
</RealtimeProvider>
