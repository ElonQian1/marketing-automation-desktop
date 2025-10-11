# ADB UI 组件层

## 职责
- ADB模块专用UI组件
- 设备管理界面组件
- 连接状态显示组件
- 命令执行界面组件

## 架构原则
- 组件单一职责原则
- 可复用和可组合
- 遵循设计系统规范
- 业务逻辑与UI分离

## 文件组织
```
ui/
├── index.ts              # UI组件统一导出
├── DeviceList.tsx        # 设备列表组件
├── ConnectionStatus.tsx  # 连接状态组件
├── CommandConsole.tsx    # 命令控制台组件
└── DiagnosticPanel.tsx   # 诊断面板组件
```