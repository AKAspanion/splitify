import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    // React Compiler rules that eslint-plugin-react-hooks 7 added. The code they flag predates them, and fixing it
    // changes behaviour, so they warn rather than fail lint. See knowledge/findings/react-compiler-lint-warnings.md.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
    },
  },
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
