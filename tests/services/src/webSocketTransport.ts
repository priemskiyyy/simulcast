import WebSocket from "ws";

export const webSocketTransport = (headers: Record<string, string> = {}) => {
  const sockets = new Set<WebSocket>();
  let accepted = 0;

  return {
    transport: class extends WebSocket {
      constructor(address: string | URL, protocols?: string | string[]) {
        super(address, protocols, { headers });
        sockets.add(this);
        this.on("open", () => accepted++);
        this.on("close", () => sockets.delete(this));
      }
    },
    accepted: () => accepted,
    connections: () => sockets.size,
    drop: () => {
      for (const socket of sockets) socket.terminate();
    },
  };
};
