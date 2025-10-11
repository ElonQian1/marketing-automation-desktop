// .eslintrc.cjs
// module: root | layer: config | role: eslint
// summary: 边界/层级规则 + 只允许从模块 index 导入的限制

module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "boundaries", "import"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  settings: {
    "boundaries/elements": [
      { type: "pages", pattern: "src/pages/**" },
      { type: "modules", pattern: "src/modules/*" },
      { type: "ui", pattern: "src/modules/*/ui/**" },
      { type: "hooks", pattern: "src/modules/*/hooks/**" },
      { type: "application", pattern: "src/modules/*/application/**" },
      { type: "domain", pattern: "src/modules/*/domain/**" },
      { type: "services", pattern: "src/modules/*/services/**" },
      { type: "api", pattern: "src/modules/*/api/**" },
      { type: "stores", pattern: "src/modules/*/stores/**" },
    ],
  },
  rules: {
    "boundaries/element-types": [
      2,
      {
        default: "disallow",
        rules: [
          { from: "pages", allow: ["ui", "hooks", "application", "stores"] },
          { from: "ui", allow: ["hooks", "application", "stores", "domain"] },
          { from: "hooks", allow: ["application", "stores", "domain"] },
          {
            from: "application",
            allow: ["domain", "services", "api", "stores"],
          },
          { from: "services", allow: ["api", "domain"] },
          { from: "api", allow: [] },
          { from: "domain", allow: [] },
          { from: "stores", allow: ["domain", "application"] },
        ],
      },
    ],
    "boundaries/no-unknown": 2,
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["src/modules/*/*", "@*/!(index|public)*"],
            message: "请从模块根 index.ts 导入（公共API），不要直捣内部实现。",
          },
        ],
      },
    ],
  },
};
