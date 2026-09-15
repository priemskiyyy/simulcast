<script lang="ts">
  import { badgeStyles } from "example-shared/styles/badgeStyles";
  import type { Tone } from "example-shared";
  import type { Snippet } from "svelte";
  import type { Icon } from "src/types/Icon";

  type BadgeProps = { tone: Tone; icon?: Icon; children: Snippet };

  let { tone, icon: BadgeIcon, children }: BadgeProps = $props();
</script>

<span class={badgeStyles({ tone: tone })}>
  {#if BadgeIcon}
    <BadgeIcon size={13} weight="bold" />
  {/if}
  {@render children()}
</span>
