import type { ManagerOptions, SocketOptions } from "socket.io-client";

export type SocketioAdapterOptions = {
  url: string;
  options?: Partial<ManagerOptions & SocketOptions>;
};
