FROM elixir:1.18.4-otp-27-alpine
WORKDIR /app
RUN mix local.hex --force && mix local.rebar --force
COPY mix.exs mix.lock ./
RUN mix deps.get
COPY config ./config
COPY lib ./lib
RUN mix compile --warnings-as-errors
CMD ["mix", "run", "--no-halt"]
