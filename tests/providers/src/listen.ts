import type { Server } from "node:net";

export const listen = async (server: Server) => {
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });
  const address = server.address();

  if (address === null || typeof address === "string") {
    throw new Error("Expected the test server to bind a TCP port");
  }

  return `127.0.0.1:${address.port}`;
};
