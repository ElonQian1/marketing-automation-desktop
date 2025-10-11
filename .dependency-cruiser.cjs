// .dependency-cruiser.cjs
// module: root | layer: config | role: depcruise
// summary: 禁止 domain 依赖 UI/IO，禁止跨模块内部依赖

module.exports = {
  forbidden: [
    {
      name: "no-ui-from-domain",
      severity: "error",
      from: { path: "^src/modules/[^/]+/domain" },
      to: { path: "^src/modules/[^/]+/(ui|services|api|hooks|pages)" },
    },
    {
      name: "no-ui-from-application",
      severity: "error",
      from: { path: "^src/modules/[^/]+/application" },
      to: { path: "^src/modules/[^/]+/ui" },
    },
    {
      name: "no-cross-internals",
      severity: "error",
      from: { path: "^src/modules/([^/]+)/" },
      to: { path: "^src/modules/((?!\\1)[^/]+)/((?!index\\.ts$).+)$" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsConfig: { fileName: "tsconfig.json" },
  },
};
