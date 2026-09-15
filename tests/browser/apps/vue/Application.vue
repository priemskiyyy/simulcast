<script setup lang="ts">
import { computed, shallowRef } from "vue";
import { RealtimeProvider } from "simulcast-vue";
import { createClient } from "../../shared/createClient";
import { inspect } from "../../shared/inspection";
import Session from "./Session.vue";
import "../../shared/styles.css";

const user = shallowRef(
  new URLSearchParams(location.search).get("user") ?? "browser-test",
);
const enabled = shallowRef(true);
const mounted = shallowRef(true);
const diagnostics = shallowRef("");
const client = computed(() => createClient(user.value));
</script>

<template>
  <main>
    <header><h1>Simulcast browser tests</h1></header>
    <label>User<input aria-label="User" v-model="user" /></label>
    <label><input type="checkbox" v-model="enabled" />Session enabled</label>
    <label><input type="checkbox" v-model="mounted" />Provider mounted</label>
    <button type="button" @click="diagnostics = inspect()">
      Inspect resources
    </button>
    <output data-testid="diagnostics">{{ diagnostics }}</output>
    <RealtimeProvider v-if="mounted" :client="client" :session="{ enabled }">
      <Session :user="user" />
    </RealtimeProvider>
  </main>
</template>
