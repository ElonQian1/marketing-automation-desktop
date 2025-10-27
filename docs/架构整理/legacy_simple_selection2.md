让我查找前端是如何调用 legacy_simple_selection_engine.rs 的： 

搜索 `execute_smart_selection.*command|#\[tauri::command\]` (`**/src-tauri/src/**`)、20 结果的文本

读取 [](file:///d%3A/rust/active-projects/%E5%B0%8F%E7%BA%A2%E4%B9%A6/employeeGUI/src-tauri/src/commands/smart_selection.rs#1-1)，行 1 到 61

搜索 `execute_smart_selection` (`**/src/**`)、13 结果的文本

读取 [](file:///d%3A/rust/active-projects/%E5%B0%8F%E7%BA%A2%E4%B9%A6/employeeGUI/src/services/smartSelectionService.ts)

搜索 `SmartSelectionService` (`**/src/**`)、20 结果的文本

读取 [](file:///d%3A/rust/active-projects/%E5%B0%8F%E7%BA%A2%E4%B9%A6/employeeGUI/src/hooks/useSmartSelection.ts#1-1)，行 1 到 51

现在我来查找谁在调用这些服务： 

搜索 `useSmartSelection` (`**/src/**`)、7 结果的文本

已汇总会话历史记录

搜索 `SmartSelectionService` (`**/src/**`)、20 结果的文本

现在我知道了完整的调用链！让我总结一下前端是如何调用 legacy_simple_selection_engine.rs 的：

## 前端调用链路完整解析

**调用路径：**
```
React组件 → useSmartSelection Hook → SmartSelectionService → Tauri命令 → Rust后端
```

### 1. **前端发起者**
主要有两个组件调用：

- **CompactStrategyMenu.tsx** (策略菜单组件)
- **SmartSelectionStepCard.tsx** (智能选择步骤卡片)

### 2. **具体调用流程**

**组件层：**
```typescript
// CompactStrategyMenu.tsx 第654行
const result = await SmartSelectionService.executeSmartSelection(deviceId, protocol);
```

**服务层：**
```typescript
// smartSelectionService.ts
export class SmartSelectionService {
  static async executeSmartSelection(deviceId: string, protocol: SmartSelectionProtocol) {
    return await invoke<SmartSelectionResult>('execute_smart_selection', {
      deviceId,
      protocol
    });
  }
}
```

**Hook层：**
```typescript
// useSmartSelection.ts 第227行  
const result = await SmartSelectionService.executeSmartSelection(currentDeviceId, protocolToUse);
```

### 3. **Tauri命令**
前端发送的命令是：
- **命令名**：`'execute_smart_selection'`
- **参数**：`{ deviceId: string, protocol: SmartSelectionProtocol }`

### 4. **后端接收**
```rust
// smart_selection.rs
#[tauri::command]
pub async fn execute_smart_selection(
    device_id: String, 
    protocol: SmartSelectionProtocol
) -> Result<SmartSelectionResult, String> {
    SmartSelectionEngine::execute_smart_selection(device_id, protocol).await
}
```

### 5. **最终执行**
```rust
// legacy_simple_selection_engine.rs
impl SmartSelectionEngine {
    pub async fn execute_smart_selection(
        device_id: String,
        protocol: SmartSelectionProtocol,
    ) -> Result<SmartSelectionResult, String> {
        // 1421行的遗留引擎逻辑
    }
}
```

**总结：**
- 前端通过 `SmartSelectionService.executeSmartSelection()` 调用
- 发送 `execute_smart_selection` Tauri命令
- 后端 `legacy_simple_selection_engine.rs` 接收并执行
- 这个遗留引擎绕过了V3的Steps 0-6智能分析，直接进行简单选择匹配

这就是为什么这个文件叫"legacy"（遗留）—— 它是为了向后兼容而保留的简化版本！**总结：**
- 前端通过 `SmartSelectionService.executeSmartSelection()` 调用
- 发送 `execute_smart_selection` Tauri命令
- 后端 `legacy_simple_selection_engine.rs` 接收并执行
- 这个遗留引擎绕过了V3的Steps 0-6智能分析，直接进行简单选择匹配

这就是为什么这个文件叫"legacy"（遗留）—— 它是为了向后兼容而保留的简化版本！