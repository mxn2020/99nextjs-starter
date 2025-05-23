import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/**
 * @typedef {import('eslint').Linter.Config} ESLintConfig
 */

/** @type {ESLintConfig[]} */
const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "react/no-unescaped-entities": "warn", // Change from error to warning
      "@typescript-eslint/no-unused-vars": "warn", // Change unused variables from error to warning
      "@typescript-eslint/no-explicit-any": "off", // Allow the use of 'any' type
      "@typescript-eslint/no-empty-object-type": "warn", // Change empty object types from error to warning
      "no-unused-vars": "warn", // For JavaScript files
      "prefer-const": "warn", // Change 'never reassigned' from error to warning
      "@typescript-eslint/no-unused-expressions": "warn" // Add as warning instead of error
    }
  }
];

export default eslintConfig;
