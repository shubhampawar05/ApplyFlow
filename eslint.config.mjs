import typescriptParser from "@typescript-eslint/parser";
import nextPlugin from "@next/eslint-plugin-next";

export default [
  { ignores: [".next/**", "node_modules/**", "coverage/**", "src/generated/**"] },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parser: typescriptParser },
    plugins: { "@next/next": nextPlugin },
    rules: {
      "no-constant-binary-expression": "error",
      "no-duplicate-imports": "error",
      "no-unreachable": "error",
    },
  },
];
