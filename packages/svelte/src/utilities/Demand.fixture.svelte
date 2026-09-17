<script lang="ts">
  import { useChannelDemand } from "../index.js";

  type Props = {
    channel: string;
    enabled?: boolean;
  };

  let { channel, enabled = true }: Props = $props();

  useChannelDemand(() => channel, { enabled: () => enabled });
</script>
