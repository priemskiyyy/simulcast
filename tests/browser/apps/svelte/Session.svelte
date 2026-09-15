<script lang="ts">
  import {
    useChannelStatus,
    useConnectionState,
  } from "@priemskiyyy/simulcast-svelte";
  import Consumer from "./Consumer.svelte";

  let { user }: { user: string } = $props();
  let first = $state(true);
  let second = $state(true);
  const channel = $derived(`private:${user}`);
  const connection = useConnectionState();
  const status = useChannelStatus(() => channel);
</script>

<section>
  <output data-testid="connection">{connection.current}</output>
  <output data-testid="channel">{status.current.state}</output>
  <label><input type="checkbox" bind:checked={first} />First consumer</label>
  <label><input type="checkbox" bind:checked={second} />Second consumer</label>
  {#if first}
    <Consumer {channel} name="first" />
  {/if}
  {#if second}
    <Consumer {channel} name="second" />
  {/if}
</section>
