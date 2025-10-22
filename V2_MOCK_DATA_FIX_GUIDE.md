# 🔧 "模拟数据" 问题修复指南

## 🚨 问题分析

你看到 **"V1执行完成（模拟）"** 而不是真实的后端数据，原因是：

1. **StepExecutionGateway 引擎选择错误** - 仍然选择了V1引擎
2. **V1路径返回模拟数据** - V1实现中使用了模拟响应
3. **配置未同步** - Gateway配置与统一配置不一致

## ✅ 已修复内容

### 1. 统一引擎配置
```typescript
// StepExecutionGateway现在默认使用V2
const DEFAULT_CONFIG: EngineConfig = {
  defaultEngine: 'v2', // ✅ 从'v1'改为'v2'
  featureFlags: {
    enableV2: true,
    enableShadow: false, // ✅ 关闭影子执行
    shadowSampleRate: 0.0,
  },
};
```

### 2. 配置同步机制
```typescript
// Gateway构造函数现在集成统一配置
constructor(config?: Partial<EngineConfig>) {
  const unifiedEngine = getCurrentExecutionEngine(); // 使用统一配置
  this.config = {
    ...DEFAULT_CONFIG,
    defaultEngine: unifiedEngine, // V2引擎
    ...config
  };
}
```

## 🎯 验证修复效果

### 方法1: 重启开发服务器
```bash
# 停止当前服务器 (Ctrl+C)
npm run tauri dev
```

新的配置需要重启才能生效。

### 方法2: 检查引擎选择日志
运行测试后查看控制台，应该看到：
```
[StepExecGateway] Using engine: v2, mode: execute-step
[StepExecGateway] V2 execution - 使用真实V2后端
```

而不是：
```
[StepExecGateway] Using engine: v1, mode: execute-step  
[StepExecGateway] V1 execution - 暂时返回模拟结果
```

### 方法3: 使用诊断工具
在浏览器控制台运行：
```javascript
import { testV2BackendConnection } from './src/utils/testV2Backend';
await testV2BackendConnection('e0d909c3');
```

## 🔍 如果仍然显示模拟数据

### 情况1: 引擎仍选择V1
**检查方法：** 看控制台日志中的`Using engine: v1`

**解决方案：**
1. 确认重启了开发服务器
2. 检查环境变量是否覆盖了配置
3. 清除浏览器缓存

### 情况2: V2适配器问题
**检查方法：** 看到`V2 execution`但仍有错误

**解决方案：**
```javascript
// 直接测试V2适配器
import { invoke } from '@tauri-apps/api/core';

const testV2Direct = async () => {
  try {
    const result = await invoke('run_step_v2', {
      request: {
        device_id: 'e0d909c3',
        mode: 'match-only',
        action_params: {
          type: 'click',
          xpath: '//*[@content-desc="我"]'
        }
      }
    });
    console.log('V2后端直接调用结果:', result);
  } catch (error) {
    console.error('V2后端直接调用失败:', error);
  }
};

await testV2Direct();
```

### 情况3: 设备连接问题
**检查方法：** V2调用失败，显示设备错误

**解决方案：**
```bash
# 检查设备连接
adb devices

# 应该看到你的设备
e0d909c3    device
```

## 🚀 预期的真实V2结果

修复后，你应该看到类似这样的真实执行结果：

```javascript
// 成功的V2真实执行
{
  success: true,
  message: "元素匹配成功", // 不再是"模拟"
  engine: "v2",
  matched: {
    id: "real_element_id",
    score: 0.95,
    confidence: 0.89,
    bounds: { left: 864, top: 2240, right: 1080, bottom: 2358 },
    text: "我"
  },
  executedAction: "click",
  logs: [
    "V2引擎执行开始",
    "元素匹配成功",
    "点击动作完成"
  ]
}
```

**关键标志：**
- ✅ `engine: "v2"`
- ✅ `message` 不包含"模拟"字样
- ✅ 真实的匹配置信度和边界
- ✅ 详细的执行日志

## 🔄 立即行动步骤

1. **重启开发服务器** （必须！）
   ```bash
   # Ctrl+C 停止当前服务器
   npm run tauri dev
   ```

2. **运行一次测试** 查看引擎选择日志

3. **检查结果消息** 确认不再显示"模拟"

4. **如有问题** 使用诊断工具进一步分析

**重启后你的测试应该显示真实的V2后端数据！** 🎉