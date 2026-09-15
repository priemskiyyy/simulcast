<script setup lang="ts">
import { badgeStyles } from "example-shared/styles/badgeStyles";
import type { Tone } from "example-shared";
import type { Component } from "vue";

type BadgeProps = { tone: Tone; icon?: Component };

defineProps<BadgeProps>();
</script>

<template>
  <span :class="badgeStyles({ tone: tone })">
    <component :is="icon" v-if="icon !== undefined" :size="13" weight="bold" />
    <slot />
  </span>
</template>
