import { createContext } from "solid-js";
import type { Accessor } from "solid-js";
import type { RegisteredClient } from "src/types/Register";

export const RealtimeClientContext =
  createContext<Accessor<RegisteredClient>>();
