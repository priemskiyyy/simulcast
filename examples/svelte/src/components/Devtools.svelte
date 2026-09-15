<script lang="ts">
  import { createDevtools } from "simulcast-devtools/svelte";

  const devtools = createDevtools();
</script>

<div {@attach devtools}></div>
