# PagePreview 坐标变换重构方案

## 当前问题总结

1. **overlayScale 需要 0.92**：XML 视口尺寸 vs 截图实际尺寸不一致
2. **offsetY 需要 -43**：contain 映射时的垂直留白 + 系统栏/安全区偏移
3. **结构复杂**：6 层变换混在渲染逻辑里，缺乏中间状态可见性

## 根本原因

### 原因1：XML 视口解析不准确

```typescript
// screenGeometry.ts 当前逻辑
export function parseXmlViewport(xmlContent: string): ViewportSize | null {
  // 优先 hierarchy bounds
  // 退化：扫描所有 bounds，选 [0,0] 起点最大面积
  // 再退化：选全局最大面积
}
```

**问题**：Android XML 的 bounds 可能包含：
- 真实屏幕视口（包含状态栏、导航栏）
- 应用可见区域（不含状态栏）
- DecorView 边界（可能超出屏幕）

当前策略"选 [0,0] 起点最大面积"会倾向选择"包含系统栏的完整视口"，但：
- 截图可能不包含状态栏（某些 ROM 的 screencap）
- 或截图包含，但 XML 坐标从状态栏下方开始计数

导致 baseW/baseH 与实际截图尺寸不一致。

### 原因2：contain 映射时的坐标基准混乱

```typescript
// 当前逻辑
const rect = computeContainRect(scaledWidth, scaledHeight, imgNatural.w, imgNatural.h, verticalAlign);
const baseLeft = rect.left + (element.position.x / baseW) * rect.width;
```

**问题**：
- `scaledWidth/scaledHeight` 是 XML 视口缩放后的"容器大小"
- `imgNatural.w/h` 是截图的"实际像素"
- 两者本应 1:1 对应（都代表屏幕），但如果 baseW/baseH 解析错误，就会出现比例差

## 修复策略

### 策略A：自动校准（推荐）

在图片加载后，自动检测并建议校准参数：

```typescript
React.useEffect(() => {
  if (!imgNatural || !vp) return;
  
  // 计算 XML 视口 vs 截图的比例差异
  const scaleX = imgNatural.w / baseW;
  const scaleY = imgNatural.h / baseH;
  const avgScale = (scaleX + scaleY) / 2;
  
  // 如果差异 > 5%，建议自动校准
  if (Math.abs(avgScale - 1.0) > 0.05) {
    console.warn('检测到视口差异，建议 overlayScale:', avgScale.toFixed(3));
    // 可选：自动应用或弹出提示
  }
}, [imgNatural, baseW, baseH]);
```

### 策略B：统一坐标系（彻底解决）

**核心思路**：让 XML 坐标和截图坐标使用同一个基准。

```typescript
// 1. 优先使用截图尺寸作为基准
const baseW = imgNatural?.w || vp?.width || fallbackMaxX || 1080;
const baseH = imgNatural?.h || vp?.height || fallbackMaxY || 1920;

// 2. 如果 XML 视口 != 截图尺寸，计算校准系数
const xmlVpW = vp?.width || fallbackMaxX;
const xmlVpH = vp?.height || fallbackMaxY;
const calibScaleX = baseW / xmlVpW;
const calibScaleY = baseH / xmlVpH;

// 3. 在映射时应用校准系数
const baseLeft = rect.left + (element.position.x * calibScaleX / baseW) * rect.width;
const baseTop = rect.top + (element.position.y * calibScaleY / baseH) * rect.height;
```

这样可以消除 overlayScale 需要 0.92 的情况。

### 策略C：状态栏偏移自动检测

```typescript
// 检测第一个元素的 Y 坐标是否有固定偏移
const firstVisibleElement = filteredElements.find(e => e.position.y > 0);
if (firstVisibleElement && firstVisibleElement.position.y < 100) {
  const estimatedStatusBarHeight = firstVisibleElement.position.y;
  console.log('估计状态栏高度:', estimatedStatusBarHeight);
  // 可选：自动应用到 offsetY
}
```

## 重构建议（模块化）

### 拆分 PagePreview 为子组件

```
PagePreview/
├── index.tsx                    # 主容器
├── ScreenshotLayer.tsx          # 截图渲染 + rect 计算
├── OverlayLayer.tsx             # 叠加层容器
├── OverlayItem.tsx              # 单个元素框
├── AidLayers.tsx                # 网格/准星
├── CoordinateCalibration.tsx    # 坐标校准提示
└── utils/
    ├── coordinateTransform.ts   # 坐标变换纯函数
    └── calibrationDetector.ts   # 自动校准检测
```

### coordinateTransform.ts 示例

```typescript
export interface CoordinateTransformPipeline {
  // 原始 XML 坐标
  xmlPos: { x: number; y: number; w: number; h: number };
  // XML 视口尺寸
  xmlViewport: { w: number; h: number };
  // 截图实际尺寸
  imageSize: { w: number; h: number };
  // 容器缩放
  containerScale: number;
  // contain 绘制矩形
  drawRect: { left: number; top: number; width: number; height: number };
  // 用户调整
  userAdjust: { overlayScale: number; offsetX: number; offsetY: number };
}

export function transformXmlToScreen(pipeline: CoordinateTransformPipeline) {
  const { xmlPos, xmlViewport, imageSize, containerScale, drawRect, userAdjust } = pipeline;
  
  // 步骤1：XML 坐标归一化（0-1）
  const normX = xmlPos.x / xmlViewport.w;
  const normY = xmlPos.y / xmlViewport.h;
  const normW = xmlPos.w / xmlViewport.w;
  const normH = xmlPos.h / xmlViewport.h;
  
  // 步骤2：映射到 drawRect
  const rectX = drawRect.left + normX * drawRect.width;
  const rectY = drawRect.top + normY * drawRect.height;
  const rectW = normW * drawRect.width;
  const rectH = normH * drawRect.height;
  
  // 步骤3：应用 overlayScale（围绕 drawRect 中心）
  const cx = drawRect.left + drawRect.width / 2;
  const cy = drawRect.top + drawRect.height / 2;
  const scaledX = cx + (rectX - cx) * userAdjust.overlayScale;
  const scaledY = cy + (rectY - cy) * userAdjust.overlayScale;
  const scaledW = rectW * userAdjust.overlayScale;
  const scaledH = rectH * userAdjust.overlayScale;
  
  // 步骤4：应用偏移
  return {
    left: scaledX + userAdjust.offsetX,
    top: scaledY + userAdjust.offsetY,
    width: scaledW,
    height: scaledH
  };
}
```

## 立即可做的最小改动

不破坏现有架构，只添加调试信息：

```typescript
// 在 PagePreview.tsx 顶部添加
React.useEffect(() => {
  if (imgNatural && vp) {
    const scaleX = imgNatural.w / baseW;
    const scaleY = imgNatural.h / baseH;
    console.log('🔍 坐标系诊断:');
    console.log('  XML 视口:', baseW, 'x', baseH);
    console.log('  截图尺寸:', imgNatural.w, 'x', imgNatural.h);
    console.log('  X 比例:', scaleX.toFixed(3), 'Y 比例:', scaleY.toFixed(3));
    console.log('  建议 overlayScale:', ((scaleX + scaleY) / 2).toFixed(3));
  }
}, [imgNatural, baseW, baseH]);
```

这样你就能看到为什么需要 0.92 了。
