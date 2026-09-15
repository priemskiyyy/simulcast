import type { CodegenConfiguration } from "src/types/CodegenConfiguration";

export type ImportExtension = NonNullable<
  CodegenConfiguration["imports"]
>["extension"];
