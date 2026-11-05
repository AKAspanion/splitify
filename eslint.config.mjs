import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    ignores: [
      ".next/**",
      ".claude/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "public/sw.js",
      "packages/**",
      "generated/**",
      "dataconnect/generated/**",
      "functions/lib/**",
    ],
  },
];

export default eslintConfig;
