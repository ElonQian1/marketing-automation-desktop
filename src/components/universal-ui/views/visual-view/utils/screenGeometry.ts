// 轻量屏幕几何工具：解析 XML 视口尺寸与计算 contain 绘制区域

export interface ViewportSize {
  width: number;
  height: number;
}

// 从 XML 内容中解析根节点或 hierarchy 的 bounds，形如 bounds="[0,0][1080,1920]"
export function parseXmlViewport(xmlContent: string): ViewportSize | null {
  if (!xmlContent) return null;
  try {
    // 优先查找 <hierarchy ... bounds="[x1,y1][x2,y2]">
    const hierarchyMatch = xmlContent.match(/<hierarchy[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
    if (hierarchyMatch) {
      const x1 = parseInt(hierarchyMatch[1], 10);
      const y1 = parseInt(hierarchyMatch[2], 10);
      const x2 = parseInt(hierarchyMatch[3], 10);
      const y2 = parseInt(hierarchyMatch[4], 10);
      const w = Math.max(0, x2 - x1);
      const h = Math.max(0, y2 - y1);
      if (w > 0 && h > 0) return { width: w, height: h };
    }

    // 更稳健的退化策略：扫描所有 bounds，优先选择起点为 [0,0] 且面积最大的；否则选择全局面积最大的
    const re = /bounds=\"\[(\d+),(\d+)\]\[(\d+),(\d+)\]\"/g;
    let match: RegExpExecArray | null;
    let bestZeroOrigin: { w: number; h: number; area: number } | null = null;
    let bestAny: { w: number; h: number; area: number } | null = null;
    while ((match = re.exec(xmlContent)) !== null) {
      const x1 = parseInt(match[1], 10);
      const y1 = parseInt(match[2], 10);
      const x2 = parseInt(match[3], 10);
      const y2 = parseInt(match[4], 10);
      const w = Math.max(0, x2 - x1);
      const h = Math.max(0, y2 - y1);
      if (w <= 0 || h <= 0) continue;
      const area = w * h;
      // 记录全局最大
      if (!bestAny || area > bestAny.area) bestAny = { w, h, area };
      // 记录以 (0,0) 起点的最大
      if (x1 === 0 && y1 === 0) {
        if (!bestZeroOrigin || area > bestZeroOrigin.area) bestZeroOrigin = { w, h, area };
      }
    }
    if (bestZeroOrigin) return { width: bestZeroOrigin.w, height: bestZeroOrigin.h };
    if (bestAny) return { width: bestAny.w, height: bestAny.h };
  } catch {}
  return null;
}

// 计算在容器内按 contain（等比全显）绘制时的 left/top/width/height
export type VerticalAlign = 'center' | 'top' | 'bottom';

export function computeContainRect(
  containerW: number,
  containerH: number,
  imgW: number,
  imgH: number,
  align: VerticalAlign = 'center'
) {
  const rImg = imgW / imgH;
  const rCont = containerW / containerH;
  if (rImg > rCont) {
    const drawW = containerW;
    const drawH = containerW / rImg;
    const top = align === 'center' ? (containerH - drawH) / 2 : align === 'top' ? 0 : (containerH - drawH);
    return { left: 0, top, width: drawW, height: drawH };
  }
  const drawW = containerH * rImg;
  const drawH = containerH;
  // 高受限时，我们已经贴顶（top=0），这里保留水平方向居中
  return { left: (containerW - drawW) / 2, top: 0, width: drawW, height: drawH };
}
