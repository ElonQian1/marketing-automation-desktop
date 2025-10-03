# Visual View 架构分析与优化方案

## 📊 当前架构评估

### 1. 目录结构现状

```
src/components/universal-ui/views/visual-view/
├── components/                    # ✅ 组件层（模块化良好）
│   ├── LeftControlPanel.tsx      # 左侧控制面板
│   ├── ElementList.tsx            # 右侧元素列表
│   └── PagePreview.tsx            # 中间预览区域（⚠️ 406行，接近阈值）
├── utils/                         # ✅ 工具函数层（职责清晰）
│   ├── screenGeometry.ts          # 屏幕几何计算
│   ├── appAnalysis.ts             # 应用信息分析
│   ├── elementTransform.ts        # 元素转换
│   └── categorization.ts          # 元素分类
├── hooks/                         # ✅ 自定义 Hooks
│   ├── useParsedVisualElements.ts
│   └── useFilteredVisualElements.ts
├── types/                         # ✅ 类型定义
│   └── visual-types.ts
├── constants/                     # ✅ 常量定义
│   └── categories.ts
├── VisualElementView.tsx          # ⚠️ 主编排组件（445行，接近阈值）
└── index.ts                       # 导出聚合
```

### 2. 架构质量评分

| 维度 | 评分 | 说明 |
|-----|------|------|
| **模块化程度** | ⭐⭐⭐⭐☆ (4/5) | 已按职责分层，但部分文件较大 |
| **可维护性** | ⭐⭐⭐⭐☆ (4/5) | 结构清晰，但坐标转换逻辑复杂 |
| **可扩展性** | ⭐⭐⭐☆☆ (3/5) | 新增校准功能需要改动多处 |
| **代码复用** | ⭐⭐⭐⭐☆ (4/5) | 工具函数抽离良好 |
| **类型安全** | ⭐⭐⭐⭐⭐ (5/5) | 完整的 TypeScript 类型定义 |

**总体评价**：✅ **架构良好**，适合增强和扩展，但需要进一步模块化以降低复杂度。

---

## 🔍 当前存在的问题

### 问题 1：PagePreview.tsx 职责过重（406行）

**当前职责**：
1. 坐标系统解析与转换（6 stage pipeline）
2. 截图加载与状态管理
3. 叠加层渲染逻辑
4. 辅助网格/十字线绘制
5. 鼠标交互处理
6. 诊断日志输出

**影响**：
- 维护难度高
- 测试复杂
- 新增校准逻辑时修改面广

### 问题 2：坐标转换逻辑分散

**当前状态**：
- `screenGeometry.ts`：基础几何计算（✅ 已抽离）
- `PagePreview.tsx`：6 阶段坐标转换实现（⚠️ 耦合在组件中）

**缺失**：
- 缺少统一的坐标校准管理器
- 缺少设备/应用维度的校准持久化
- 缺少自动校准算法封装

### 问题 3：配置持久化分散在各处

**当前状态**：
- `VisualElementView.tsx`：10+ 个 useEffect 分别持久化各个参数
- 使用 `localStorage` 直接操作

**问题**：
- 代码冗长重复
- 缺少统一的配置管理
- 难以按设备/应用维度存储

### 问题 4：缺少自动校准封装

**需求**：
- 方案 A：自动检测 + 建议 overlayScale
- 方案 B：统一坐标系（使用截图尺寸）
- 方案 C：按设备/应用持久化校准参数

**当前状态**：
- 仅有基础诊断日志
- 无自动校准逻辑
- 无校准参数管理

---

## 🎯 优化方案设计

### 方案总览

```
优化层次：
1. 基础层：坐标转换模块化（立即实施）
2. 功能层：自动校准系统（核心功能）
3. 持久化层：设备/应用维度配置（增强功能）
4. UI 层：校准工具面板（可选功能）
```

---

## 📦 方案 1：坐标转换模块化重构

### 目标
将 PagePreview 中的 6 阶段坐标转换逻辑抽离为独立模块。

### 新增文件结构

```
utils/
├── screenGeometry.ts              # 已存在
├── coordinateTransform.ts         # 🆕 坐标转换核心
├── coordinateCalibration.ts       # 🆕 校准算法
└── calibrationStorage.ts          # 🆕 校准参数持久化
```

### 实现细节

