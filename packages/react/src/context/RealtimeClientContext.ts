import { createContext } from "react";
import type { RegisteredClient } from "src/types/Register";

export const RealtimeClientContext = createContext<
  RegisteredClient | undefined
>(undefined);
