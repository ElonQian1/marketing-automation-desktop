// eslint.config.cjs
// module: root | layer: config | role: eslint
// summary: ESLint 9.x flat config - 边界/层级规则 + 只允许从模块 index 导入的限制

const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const boundariesPlugin = require('eslint-plugin-boundaries');
const importPlugin = require('eslint-plugin-import');

module.exports = [
  {
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      'boundaries': boundariesPlugin,
      'import': importPlugin,
    },
    files: ['src/**/*.{ts,tsx}'],
    settings: {
      "boundaries/elements": [
        { type: "pages", pattern: "src/pages/**" },
        { type: "modules", pattern: "src/modules/*" },
        { type: "ui", pattern: "src/modules/*/ui/**" },
        { type: "hooks", pattern: "src/modules/*/hooks/**" },
        
        // DDD架构层级
        { type: "application-usecases", pattern: "src/modules/*/application/usecases/**" },
        { type: "application-types", pattern: "src/modules/*/application/types/**" },
        { type: "application-services", pattern: "src/modules/*/application/services/**" },
        { type: "domain-entities", pattern: "src/modules/*/domain/entities/**" },
        { type: "domain-repositories", pattern: "src/modules/*/domain/repositories/**" },
        { type: "domain-services", pattern: "src/modules/*/domain/services/**" },
        { type: "infrastructure", pattern: "src/modules/*/infrastructure/**" },
        
        // 传统层级（向后兼容）
        { type: "application", pattern: "src/modules/*/application/**" },
        { type: "domain", pattern: "src/modules/*/domain/**" },
        { type: "services", pattern: "src/modules/*/services/**" },
        { type: "api", pattern: "src/modules/*/api/**" },
        { type: "stores", pattern: "src/modules/*/stores/**" },
        
        // 其他文件
        { type: "adapters", pattern: "src/modules/*/adapters/**" },
        { type: "types", pattern: "src/modules/*/types/**" },
      ],
    },
    rules: {
      // TypeScript ESLint recommended rules
      ...typescriptEslint.configs.recommended.rules,
      
      // Boundaries rules - DDD架构层级控制
      "boundaries/element-types": [
        2,
        {
          default: "disallow",
          rules: [
            // 页面层：可以访问UI、Hooks、应用层
            { from: "pages", allow: ["ui", "hooks", "application-usecases", "application-types"] },
            
            // UI层：可以访问Hooks、应用层、领域实体类型
            { from: "ui", allow: ["hooks", "application-usecases", "application-types", "domain-entities"] },
            
            // Hooks层：可以访问应用层和领域层
            { from: "hooks", allow: ["application-usecases", "application-types", "domain-entities"] },
            
            // 应用层用例：可以访问应用服务、领域层、基础设施层
            { from: "application-usecases", allow: ["application-services", "application-types", "domain-entities", "domain-repositories", "domain-services", "infrastructure"] },
            
            // 应用层服务：可以访问领域层、基础设施层
            { from: "application-services", allow: ["application-types", "domain-entities", "domain-repositories", "domain-services", "infrastructure"] },
            
            // 应用层类型：可以访问领域实体类型
            { from: "application-types", allow: ["domain-entities"] },
            
            // 领域实体：纯业务逻辑，不依赖其他层
            { from: "domain-entities", allow: [] },
            
            // 领域仓储：可以访问领域实体
            { from: "domain-repositories", allow: ["domain-entities"] },
            
            // 领域服务：可以访问领域实体和仓储接口
            { from: "domain-services", allow: ["domain-entities", "domain-repositories"] },
            
            // 基础设施层：可以访问领域层接口
            { from: "infrastructure", allow: ["domain-entities", "domain-repositories"] },
            
            // 适配器：可以访问应用层和领域层
            { from: "adapters", allow: ["application-types", "domain-entities", "infrastructure"] },
            
            // 传统层级（向后兼容）
            { from: "application", allow: ["domain", "services", "api", "stores", "types"] },
            { from: "services", allow: ["api", "domain", "types"] },
            { from: "api", allow: ["types"] },
            { from: "domain", allow: ["types"] },
            { from: "stores", allow: ["domain", "application", "types"] },
            { from: "types", allow: [] },
          ],
        },
      ],
      "boundaries/no-unknown": 2,
      
      // Import restrictions - 强制模块边界
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["src/modules/*/*", "@*/!(index|public)*"],
              message: "请从模块根 index.ts 导入（公共API），不要直捣内部实现。",
            },
            {
              group: ["src/modules/*/types/*"],
              message: "旧的 types/* 导入已废弃，请使用新的 DDD 架构：domain/entities 或 application/types",
            },
            {
              group: ["src/modules/*/domain/entities/*", "src/modules/*/application/types/*"],
              message: "请通过模块的 index.ts 导入类型，或使用对应的 /index.ts 桶文件",
            },
          ],
        },
      ],
      
      // 附加的 DDD 架构强制规则
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/infrastructure/**"],
              importNames: ["*"],
              message: "基础设施层不应被应用层以外的代码直接导入",
              allowTypeImports: false,
            },
          ],
        },
      ],
    },
  },
];