#### coordinateTransform.ts

```typescript
/**
 * 坐标转换管道：XML → 截图 → 容器 → 叠加层
 */

export interface CoordinateTransformParams {
  // XML 视口尺寸
  xmlViewportW: number;
  xmlViewportH: number;
  
  // 截图实际尺寸
  screenshotW: number;
  screenshotH: number;
  
  // 容器尺寸
  containerW: number;
  containerH: number;
  
  // 校准参数
  calibration?: CoordinateCalibration;
  
  // 用户调整参数
  overlayScale?: number;
  offsetX?: number;
  offsetY?: number;
  verticalAlign?: 'top' | 'center' | 'bottom';
}

export interface CoordinateCalibration {
  // XML 视口在截图中的偏移
  xmlOffsetX: number;  // 通常 0
  xmlOffsetY: number;  // 状态栏高度等
  
  // XML 到截图的缩放比例
  xmlToScreenScaleX: number;  // 通常 1.0
  xmlToScreenScaleY: number;  // 例如 1.087 (1612/1484)
  
  // 自动检测置信度
  confidence: number;  // 0-1
}

export interface TransformResult {
  // Contain rect (截图在容器中的位置)
  containRect: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  
  // 转换函数
  xmlToOverlay: (xmlX: number, xmlY: number) => { x: number; y: number };
  
  // 诊断信息
  diagnostics: {
    xmlViewport: { w: number; h: number };
    screenshot: { w: number; h: number };
    scaleRatio: { x: number; y: number };
    calibrationApplied: boolean;
  };
}

/**
 * 创建完整的坐标转换管道
 */
export function createCoordinateTransform(
  params: CoordinateTransformParams
): TransformResult {
  const {
    xmlViewportW,
    xmlViewportH,
    screenshotW,
    screenshotH,
    containerW,
    containerH,
    calibration,
    overlayScale = 1.0,
    offsetX = 0,
    offsetY = 0,
    verticalAlign = 'center'
  } = params;
  
  // 1. 计算 contain rect (截图在容器中的位置)
  const containRect = computeContainRect(
    containerW,
    containerH,
    screenshotW,
    screenshotH,
    verticalAlign
  );
  
  // 2. 创建 XML → 叠加层坐标转换函数
  const xmlToOverlay = (xmlX: number, xmlY: number) => {
    // Stage 1: XML 坐标归一化 (0-1)
    let normX = xmlX / xmlViewportW;
    let normY = xmlY / xmlViewportH;
    
    // Stage 2: 应用校准（如果有）
    if (calibration) {
      // 方案 B：使用校准系数调整归一化坐标
      normX = (xmlX * calibration.xmlToScreenScaleX + calibration.xmlOffsetX) / screenshotW;
      normY = (xmlY * calibration.xmlToScreenScaleY + calibration.xmlOffsetY) / screenshotH;
    }
    
    // Stage 3: 映射到 contain rect
    let x = containRect.left + normX * containRect.width;
    let y = containRect.top + normY * containRect.height;
    
    // Stage 4: 应用 overlayScale（围绕 rect 中心缩放）
    const centerX = containRect.left + containRect.width / 2;
    const centerY = containRect.top + containRect.height / 2;
    x = centerX + (x - centerX) * overlayScale;
    y = centerY + (y - centerY) * overlayScale;
    
    // Stage 5: 应用偏移微调
    x += offsetX;
    y += offsetY;
    
    return { x, y };
  };
  
  // 诊断信息
  const diagnostics = {
    xmlViewport: { w: xmlViewportW, h: xmlViewportH },
    screenshot: { w: screenshotW, h: screenshotH },
    scaleRatio: {
      x: screenshotW / xmlViewportW,
      y: screenshotH / xmlViewportH
    },
    calibrationApplied: !!calibration
  };
  
  return { containRect, xmlToOverlay, diagnostics };
}
```

#### coordinateCalibration.ts

