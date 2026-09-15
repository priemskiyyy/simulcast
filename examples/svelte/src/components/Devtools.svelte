<script lang="ts">
  import { createDevtools } from "@priemskiyyy/simulcast-devtools/svelte";

  const devtools = createDevtools();
</script>

<div {@attach devtools}></div>
