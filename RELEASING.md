# Releasing the packages

All packages share one version line. Each has its own GitHub release tag; one publishing workflow serves them all. Pushes and verification runs do not publish npm packages.

The release tag is `<package>-v<version>`, for example `simulcast-react-v0.1.0`. The publish workflow resolves the package from the tag, verifies its metadata and changelog entry, runs the test workflows, and publishes the verified tarball from `.artifacts/release/<package>/` with provenance after checking its checksum. Prereleases use the `next` dist-tag; stable releases use `latest`.

Publish `simulcast` first, then the framework bindings, then adapters, devtools, and codegen. Dependents declare the matching minor as a peer dependency.

## Prepare a release

1. Update the package versions and their entries in `CHANGELOG.md` together. Date the entries; `Unreleased` blocks publishing.
2. Run `pnpm check:release` with Docker running. Also run the [local service suites](tests/providers/README.md#more-credential-free-suites); Phoenix and Supabase require the documented startup and cleanup commands. The release workflow gates publication on these integration jobs as well as the Centrifugo browser suite.
3. Merge into `main` and verify GitHub Actions on that revision.
4. Create a GitHub release with the package's tag. Mark prerelease versions as prereleases.
5. Approve the publish job in the GitHub `npm` environment once its verification jobs pass.

Do not reuse a published version. Prepare a new patch version and changelog entry for a release fix.

## npm trusted publishers

All packages use the GitHub owner `priemskiyyy`, repository `simulcast`, workflow `publish.yml`, and environment `npm`. Trusted publishing uses GitHub's short-lived OIDC identity, so the repository needs no npm token.

The first publication of a new package requires an authenticated npm maintainer, because the package must exist before its trusted publisher can be configured. Publish the verified tarball from its artifact directory, then register the workflow. Do not create a GitHub release for that same version afterward.

```sh
npm login
cd .artifacts/release/simulcast
shasum -a 256 -c SHA256SUMS
npm publish simulcast-<version>.tgz --access public --tag latest
```
