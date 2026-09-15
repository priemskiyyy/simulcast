<script lang="ts">
  import { sourceButtonStyles } from "example-shared/styles/sourceButtonStyles";
  import type { RealtimeSource } from "example-shared";
  import { Broadcast, Cpu } from "phosphor-svelte";

  type SourceSwitchProps = { sourceType: RealtimeSource["type"] };

  let { sourceType = $bindable() }: SourceSwitchProps = $props();

  const OPTIONS = [
    { type: "SIMULATION", label: "Simulation", icon: Cpu },
    { type: "CENTRIFUGO", label: "Centrifugo", icon: Broadcast },
  ] as const;
</script>

<div
  role="group"
  aria-label="Realtime source"
  class="inline-flex rounded-full bg-zinc-200/70 p-1 dark:bg-zinc-800"
>
  {#each OPTIONS as option (option.type)}
    {@const OptionIcon = option.icon}
    <button
      type="button"
      aria-pressed={sourceType === option.type}
      class={sourceButtonStyles({ selected: sourceType === option.type })}
      onclick={() => (sourceType = option.type)}
    >
      <OptionIcon size={14} weight="bold" />
      {option.label}
    </button>
  {/each}
</div>
