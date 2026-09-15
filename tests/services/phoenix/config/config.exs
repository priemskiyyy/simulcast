import Config

config :simulcast_fixture, SimulcastFixture.Endpoint,
  adapter: Bandit.PhoenixAdapter,
  http: [ip: {0, 0, 0, 0}, port: 4000],
  server: true,
  check_origin: false,
  secret_key_base: String.duplicate("local-fixture-only-", 4),
  pubsub_server: SimulcastFixture.PubSub

config :phoenix, :json_library, Jason
config :logger, level: :warning
