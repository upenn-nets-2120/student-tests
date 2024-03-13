module.exports = {
	root: true,
	env: { browser: true, es2020: true },
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:react-hooks/recommended",
	],
	ignorePatterns: ["dist", ".eslintrc.cjs"],
	parser: "@typescript-eslint/parser",
	plugins: ["react-refresh", "simple-import-sort", "unused-imports"],
	rules: {
		"react-refresh/only-export-components": [
			"warn",
			{ allowConstantExport: true },
		],
		"unused-imports/no-unused-imports-ts": ["error"],
		"simple-import-sort/imports": [
			"error",
			{
				groups: [
					["dotenv"],
					[`^(${require("module").builtinModules.join("|")})(/|$)`],
					// Packages. `react` related packages come first.
					["^@?\\w"],
					// Internal packages.
					["^(@app)(/.*|$)"],
					["^(@assets)(/.*|$)"],
					// Side effect imports.
					["^\\u0000"],
					// Parent imports. Put `..` last.
					["^\\.\\.(?!/?$)", "^\\.\\./?$"],
					// Other relative imports. Put same-folder imports and `.` last.
					["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"],
				],
			},
		],
		"simple-import-sort/exports": "error",
	},
}
