import type { RegisteredPublication } from "./Register.js";

export type PublicationHandler<TData> = (
  data: TData,
  publication: RegisteredPublication,
) => void | Promise<unknown>;
