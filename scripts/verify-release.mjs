import assert from "node:assert/strict";
import { appendFileSync, existsSync, readdirSync, readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const changelog = readFileSync(new URL("CHANGELOG.md", root), "utf8");
const packages = Object.fromEntries(
  ["packages", "packages/adapters"].flatMap((group) =>
    readdirSync(new URL(group, root))
      .filter((directory) =>
        existsSync(new URL(`${group}/${directory}/package.json`, root)),
      )
      .map((directory) => {
        const metadata = JSON.parse(
          readFileSync(
            new URL(`${group}/${directory}/package.json`, root),
            "utf8",
          ),
        );
        return [
          metadata.name,
          { directory: `${group}/${directory}`, metadata },
        ];
      }),
  ),
);
const tag = process.env.RELEASE_TAG;
// A release tag names its package: `<name>-v<version>`.
const fromTag =
  tag === undefined ? [] : [tag.replace(/-v[^-]*(-[\w.]+)?$/, "")];
const selected = [...process.argv.slice(2), ...fromTag];
const names = selected.length === 0 ? Object.keys(packages) : selected;

for (const name of names) {
  const configuration = packages[name];
  assert(configuration, `Unknown release package: ${name}`);
  const { metadata, directory } = configuration;
  assert.equal(metadata.license, "MIT");
  assert.equal(
    metadata.repository.url,
    "git+https://github.com/priemskiyyy/simulcast.git",
  );
  assert.equal(metadata.repository.directory, directory);
  assert.equal(
    metadata.bugs.url,
    "https://github.com/priemskiyyy/simulcast/issues",
  );
  assert.equal(metadata.publishConfig.access, "public");
  assert.match(metadata.version, /^\d+\.\d+\.\d+(?:-[\w.-]+)?$/);
  const entry = changelog
    .split("\n")
    .find((line) => line.startsWith(`## ${name} ${metadata.version} - `));
  assert(entry, `${name} ${metadata.version} needs a changelog entry.`);
  if (tag !== undefined) {
    assert(
      !entry.endsWith("Unreleased"),
      "Date the changelog entry before publishing a release.",
    );
    assert.equal(
      tag,
      `${name}-v${metadata.version}`,
      "Release tag must match the package version.",
    );
  }
  const prerelease = process.env.RELEASE_PRERELEASE;
  if (prerelease !== undefined) {
    assert.equal(
      prerelease,
      String(metadata.version.includes("-")),
      "The GitHub prerelease flag must match the package version suffix.",
    );
  }
  if (process.env.GITHUB_OUTPUT !== undefined && tag !== undefined) {
    appendFileSync(process.env.GITHUB_OUTPUT, `package=${name}\n`);
  }
  console.log(`Release metadata is valid for ${name} ${metadata.version}.`);
}
