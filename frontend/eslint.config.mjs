import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-e2e/**",
    ".next-e2e-demo/**",
    ".next-landing-preview/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["src/04_shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/entities/**",
                "@/features/**",
                "@/widgets/**",
                "@/pages/**",
              ],
              message: "shared 레이어는 상위 FSD 레이어를 참조할 수 없습니다.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/03_entities/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/**", "@/widgets/**", "@/pages/**"],
              message:
                "entities 레이어는 상위 FSD 레이어를 참조할 수 없습니다.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/02_features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/widgets/**", "@/pages/**"],
              message:
                "features 레이어는 상위 FSD 레이어를 참조할 수 없습니다.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/01_widgets/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/pages/**"],
              message: "widgets 레이어는 pages 레이어를 참조할 수 없습니다.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
