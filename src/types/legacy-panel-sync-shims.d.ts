// src/types/legacy-panel-sync-shims.d.ts
// module: shared | layer: types | role: 类型声明
// summary: TypeScript类型定义文件

declare const setPanelHighlightNode: (node: any) => void;
declare const setPanelActivateTab: (tab: 'results' | 'xpath') => void;
declare const setPanelActivateKey: (updater: (k: number) => number) => void;
