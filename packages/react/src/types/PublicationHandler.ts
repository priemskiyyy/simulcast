import type { RegisteredPublication } from "src/types/Register";

export type PublicationHandler<TData> = (
  data: TData,
  publication: RegisteredPublication,
) => void | Promise<unknown>;