```typescript
/**
 * 自动校准算法：检测并计算校准参数
 */

import type { CoordinateCalibration } from './coordinateTransform';

export interface CalibrationDetectionResult {
  calibration: CoordinateCalibration | null;
  needsCalibration: boolean;
  suggestedOverlayScale: number;
  confidence: number;
  reason: string;
}

/**
 * 方案 A：自动检测并建议 overlayScale
 */
export function detectCalibrationNeeds(
  xmlViewportW: number,
  xmlViewportH: number,
  screenshotW: number,
  screenshotH: number
): CalibrationDetectionResult {
  const scaleX = xmlViewportW / screenshotW;
  const scaleY = xmlViewportH / screenshotH;
  const avgScale = (scaleX + scaleY) / 2;
  const scaleDiff = Math.abs(avgScale - 1.0);
  
  // 如果差异 < 5%，认为不需要校准
  if (scaleDiff < 0.05) {
    return {
      calibration: null,
      needsCalibration: false,
      suggestedOverlayScale: 1.0,
      confidence: 1.0,
      reason: '✅ XML 视口与截图尺寸匹配'
    };
  }
  
  // 需要校准：XML 视口小于截图
  if (scaleY < 1.0) {
    return {
      calibration: createCalibration(xmlViewportW, xmlViewportH, screenshotW, screenshotH),
      needsCalibration: true,
      suggestedOverlayScale: parseFloat(scaleY.toFixed(3)),
      confidence: 0.9,
      reason: `⚠️ XML 视口 (${xmlViewportH}px) 小于截图 (${screenshotH}px)，建议 overlayScale=${scaleY.toFixed(3)}`
    };
  }
  
  // XML 视口大于截图（罕见）
  return {
    calibration: createCalibration(xmlViewportW, xmlViewportH, screenshotW, screenshotH),
    needsCalibration: true,
    suggestedOverlayScale: parseFloat(scaleY.toFixed(3)),
    confidence: 0.7,
    reason: `⚠️ XML 视口 (${xmlViewportH}px) 大于截图 (${screenshotH}px)`
  };
}

/**
 * 方案 B：创建坐标校准对象（使用截图尺寸作为基准）
 */
function createCalibration(
  xmlW: number,
  xmlH: number,
  screenW: number,
  screenH: number
): CoordinateCalibration {
  return {
    xmlOffsetX: 0,  // 通常水平对齐
    xmlOffsetY: (screenH - xmlH * (screenH / xmlH)) / 2,  // 垂直偏移
    xmlToScreenScaleX: screenW / xmlW,   // 通常 1.0
    xmlToScreenScaleY: screenH / xmlH,   // 例如 1.087
    confidence: 0.9
  };
}

/**
 * 检测状态栏高度（用于精确 Y 偏移）
 */
export function detectStatusBarHeight(xmlContent: string): number {
  // 查找状态栏相关元素
  const statusBarMatch = xmlContent.match(/id=".*status_bar.*"[^>]*bounds="\[0,0\]\[(\d+),(\d+)\]"/);
  if (statusBarMatch) {
    return parseInt(statusBarMatch[2], 10);
  }
  
  // 常见默认值
  return 0;
}
```

#### calibrationStorage.ts

```typescript
/**
 * 方案 C：按设备/应用维度持久化校准参数
 */

export interface CalibrationProfile {
  deviceId: string;
  packageName: string;
  overlayScale: number;
  offsetX: number;
  offsetY: number;
  verticalAlign: 'top' | 'center' | 'bottom';
  timestamp: number;
  confidence: number;
}

const STORAGE_KEY_PREFIX = 'visualView.calibration';

/**
 * 生成存储键
 */
function getStorageKey(deviceId: string, packageName: string): string {
  return `${STORAGE_KEY_PREFIX}.${deviceId}.${packageName}`;
}

/**
 * 保存校准配置（按设备+应用）
 */
export function saveCalibrationProfile(
  deviceId: string,
  packageName: string,
  profile: Omit<CalibrationProfile, 'deviceId' | 'packageName' | 'timestamp'>
): void {
  const fullProfile: CalibrationProfile = {
    deviceId,
    packageName,
    ...profile,
    timestamp: Date.now()
  };
  
  try {
    const key = getStorageKey(deviceId, packageName);
    localStorage.setItem(key, JSON.stringify(fullProfile));
    console.log(`✅ 已保存校准配置: ${deviceId} / ${packageName}`);
  } catch (error) {
    console.error('保存校准配置失败:', error);
  }
}

/**
 * 加载校准配置（按设备+应用）
 */
export function loadCalibrationProfile(
  deviceId: string,
  packageName: string
): CalibrationProfile | null {
  try {
    const key = getStorageKey(deviceId, packageName);
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    
    const profile = JSON.parse(stored) as CalibrationProfile;
    console.log(`✅ 已加载校准配置: ${deviceId} / ${packageName}`, profile);
    return profile;
  } catch (error) {
    console.error('加载校准配置失败:', error);
    return null;
  }
}

/**
 * 列出所有已保存的校准配置
 */
export function listCalibrationProfiles(): CalibrationProfile[] {
  const profiles: CalibrationProfile[] = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
        const stored = localStorage.getItem(key);
        if (stored) {
          profiles.push(JSON.parse(stored));
        }
      }
    }
  } catch (error) {
    console.error('列出校准配置失败:', error);
  }
  
  return profiles.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * 删除指定配置
 */
export function deleteCalibrationProfile(deviceId: string, packageName: string): void {
  try {
    const key = getStorageKey(deviceId, packageName);
    localStorage.removeItem(key);
    console.log(`✅ 已删除校准配置: ${deviceId} / ${packageName}`);
  } catch (error) {
    console.error('删除校准配置失败:', error);
  }
}

/**
 * 清除所有校准配置
 */
export function clearAllCalibrationProfiles(): void {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
      keys.push(key);
    }
  }
  
  keys.forEach(key => localStorage.removeItem(key));
  console.log(`✅ 已清除所有校准配置 (${keys.length} 个)`);
}
```

