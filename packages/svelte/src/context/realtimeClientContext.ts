import { getContext, setContext } from "svelte";
import type { ReadableBox } from "../types/ReadableBox.js";
import type { RegisteredClient } from "../types/Register.js";

const REALTIME_CLIENT_KEY = Symbol("simulcast client");

export const setRealtimeClient = (client: ReadableBox<RegisteredClient>) => {
  setContext(REALTIME_CLIENT_KEY, client);
};

export const getRealtimeClient = () =>
  getContext<ReadableBox<RegisteredClient> | undefined>(REALTIME_CLIENT_KEY);
