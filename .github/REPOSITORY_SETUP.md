# Repository setup

The repository is [priemskiyyy/simulcast](https://github.com/priemskiyyy/simulcast). These settings complement the files checked into the project.

## Documentation

1. Select **GitHub Actions** as the Pages source in repository settings.
2. Run the `docs-deploy` workflow after the documentation is available on `main`.
3. Verify the deployed site, canonical URLs, sitemap, social image, and mobile navigation.
4. Add the live documentation URL to the repository's About section.

The deployment workflow obtains the site URL and base path from GitHub Pages. For another host, configure `DOCS_SITE_URL` and `DOCS_BASE_PATH` when building. Set `DOCS_REPOSITORY_URL` if the repository moves.

## Discovery

Use a concise About description and topics that match the supported packages. Suggested topics include `realtime`, `typescript`, `websocket`, `pubsub`, `react`, `vue`, `svelte`, `solidjs`, `react-native`, `centrifugo`, `pusher`, `ably`, `mqtt`, `socketio`, `supabase`, and `devtools`.

Upload the documentation social image under **Settings → General → Social preview**. GitHub repository previews use this setting independently of the documentation site's Open Graph metadata.

## Contributions and releases

- Issue forms and the pull request template are in `.github`.
- Enable private vulnerability reporting under **Settings → Security** if maintainers can monitor it.
- Configure branch protection or a ruleset after the required CI checks have run. Include unit, local provider, service integration, and documentation checks as appropriate.
- Follow [RELEASING.md](../RELEASING.md) for package publication. Package version tags and releases should describe published artifacts.

Adding these files does not enable Pages, branch rules, or package publication by itself.
