import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "docs/.vitepress/dist");
const siteUrl = process.env.DOCS_SITE_URL;
const base =
  process.env.DOCS_BASE_PATH ?? (siteUrl ? new URL(siteUrl).pathname : "/");
const files = readdirSync(output, { recursive: true }).filter(
  (file) => file.endsWith(".html") && file !== "404.html",
);
assert.ok(files.length > 0, "Build the documentation before verifying it");
const pageIds = new Map();
for (const file of files) {
  const dom = new JSDOM(readFileSync(path.join(output, file), "utf8"));
  pageIds.set(
    file,
    new Set(
      Array.from(
        dom.window.document.querySelectorAll("[id]"),
        (element) => element.id,
      ),
    ),
  );
  dom.window.close();
}

for (const file of files) {
  const dom = new JSDOM(readFileSync(path.join(output, file), "utf8"));
  const document = dom.window.document;
  const meta = (selector) =>
    document.querySelector(selector)?.getAttribute("content");
  assert.ok(
    document.title.includes("Simulcast"),
    `${file}: missing page title`,
  );
  assert.equal(
    document.querySelectorAll("h1").length,
    1,
    `${file}: expected one main heading`,
  );
  // The documentation home page renders VPDoc like any other page.
  assert.equal(
    document.querySelectorAll("main").length,
    1,
    `${file}: expected one main landmark`,
  );
  const origin = new URL(siteUrl ?? "https://docs.local").origin;
  const currentUrl = new URL(`${base}${file}`, origin);
  for (const link of document.querySelectorAll("a[href]")) {
    const target = new URL(link.getAttribute("href"), currentUrl);
    if (target.origin !== origin) continue;
    assert.ok(
      target.pathname.startsWith(base),
      `${file}: link escapes the configured base: ${target.pathname}`,
    );
    const relative = decodeURIComponent(target.pathname.slice(base.length));
    const targetFile =
      relative.endsWith("/") || relative === ""
        ? `${relative}index.html`
        : path.extname(relative)
          ? relative
          : `${relative}.html`;
    assert.ok(
      existsSync(path.join(output, targetFile)),
      `${file}: missing link target ${targetFile}`,
    );
    if (target.hash && pageIds.has(targetFile)) {
      assert.ok(
        pageIds.get(targetFile).has(decodeURIComponent(target.hash.slice(1))),
        `${file}: missing anchor ${targetFile}${target.hash}`,
      );
    }
  }
  assert.ok(meta('meta[name="description"]'), `${file}: missing description`);
  for (const property of ["og:title", "og:description"]) {
    assert.ok(
      meta(`meta[property="${property}"]`),
      `${file}: missing ${property}`,
    );
  }
  for (const image of document.querySelectorAll("main img")) {
    assert.ok(image.hasAttribute("alt"), `${file}: image is missing alt text`);
    const source = image.getAttribute("src");
    if (source?.startsWith(base)) {
      assert.ok(
        existsSync(path.join(output, source.slice(base.length))),
        `${file}: missing image ${source}`,
      );
    }
  }
  if (siteUrl) {
    const expected = new URL(
      file.replace(/(^|\/)index\.html$/, "$1").replace(/\.html$/, ""),
      `${siteUrl.replace(/\/$/, "")}/`,
    ).href;
    assert.equal(
      document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
      expected,
      `${file}: incorrect canonical URL`,
    );
    assert.equal(
      meta('meta[property="og:url"]'),
      expected,
      `${file}: incorrect Open Graph URL`,
    );
    const image = meta('meta[property="og:image"]');
    assert.ok(
      image?.startsWith(`${siteUrl.replace(/\/$/, "")}/`),
      `${file}: social image must use the deployed site URL`,
    );
    assert.ok(
      meta('meta[property="og:image:alt"]'),
      `${file}: missing social image description`,
    );
  }
  dom.window.close();
}

if (siteUrl) {
  const robots = readFileSync(path.join(output, "robots.txt"), "utf8");
  const sitemapUrl = new URL("sitemap.xml", `${siteUrl.replace(/\/$/, "")}/`)
    .href;
  assert.ok(
    robots.includes(`Sitemap: ${sitemapUrl}`),
    "robots.txt must link to the deployed sitemap",
  );
  assert.ok(
    existsSync(path.join(output, "sitemap.xml")),
    "Missing sitemap.xml",
  );
}
console.log(
  `Verified titles, headings, descriptions, images, and deployment metadata for ${files.length} documentation pages.`,
);
