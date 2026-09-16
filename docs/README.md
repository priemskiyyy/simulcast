# Documentation

Run `pnpm dev:docs` for the documentation site or browse these guides on GitHub.

## Start here

| Guide                                                      | What you will learn                                     |
| ---------------------------------------------------------- | ------------------------------------------------------- |
| [Getting started](getting-started.md)                      | Build a working React subscription without credentials  |
| [Installation](installation.md)                            | Choose framework packages and provider SDKs             |
| [Adapters](adapters.md)                                    | Compare all eleven adapters and their channel semantics |
| [Examples](examples.md)                                    | Run Mission Control in five frameworks                  |
| [Live demo](https://priemskiyyy.github.io/simulcast/demo/) | Open the hosted React example with devtools             |

## Build and inspect

| Guide                                    | What it covers                                                             |
| ---------------------------------------- | -------------------------------------------------------------------------- |
| [Sessions](sessions.md)                  | Account changes, credentials, and connection lifetime                      |
| [Payload parsing](parsing.md)            | Validate with Zod, decode JSON and MQTT bytes, and handle invalid messages |
| [Typed events](typed-events.md)          | Event maps, parsers, and payload inference                                 |
| [Code generation](codegen.md)            | Generate named hooks from an event map                                     |
| [Recipes](recipes.md)                    | Query invalidation, cache updates, and native calls                        |
| [Devtools](devtools.md)                  | Inspect subscriptions and event history                                    |
| [Testing](testing.md)                    | Test consumers without provider SDKs                                       |
| [Errors and recovery](error-handling.md) | Locate failures and recover application state                              |
| [Troubleshooting](troubleshooting.md)    | Diagnose detached channels, missing messages, and session issues           |
| [Server rendering](server-rendering.md)  | Server snapshots, hydration, and request isolation                         |

[Provider integration tests](integration-testing.md) documents real local servers,
credential-free setup, and the remaining hosted-service coverage limits.

## Frameworks and reference

- [React hooks](hooks.md)
- [Vue composables](vue.md)
- [Solid primitives](solid.md)
- [Svelte utilities](svelte.md)
- [React Native and Expo](react-native.md)
- [Core client](client.md)
- [Writing an adapter](writing-an-adapter.md)
- [Runtime architecture](internals/architecture.md)

## Publish the documentation

The site uses the Simulcast repository for source links. Configure these when
you deploy or move the documentation:

| Variable              | Example                               | Purpose                                                             |
| --------------------- | ------------------------------------- | ------------------------------------------------------------------- |
| `DOCS_SITE_URL`       | `https://docs.example.com/library/`   | Public site URL for canonical links, sitemap, and social image URLs |
| `DOCS_BASE_PATH`      | `/library/`                           | Asset and route prefix; defaults to the site URL's path, or `/`     |
| `DOCS_REPOSITORY_URL` | `https://github.com/owner/repository` | Override the GitHub and edit links                                  |

Use leading and trailing slashes for the base path. The GitHub Pages workflow can
supply deployment values from Pages configuration. Without a site URL, local
builds omit canonical URLs and the sitemap rather than advertise an assumed host.

```sh
pnpm lint:docs
pnpm build:docs
pnpm verify:docs
```

VitePress validates internal page links during the build. The default theme
provides local search, mobile navigation, keyboard-accessible controls, and dark
mode. Page descriptions are kept alongside each guide's content.

The build also writes `robots.txt` with the configured sitemap URL. Search engines
read robots rules at the hostname root; when hosting under a project subpath, the
host's root robots policy takes precedence. No indexing or search ranking is guaranteed.
