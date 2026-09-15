<script lang="ts">
  import { useChannel } from "@priemskiyyy/simulcast-svelte";

  let { channel, name }: { channel: string; name: string } = $props();
  let messages = $state<string[]>([]);

  useChannel<{ text: string }>(
    () => channel,
    (message) => {
      messages = [...messages, message.text];
    },
  );
</script>

<output data-testid={name}>{JSON.stringify(messages)}</output>