---

## 🎨 方案 2：PagePreview 模块化拆分

### 拆分策略

```
components/
├── PagePreview.tsx                 # 主编排组件（保留 150 行内）
└── page-preview/                   # 🆕 子模块
    ├── ScreenshotLayer.tsx         # 截图层
    ├── OverlayLayer.tsx             # 叠加层容器
    ├── OverlayItem.tsx              # 单个叠加元素
    ├── AidLayers.tsx                # 辅助层（网格/十字线）
    ├── useScreenshotLoader.ts       # 截图加载 Hook
    ├── useCoordinateTransform.ts    # 坐标转换 Hook
    └── index.ts                     # 导出聚合
```

### 重构后的 PagePreview.tsx

```typescript
/**
 * PagePreview 主编排组件（重构后 ~150 行）
 */
import React from 'react';
import { ScreenshotLayer } from './page-preview/ScreenshotLayer';
import { OverlayLayer } from './page-preview/OverlayLayer';
import { AidLayers } from './page-preview/AidLayers';
import { useScreenshotLoader } from './page-preview/useScreenshotLoader';
import { useCoordinateTransform } from './page-preview/useCoordinateTransform';

export const PagePreview: React.FC<PagePreviewProps> = ({
  xmlContent,
  finalElements,
  screenshotUrl,
  overlayScale,
  offsetX,
  offsetY,
  verticalAlign,
  autoCalibration,
  onOverlayScaleChange,
  ...otherProps
}) => {
  // 1. 截图加载状态管理
  const { imgNatural, imgLoaded, imgError, handleImageLoad, handleImageError } = 
    useScreenshotLoader(screenshotUrl);
  
  // 2. 坐标转换系统
  const { transform, calibration, diagnostics } = useCoordinateTransform({
    xmlContent,
    imgNatural,
    overlayScale,
    offsetX,
    offsetY,
    verticalAlign,
    autoCalibration,
    onOverlayScaleChange,
    containerWidth,
    containerHeight
  });
  
  if (!transform) {
    return <LoadingPlaceholder />;
  }
  
  return (
    <div className="page-preview-container">
      {/* 截图层 */}
      <ScreenshotLayer
        screenshotUrl={screenshotUrl}
        containRect={transform.containRect}
        imgLoaded={imgLoaded}
        imgError={imgError}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
      
      {/* 叠加层 */}
      <OverlayLayer
        elements={finalElements}
        transform={transform.xmlToOverlay}
        overlayOpacity={overlayOpacity}
      />
      
      {/* 辅助层（网格/十字线） */}
      <AidLayers
        showGrid={showGrid}
        showCrosshair={showCrosshair}
        containRect={transform.containRect}
      />
      
      {/* 诊断信息显示 */}
      {diagnostics && <DiagnosticsPanel diagnostics={diagnostics} />}
    </div>
  );
};
```

---

