import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  {
    ignores: [
      "**/.next/**",
      "**/out/**",
      "**/build/**",
      "**/scratch/**",
      "**/node_modules/**",
      "frontend/.next/**",
      "frontend/out/**",
      "frontend/build/**",
    ]
  },
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@next/next/no-html-link-for-pages": ["error", "frontend/src/app"],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/set-state-in-effect": "off"
    }
  }
]);

export default eslintConfig;
