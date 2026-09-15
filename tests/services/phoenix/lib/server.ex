defmodule SimulcastFixture.Application do
  use Application

  def start(_type, _args) do
    Supervisor.start_link(
      [
        {Phoenix.PubSub, name: SimulcastFixture.PubSub},
        SimulcastFixture.Endpoint
      ],
      strategy: :one_for_one
    )
  end
end

defmodule SimulcastFixture.Channel do
  use Phoenix.Channel

  def join("room:" <> _, %{"token" => "local-channel-token"}, socket), do: {:ok, socket}
  def join(_, _, _), do: {:error, %{reason: "unauthorized"}}
end

defmodule SimulcastFixture.Socket do
  use Phoenix.Socket
  channel("room:*", SimulcastFixture.Channel)

  def connect(%{"token" => "local-socket-token", "session" => session}, socket, _),
    do: {:ok, assign(socket, :session, session)}

  def connect(_, _, _), do: :error
  def id(socket), do: "session:" <> socket.assigns.session
end

defmodule SimulcastFixture.Router do
  use Plug.Router
  plug(:match)
  plug(Plug.Parsers, parsers: [:json], json_decoder: Jason)
  plug(:dispatch)

  get "/health" do
    send_resp(conn, 200, "ok")
  end

  post "/publish" do
    %{"topic" => topic, "event" => event, "payload" => payload} = conn.body_params
    SimulcastFixture.Endpoint.broadcast!(topic, event, payload)
    send_resp(conn, 204, "")
  end

  post "/disconnect" do
    %{"session" => session} = conn.body_params
    SimulcastFixture.Endpoint.broadcast!("session:" <> session, "disconnect", %{})
    send_resp(conn, 204, "")
  end

  match _ do
    send_resp(conn, 404, "not found")
  end
end

defmodule SimulcastFixture.Endpoint do
  use Phoenix.Endpoint, otp_app: :simulcast_fixture
  socket("/socket", SimulcastFixture.Socket, websocket: true, longpoll: false)
  plug(SimulcastFixture.Router)
end
