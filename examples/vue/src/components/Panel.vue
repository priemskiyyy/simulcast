<script setup lang="ts">
import type { Component } from "vue";

type PanelProps = { title: string; icon: Component };

defineProps<PanelProps>();
</script>

<template>
  <section
    :aria-label="title"
    class="flex min-h-72 flex-col rounded-2xl border border-zinc-200/80 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70"
  >
    <header class="mb-4 flex items-center gap-2">
      <component
        :is="icon"
        :size="18"
        weight="duotone"
        class="text-emerald-600 dark:text-emerald-400"
      />
      <h2
        class="text-sm font-semibold tracking-wide uppercase text-zinc-600 dark:text-zinc-400"
      >
        {{ title }}
      </h2>
      <div class="ml-auto flex items-center gap-2"><slot name="aside" /></div>
    </header>
    <slot />
  </section>
</template>
