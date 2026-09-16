import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { defineConfig } from "vitepress";

const siteUrl = process.env.DOCS_SITE_URL;
const repositoryUrl =
  process.env.DOCS_REPOSITORY_URL ?? "https://github.com/priemskiyyy/simulcast";
const base =
  process.env.DOCS_BASE_PATH ?? (siteUrl ? new URL(siteUrl).pathname : "/");
const description =
  "Provider-independent realtime subscriptions for TypeScript. One lifecycle model for connections and shared channel subscriptions across Centrifugo, Pusher, Ably, MQTT, WebSocket, SSE, and more, from React, Vue, Solid, and Svelte.";

export default defineConfig({
  base,
  lang: "en-US",
  title: "Simulcast",
  description,
  head: [
    [
      "link",
      { rel: "icon", type: "image/svg+xml", href: `${base}favicon.svg` },
    ],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:site_name", content: "Simulcast" }],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    ["meta", { name: "theme-color", content: "#0f766e" }],
  ],
  ...(siteUrl ? { sitemap: { hostname: siteUrl } } : {}),
  buildEnd: async ({ outDir }) => {
    const sitemap = siteUrl
      ? `Sitemap: ${new URL("sitemap.xml", `${siteUrl.replace(/\/$/, "")}/`).href}\n`
      : "";
    await writeFile(
      join(outDir, "robots.txt"),
      `User-agent: *\nAllow: /\n${sitemap}`,
    );
  },
  transformHead: ({ pageData }) => {
    const title =
      pageData.title === "Simulcast"
        ? "Simulcast"
        : `${pageData.title} | Simulcast`;
    const head: [string, Record<string, string>][] = [
      ["meta", { property: "og:title", content: title }],
      [
        "meta",
        {
          property: "og:description",
          content: pageData.description || description,
        },
      ],
      ["meta", { name: "twitter:title", content: title }],
      [
        "meta",
        {
          name: "twitter:description",
          content: pageData.description || description,
        },
      ],
    ];
    if (!siteUrl) return head;

    const pagePath = pageData.relativePath
      .replace(/(^|\/)index\.md$/, "$1")
      .replace(/\.md$/, "");
    const url = new URL(pagePath, `${siteUrl.replace(/\/$/, "")}/`).href;
    const image = new URL(
      "images/social-preview.png",
      `${siteUrl.replace(/\/$/, "")}/`,
    ).href;
    head.push(
      ["link", { rel: "canonical", href: url }],
      ["meta", { property: "og:url", content: url }],
      ["meta", { property: "og:image", content: image }],
      [
        "meta",
        {
          property: "og:image:alt",
          content: "Simulcast. Realtime subscriptions shared across your app.",
        },
      ],
      ["meta", { name: "twitter:image", content: image }],
    );
    return head;
  },
  srcExclude: ["README.md"],
  // The hosted React example is copied into dist/demo after the site builds.
  ignoreDeadLinks: [/^\/demo\//],
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    logo: { src: "/favicon.svg", alt: "" },
    ...(repositoryUrl
      ? {
          socialLinks: [{ icon: "github" as const, link: repositoryUrl }],
          editLink: { pattern: `${repositoryUrl}/edit/main/docs/:path` },
        }
      : {}),
    nav: [
      { text: "Guide", link: "/getting-started" },
      { text: "Adapters", link: "/adapters" },
      {
        text: "Frameworks",
        items: [
          { text: "React", link: "/hooks" },
          { text: "Vue", link: "/vue" },
          { text: "Solid", link: "/solid" },
          { text: "Svelte", link: "/svelte" },
          { text: "React Native / Expo", link: "/react-native" },
        ],
      },
      { text: "Examples", link: "/examples" },
      { text: "Devtools", link: "/devtools" },
    ],
    sidebar: [
      {
        text: "Start here",
        items: [
          { text: "Getting started", link: "/getting-started" },
          { text: "Installation", link: "/installation" },
          { text: "Choose an adapter", link: "/adapters" },
          { text: "Example applications", link: "/examples" },
        ],
      },
      {
        text: "Build your application",
        items: [
          { text: "Connection sessions", link: "/sessions" },
          { text: "Payload parsing", link: "/parsing" },
          { text: "Typed events", link: "/typed-events" },
          { text: "Generated hooks", link: "/codegen" },
          { text: "Recipes", link: "/recipes" },
          { text: "Server rendering", link: "/server-rendering" },
        ],
      },
      {
        text: "Frameworks",
        items: [
          { text: "React hooks", link: "/hooks" },
          { text: "Vue composables", link: "/vue" },
          { text: "Solid primitives", link: "/solid" },
          { text: "Svelte utilities", link: "/svelte" },
          { text: "React Native and Expo", link: "/react-native" },
        ],
      },
      {
        text: "Inspect and test",
        items: [
          { text: "Browser devtools", link: "/devtools" },
          { text: "Application testing", link: "/testing" },
          { text: "Provider integration tests", link: "/integration-testing" },
          { text: "Errors and recovery", link: "/error-handling" },
          { text: "Troubleshooting", link: "/troubleshooting" },
        ],
      },
      {
        text: "Reference",
        items: [
          { text: "Core client", link: "/client" },
          { text: "Writing an adapter", link: "/writing-an-adapter" },
          { text: "Runtime architecture", link: "/internals/architecture" },
        ],
      },
    ],
    search: { provider: "local" },
    outline: { level: [2, 3] },
    footer: { message: "Released under the MIT License." },
  },
});
