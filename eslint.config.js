import eslint from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import svelte from "eslint-plugin-svelte";
import tseslint from "typescript-eslint";

const typescriptRules = {
  "@typescript-eslint/consistent-type-imports": "error",
  "@typescript-eslint/consistent-type-definitions": ["error", "type"],
  "no-restricted-syntax": [
    "error",
    "TSEnumDeclaration",
    "SwitchStatement",
    "UnaryExpression[operator='void']",
  ],
};

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/.svelte-kit/**",
      "**/.expo/**",
      "**/node_modules/**",
      "**/generated/**",
      "examples/expo/src/uniwind-types.d.ts",
      ".artifacts/**",
      "docs/.vitepress/cache/**",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...svelte.configs.recommended,
  {
    files: ["examples/expo/metro.config.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: typescriptRules,
  },
  {
    // React rules only where React runs; Solid components share the .tsx extension.
    files: [
      "packages/react/**/*.{ts,tsx}",
      "examples/expo/**/*.{ts,tsx}",
      "packages/devtools/src/react.ts",
      "packages/adapters/*/src/**/react.ts",
      "packages/adapters/*/src/hooks/**/*.ts",
      "examples/react/**/*.{ts,tsx}",
      "tests/browser/apps/react/**/*.{ts,tsx}",
    ],
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    files: ["**/*.svelte", "**/*.svelte.ts"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: [".svelte"],
      },
    },
    // Svelte scripts are TypeScript, so svelte-check reports unknown names.
    rules: { ...typescriptRules, "no-undef": "off" },
  },
  {
    files: ["**/*.{js,mjs}"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        URL: "readonly",
        fetch: "readonly",
        AbortSignal: "readonly",
        require: "readonly",
        module: "writable",
        __dirname: "readonly",
      },
    },
  },
);
