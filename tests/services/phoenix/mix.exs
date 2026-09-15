defmodule SimulcastFixture.MixProject do
  use Mix.Project

  def project do
    [
      app: :simulcast_fixture,
      version: "0.1.0",
      elixir: "~> 1.18",
      deps: [{:phoenix, "1.8.14"}, {:bandit, "~> 1.0"}, {:jason, "~> 1.4"}]
    ]
  end

  def application do
    [mod: {SimulcastFixture.Application, []}, extra_applications: [:logger]]
  end
end
