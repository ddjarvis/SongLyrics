import js from "@eslint/js";
import globals from "globals";
import json from "@eslint/json";
import { defineConfig } from "eslint/config";

export default defineConfig([
	{
		languageOptions: {
			globals: {
				...globals.node
			}
		}
	},
  { files: ["**/*.{js,mjs,cjs}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: globals.node } },
  { files: ["**/*.json"], plugins: { json }, language: "json/json", extends: ["json/recommended"] },
  {
  	rules: {
  		"no-unused-vars": "warn",
  		"no-console": "warn",
  		"prefer-template": "warn",
  		"no-useless-assignment": "warn"
  	}
  }
]);
