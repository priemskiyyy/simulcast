import type { InjectionKey, Ref } from "vue";
import type { RealtimeClient } from "@priemskiyyy/simulcast";

export const REALTIME_CLIENT_KEY: InjectionKey<Readonly<Ref<RealtimeClient>>> =
  Symbol("simulcast client");
