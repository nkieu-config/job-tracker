import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
    "src/generated/**",
  ]),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["src/lib/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/server", "@/server/**"],
              message:
                "src/lib is isomorphic and ships to the browser — it cannot import server-only code. See docs/architecture.md.",
            },
            {
              group: ["@/components/**", "@/actions/**"],
              message:
                "src/lib is the lowest layer; it cannot depend on UI or Server Actions.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/server", "@/server/**"],
              message:
                "Components must not import server-only modules, not even for a type — move the shared shape into src/lib.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/app/**/*.{ts,tsx}", "src/actions/**/*.ts", "src/server/**/*.ts"],
    ignores: [
      "src/server/data/**",
      "src/server/prisma.ts",
      "src/server/auth.ts",
      "src/server/rate-limit.ts",
      "src/server/blob.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/server/prisma",
              message:
                "Database access belongs in src/server/data/. auth.ts (adapter wiring) and rate-limit.ts (atomic upsert) are the recorded exceptions.",
            },
            {
              name: "@vercel/blob",
              message:
                "Blob storage access belongs in src/server/blob.ts, the way Gemini access belongs in src/server/ai/.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
