import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { createRealtimeAdapter } from "simulcast";
import type {
  AdapterSubscribeRequest,
  AdapterSubscription,
  ConnectionState,
  RealtimeAdapter,
} from "simulcast";
import type { SocketioAdapterOptions } from "src/types/SocketioAdapterOptions";

// Socket.IO reconnects on its own after most disconnects; `active` says whether it still will.
const stateAfterDisconnect = (socket: Socket): ConnectionState =>
  socket.active ? "connecting" : "disconnected";

// A channel is an event name. Rooms are joined by the server, so nothing is sent here.
const createSubscription = (
  socket: Socket,
  { channel: event, observer }: AdapterSubscribeRequest<unknown[]>,
): AdapterSubscription<Socket> => {
  const handleEvent = (...args: unknown[]) =>
    observer.publication({ event, data: args[0], native: args });
  const handleConnect = () => observer.state("subscribed");
  const handleDisconnect = () =>
    observer.state(socket.active ? "subscribing" : "unsubscribed");

  socket.on(event, handleEvent);
  socket.on("connect", handleConnect);
  socket.on("disconnect", handleDisconnect);
  observer.state(socket.connected ? "subscribed" : "subscribing");

  return {
    native: socket,
    dispose: () => {
      socket.off(event, handleEvent);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    },
  };
};

/**
 * Describes a Socket.IO connection. Nothing connects until the client starts
 * a session; every session gets a fresh socket.
 *
 * @example
 * ```ts
 * const realtime = new RealtimeClient({
 *   adapter: socketio({ url: "https://example.com", options: { auth: { token } } }),
 * });
 * ```
 */
// Socket.IO's types reach into a transitive package, so declaration emit needs the return type spelled out.
export const socketio = ({
  url,
  options,
}: SocketioAdapterOptions): RealtimeAdapter<Socket, unknown[], Socket> =>
  createRealtimeAdapter<Socket, unknown[], Socket>({
    name: "socketio",
    connect: (observer) => {
      const socket = io(url, { ...options, autoConnect: false });
      const handleConnect = () => observer.state("connected");
      const handleDisconnect = () =>
        observer.state(stateAfterDisconnect(socket));
      const handleConnectError = (error: Error) => {
        observer.error({ error });
        observer.state(stateAfterDisconnect(socket));
      };

      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);
      socket.on("connect_error", handleConnectError);
      observer.state("connecting");
      socket.connect();

      return {
        native: socket,
        subscribe: (request) => createSubscription(socket, request),
        dispose: () => {
          socket.off("connect", handleConnect);
          socket.off("disconnect", handleDisconnect);
          socket.off("connect_error", handleConnectError);
          socket.disconnect();
        },
      };
    },
  });