## 🔧 方案 3：统一配置管理 Hook

### useVisualViewPreferences.ts

```typescript
/**
 * 统一的可视化视图偏好管理
 */

export interface VisualViewPreferences {
  // 显示选项
  showScreenshot: boolean;
  showGrid: boolean;
  showCrosshair: boolean;
  
  // 视觉参数
  overlayOpacity: number;
  screenshotDim: number;
  rotate90: boolean;
  
  // 缩放与对齐
  previewZoom: number;
  overlayScale: number;
  offsetX: number;
  offsetY: number;
  verticalAlign: 'top' | 'center' | 'bottom';
  
  // 自动校准
  autoCalibration: boolean;
}

export function useVisualViewPreferences(
  deviceId?: string,
  packageName?: string
) {
  const [preferences, setPreferences] = useState<VisualViewPreferences>(() => {
    // 优先加载设备/应用特定配置
    if (deviceId && packageName) {
      const profile = loadCalibrationProfile(deviceId, packageName);
      if (profile) {
        return {
          ...DEFAULT_PREFERENCES,
          overlayScale: profile.overlayScale,
          offsetX: profile.offsetX,
          offsetY: profile.offsetY,
          verticalAlign: profile.verticalAlign
        };
      }
    }
    
    // 否则加载全局配置
    return loadGlobalPreferences();
  });
  
  // 统一的持久化逻辑
  useEffect(() => {
    if (deviceId && packageName) {
      // 保存到设备/应用特定存储
      saveCalibrationProfile(deviceId, packageName, {
        overlayScale: preferences.overlayScale,
        offsetX: preferences.offsetX,
        offsetY: preferences.offsetY,
        verticalAlign: preferences.verticalAlign,
        confidence: 1.0
      });
    } else {
      // 保存到全局存储
      saveGlobalPreferences(preferences);
    }
  }, [preferences, deviceId, packageName]);
  
  return [preferences, setPreferences] as const;
}
```

---

## 📋 实施计划

### 阶段 1：基础模块化（2-3 小时）

**优先级**：🔥 高

**任务清单**：
- [ ] 创建 `coordinateTransform.ts`
- [ ] 创建 `coordinateCalibration.ts`  
- [ ] 创建 `calibrationStorage.ts`
- [ ] 在 PagePreview 中集成新模块
- [ ] 编写单元测试

**预期效果**：
- PagePreview 行数减少 100+
- 坐标转换逻辑可独立测试
- 为自动校准奠定基础

---

### 阶段 2：自动校准功能（3-4 小时）

**优先级**：🔥 高

**任务清单**：
- [ ] 实现自动检测算法（方案 A）
- [ ] 添加统一坐标系选项（方案 B）
- [ ] 添加设备/应用维度持久化（方案 C）
- [ ] 在 LeftControlPanel 添加 UI 控件
- [ ] 添加校准建议提示

**预期效果**：
- 用户无需手动调整 overlayScale
- 每台设备/每个应用记住校准值
- 切换设备时自动加载配置

---

### 阶段 3：PagePreview 深度拆分（4-6 小时）

**优先级**：⚠️ 中

**任务清单**：
- [ ] 创建 `page-preview/` 子目录
- [ ] 拆分 ScreenshotLayer 组件
- [ ] 拆分 OverlayLayer 组件
- [ ] 创建 useScreenshotLoader Hook
- [ ] 创建 useCoordinateTransform Hook
- [ ] 重构主 PagePreview 组件

**预期效果**：
- PagePreview 主文件 < 200 行
- 每个子组件职责单一
- 便于单独测试和优化

---

### 阶段 4：配置管理统一（2-3 小时）

**优先级**：⚠️ 中

**任务清单**：
- [ ] 创建 `useVisualViewPreferences` Hook
- [ ] 重构 VisualElementView 中的配置管理
- [ ] 添加配置导入/导出功能
- [ ] 添加配置重置功能

**预期效果**：
- 减少 VisualElementView 中的 useEffect
- 统一的配置持久化逻辑
- 更好的用户体验

---

### 阶段 5：校准工具面板（可选，4-8 小时）

**优先级**：💡 低

**任务清单**：
- [ ] 创建 CalibrationPanel 组件
- [ ] 实现可视化校准工具
- [ ] 添加校准历史记录
- [ ] 添加校准配置管理

