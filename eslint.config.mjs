import globals from "globals";
import pluginJs from "@eslint/js";


export default [
  {files: ["**/*.js"], languageOptions: {
    sourceType: "module",
    globals: {
      ...globals.node,
      ...globals.browser
    }
  }},
  {languageOptions: { globals: globals.node }},
  {languageOptions: { globals: globals.jest }},
  pluginJs.configs.recommended,
];