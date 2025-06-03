import {
  dirname
} from "path";
import {
  fileURLToPath
} from "url";
import {
  FlatCompat
} from "@eslint/eslintrc";
import tsParser from "@typescript-eslint/parser";
import tseslint from "@typescript-eslint/eslint-plugin";

const __filename = fileURLToPath(
  import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["**/*.ts", "**/*.tsx"], // 针对 TypeScript 文件
    languageOptions: {
      parser: tsParser, // 使用 TypeScript 解析器
      sourceType: "module",
    },
    plugins: {
      "@typescript-eslint": tseslint, // 注册 TypeScript 插件
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // 允许使用 any 类型
    },
  },
];

export default eslintConfig;