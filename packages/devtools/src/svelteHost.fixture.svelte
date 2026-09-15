<script lang="ts">
  import { createDevtools } from "src/svelte";

  const devtools = createDevtools({ initialIsOpen: true });
</script>

<div {@attach devtools}></div>
