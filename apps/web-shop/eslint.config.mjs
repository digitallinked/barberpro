import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const config = [
  {
    ignores: [".next/**", "node_modules/**", "public/**", "next-env.d.ts", "postcss.config.mjs"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Supabase client is often cast to `any` due to generated type limitations — treat as warning
      "@typescript-eslint/no-explicit-any": "warn",
      // Unescaped JSX entities — cosmetic, treat as warning
      "react/no-unescaped-entities": "warn",
    },
  },
];

export default config;
