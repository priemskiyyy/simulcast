<script lang="ts">
  import type { Snippet } from "svelte";
  import type { Icon } from "src/types/Icon";

  type PanelProps = {
    title: string;
    icon: Icon;
    aside?: Snippet;
    children: Snippet;
  };

  let { title, icon: PanelIcon, aside, children }: PanelProps = $props();
</script>

<section
  aria-label={title}
  class="flex min-h-72 flex-col rounded-2xl border border-zinc-200/80 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70"
>
  <header class="mb-4 flex items-center gap-2">
    <PanelIcon
      size={18}
      weight="duotone"
      class="text-emerald-600 dark:text-emerald-400"
    />
    <h2
      class="text-sm font-semibold tracking-wide uppercase text-zinc-600 dark:text-zinc-400"
    >
      {title}
    </h2>
    <div class="ml-auto flex items-center gap-2">
      {#if aside}
        {@render aside()}
      {/if}
    </div>
  </header>
  {@render children()}
</section>
