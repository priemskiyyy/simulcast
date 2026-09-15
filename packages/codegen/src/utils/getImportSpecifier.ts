import path from "node:path";
import type { ImportExtension } from "src/types/ImportExtension";

const withExtension = (relative: string, extension: ImportExtension) => {
  if (extension === "none") {
    return relative.replace(/(?:\.d)?\.[cm]?[jt]sx?$/, "");
  }

  return relative
    .replace(/(?:\.d)?\.mts$/, ".mjs")
    .replace(/(?:\.d)?\.cts$/, ".cjs")
    .replace(/(?:\.d)?\.[jt]sx?$/, ".js");
};

export const getImportSpecifier = (
  directory: string,
  filename: string,
  extension: ImportExtension,
) => {
  const relative = withExtension(
    path.relative(directory, filename).split(path.sep).join("/"),
    extension,
  );

  if (relative.startsWith(".")) {
    return relative;
  }

  return `./${relative}`;
};
