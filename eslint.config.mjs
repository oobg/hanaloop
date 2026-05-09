import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintPluginImport from "eslint-plugin-import";
import simpleImportSort from "eslint-plugin-simple-import-sort";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "tmp/**",
    "next-env.d.ts",
    // Next.js CLI–generated types (see file headers; avoid lint drift on regen)
    "types/cache-life.d.ts",
    "types/routes.d.ts",
    "types/validator.ts",
  ]),
  {
    plugins: {
      import: eslintPluginImport,
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "import/first": "error",
      "import/newline-after-import": "error",
      "import/no-duplicates": "error",
      // useEffect 내 setLoading 같은 표준 async fetch 패턴을 허용
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
