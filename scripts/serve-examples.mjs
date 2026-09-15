import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const examples = ["react", "vue", "solid", "svelte", "expo"];
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

for (const [index, example] of examples.entries()) {
  const root = path.resolve(
    fileURLToPath(new URL(`../examples/${example}/dist/`, import.meta.url)),
  );
  createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(
        new URL(request.url, "http://localhost").pathname,
      );
      const filename = path.resolve(
        root,
        `.${pathname === "/" ? "/index.html" : pathname}`,
      );
      if (!filename.startsWith(`${root}${path.sep}`)) {
        response.writeHead(403).end();
        return;
      }
      const contents = await readFile(filename);
      response.writeHead(200, {
        "Content-Type":
          types[path.extname(filename)] ?? "application/octet-stream",
      });
      response.end(contents);
    } catch {
      response.writeHead(404).end();
    }
  }).listen(4190 + index, "127.0.0.1");
}