**预期效果**：
- 用户可手动微调校准
- 查看和管理历史配置
- 导出/分享校准配置

---

## 🎯 优化后的架构

### 最终目录结构

```
src/components/universal-ui/views/visual-view/
├── components/
│   ├── LeftControlPanel.tsx          # ~200 行
│   ├── ElementList.tsx                # ~150 行
│   ├── PagePreview.tsx                # ~150 行 ⬇️ 减少 250 行
│   └── page-preview/                  # 🆕 子模块
│       ├── ScreenshotLayer.tsx        # ~80 行
│       ├── OverlayLayer.tsx           # ~100 行
│       ├── OverlayItem.tsx            # ~60 行
│       ├── AidLayers.tsx              # ~80 行
│       ├── useScreenshotLoader.ts     # ~40 行
│       ├── useCoordinateTransform.ts  # ~100 行
│       └── index.ts
├── utils/
│   ├── screenGeometry.ts              # 已存在
│   ├── coordinateTransform.ts         # 🆕 ~200 行
│   ├── coordinateCalibration.ts       # 🆕 ~150 行
│   └── calibrationStorage.ts          # 🆕 ~100 行
├── hooks/
│   ├── useParsedVisualElements.ts     # 已存在
│   ├── useFilteredVisualElements.ts   # 已存在
│   └── useVisualViewPreferences.ts    # 🆕 ~120 行
├── VisualElementView.tsx              # ~300 行 ⬇️ 减少 145 行
└── [其他文件保持不变]
```

### 代码行数对比

| 文件 | 重构前 | 重构后 | 变化 |
|-----|-------|-------|------|
| PagePreview.tsx | 406 | 150 | ⬇️ -256 行 |
| VisualElementView.tsx | 445 | 300 | ⬇️ -145 行 |
| 新增工具模块 | 0 | 450 | ⬆️ +450 行 |
| 新增子组件 | 0 | 320 | ⬆️ +320 行 |
| **总计** | 851 | 1220 | ⬆️ +369 行 |

**说明**：虽然总行数增加，但：
- ✅ 单文件复杂度大幅降低
- ✅ 职责边界更清晰
- ✅ 可测试性提升
- ✅ 可维护性提升

---

## ✅ 架构优化优势

### 1. 可维护性提升

**重构前**：
- 修改坐标逻辑需要在 400+ 行文件中定位
- 测试需要模拟整个组件

**重构后**：
- 坐标逻辑独立在 `coordinateTransform.ts`
- 可以单独测试转换算法

### 2. 可扩展性提升

**新增功能成本**：
- 添加新的校准算法：仅修改 `coordinateCalibration.ts`
- 添加新的持久化方式：仅修改 `calibrationStorage.ts`
- 添加新的叠加元素：仅添加 `page-preview/` 子组件

### 3. 可复用性提升

**可复用模块**：
- `coordinateTransform.ts`：可用于其他需要坐标映射的场景
- `calibrationStorage.ts`：可用于其他需要设备维度配置的功能
- `useVisualViewPreferences`：可扩展为通用配置管理 Hook

### 4. 类型安全保持

**TypeScript 覆盖率**：
- 所有新增模块 100% 类型定义
- 导出接口明确清晰
- 编译时错误检测

---

## 🚀 开始实施

### 推荐顺序

1. **立即开始**：阶段 1（基础模块化）
   - 影响最小
   - 收益最大
   - 为后续奠定基础

2. **紧接着**：阶段 2（自动校准功能）
   - 核心用户需求
   - 基于阶段 1 的成果
   - 直接解决对齐问题

3. **稳定后**：阶段 3-4（深度拆分 + 配置统一）
   - 长期可维护性
   - 不影响功能
   - 可逐步迁移

4. **可选**：阶段 5（校准工具面板）
   - 高级用户需求
   - 锦上添花

---

## 📚 相关文档

- [XML 与截图对齐分析](./XML_SCREENSHOT_ALIGNMENT_ANALYSIS.md)
- [坐标转换诊断报告](./COORDINATE_TRANSFORM_DIAGNOSIS.md)
- [DDD 架构规范](./.github/copilot-instructions.md)

---

**文档创建时间**：2025-10-03  
**架构评估版本**：v1.0  
**预计重构周期**：2-3 天（核心功能）
