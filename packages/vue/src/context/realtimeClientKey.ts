import type { InjectionKey, Ref } from "vue";
import type { RegisteredClient } from "src/types/Register";

export const REALTIME_CLIENT_KEY: InjectionKey<
  Readonly<Ref<RegisteredClient>>
> = Symbol("simulcast client");
