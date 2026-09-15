import type * as Party from "partykit/server";

export default class TestRoom implements Party.Server {
  private static rejectedHandshakes = 0;
  private accepted = 0;

  constructor(readonly room: Party.Room) {}

  static onBeforeConnect(request: Party.Request) {
    if (new URL(request.url).searchParams.get("token") !== "local-test-token") {
      TestRoom.rejectedHandshakes++;
      return new Response("Unauthorized", { status: 401 });
    }
    return request;
  }

  onConnect() {
    this.accepted++;
  }

  onMessage(message: string | ArrayBuffer | ArrayBufferView) {
    this.room.broadcast(message);
  }

  async onRequest(request: Party.Request) {
    if (new URL(request.url).searchParams.has("rejected")) {
      return Response.json(TestRoom.rejectedHandshakes);
    }
    if (request.method === "GET") {
      return Response.json({
        connections: Array.from(this.room.getConnections()).length,
        accepted: this.accepted,
      });
    }
    if (new URL(request.url).searchParams.has("drop")) {
      for (const connection of this.room.getConnections()) {
        connection.close(1012, "Test server restart");
      }
      return new Response(null, { status: 204 });
    }
    this.room.broadcast(await request.text());
    return new Response(null, { status: 204 });
  }
}
