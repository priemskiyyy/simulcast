<script setup lang="ts">
import type { Component } from "vue";

type EmptyStateProps = { icon: Component; title: string; description: string };

defineProps<EmptyStateProps>();
</script>

<template>
  <div
    class="m-auto flex max-w-xs flex-col items-center gap-2 py-8 text-center"
  >
    <component :is="icon" :size="28" weight="thin" class="text-zinc-400" />
    <p class="text-sm font-medium">{{ title }}</p>
    <p class="text-xs text-zinc-500 dark:text-zinc-400">{{ description }}</p>
  </div>
</template>
