import React from 'react';
import { Typography } from 'antd';
import type { VisualUIElement } from '../types/visual-types';
import type { VisualElementCategory } from '../../../types';
import { analyzeAppAndPageInfo } from '../utils/appAnalysis';
import { convertVisualToUIElement } from '../utils/elementTransform';
import type { UIElement } from '../../../../../api/universalUIAPI';
import { parseXmlViewport, computeContainRect, VerticalAlign } from '../utils/screenGeometry';

const { Title } = Typography;

export interface PagePreviewProps {
  finalElements: VisualUIElement[];
  filteredElements: VisualUIElement[];
  categories: VisualElementCategory[];
  hideCompletely: boolean;
  xmlContent: string;
  deviceFramePadding: number;
  selectionManager: any;
  selectedElementId: string;
  // 新增：原始完整UIElement数据，用于保留语义信息
  originalUIElements?: UIElement[];
  // 🆕 可选：截图背景 URL（来自 usePageFinderModal）
  screenshotUrl?: string;
  // 🆕 是否显示截图背景
  showScreenshot?: boolean;
  // 🆕 辅助显示与参数
  showGrid?: boolean;
  showCrosshair?: boolean;
  overlayOpacity?: number;
  screenshotDim?: number;
  rotate90?: boolean;
  // 🆕 统一预览缩放（在计算后的画布上再次缩放，不改变内部比例关系）
  previewZoom?: number; // 0.5 - 3.0
  // 🆕 叠加层对齐微调（像素，应用到映射后的坐标）
  offsetX?: number;
  offsetY?: number;
  // 🆕 图片在“宽受限”场景下的垂直对齐方式（默认居中），可用于处理“左右对齐但上下不对齐”的情况
  verticalAlign?: VerticalAlign;
  // 🆕 覆盖层独立缩放：仅对叠加层应用，保持截图不变
  overlayScale?: number; // 0.2 - 3.0
}

export const PagePreview: React.FC<PagePreviewProps> = ({
  finalElements,
  filteredElements,
  categories,
  hideCompletely,
  xmlContent,
  deviceFramePadding,
  selectionManager,
  selectedElementId,
  originalUIElements = [],
  screenshotUrl,
  showScreenshot = true,
  showGrid = false,
  showCrosshair = false,
  overlayOpacity = 0.7,
  screenshotDim = 0,
  rotate90 = false
  , previewZoom = 1.0
  , offsetX = 0
  , offsetY = 0
  , verticalAlign = 'center'
  , overlayScale = 1.0
}) => {
  const [imgLoaded, setImgLoaded] = React.useState(false);
  const [imgError, setImgError] = React.useState<string | null>(null);
  const [imgNatural, setImgNatural] = React.useState<{w:number;h:number}|null>(null);
  React.useEffect(() => {
    // 当截图地址变化时，重置加载状态以触发淡入
    setImgLoaded(false);
    setImgError(null);
    setImgNatural(null);
  }, [screenshotUrl]);
  
  // 🔍 坐标系诊断：检测 XML 视口与截图尺寸的差异
  React.useEffect(() => {
    if (!imgNatural || !xmlContent) return;
    const vp = parseXmlViewport(xmlContent);
    if (!vp) return;
    
    const scaleX = imgNatural.w / vp.width;
    const scaleY = imgNatural.h / vp.height;
    const avgScale = (scaleX + scaleY) / 2;
    const scaleDiff = Math.abs(avgScale - 1.0);
    
    console.group('🔍 PagePreview 坐标系诊断');
    console.log('XML 视口尺寸:', vp.width, 'x', vp.height);
    console.log('截图实际尺寸:', imgNatural.w, 'x', imgNatural.h);
    console.log('X 轴比例:', scaleX.toFixed(4), '| Y 轴比例:', scaleY.toFixed(4));
    console.log('平均比例差异:', avgScale.toFixed(4));
    if (scaleDiff > 0.05) {
      console.warn('⚠️ 检测到显著差异 (>5%)，建议 overlayScale:', avgScale.toFixed(3));
    } else {
      console.log('✅ 视口与截图尺寸一致');
    }
    console.groupEnd();
  }, [imgNatural, xmlContent]);
  if (finalElements.length === 0) {
    return (
      <div style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid #d1d5db',borderRadius:8,background:'#f9fafb'}}>
        <span style={{color:'#999'}}>等待页面分析数据...</span>
      </div>
    );
  }

  // 优先使用 XML 视口尺寸（根节点/ hierarchy bounds），确保与截图坐标系一致
  const vp = parseXmlViewport(xmlContent);
  const fallbackMaxX = Math.max(...finalElements.map(e=>e.position.x + e.position.width));
  const fallbackMaxY = Math.max(...finalElements.map(e=>e.position.y + e.position.height));
  const baseW = vp?.width || fallbackMaxX || 1080;
  const baseH = vp?.height || fallbackMaxY || 1920;
  const maxPreviewWidth = Math.min(window.innerWidth * 0.5, 600);
  const availableWidth = maxPreviewWidth - 40;
  const maxDeviceWidth = availableWidth - deviceFramePadding * 2 - 32;
  // 基础 scale 以 XML 页面宽度为准
  let scale = maxDeviceWidth / (baseW || maxDeviceWidth);
  scale = Math.max(0.2, Math.min(2.0, scale));
  const scaledWidth = baseW * scale;
  const scaledHeight = baseH * scale;
  const frameWidth = (rotate90 ? scaledHeight : scaledWidth) + deviceFramePadding*2;
  const frameHeight = (rotate90 ? scaledWidth : scaledHeight) + deviceFramePadding*2;
  const { appName, pageName } = analyzeAppAndPageInfo(xmlContent);

  return (
    <div style={{width:'100%',border:'1px solid #4b5563',borderRadius:8,background:'#1f2937',display:'flex',flexDirection:'column'}}>
      <div style={{padding:'12px',borderBottom:'1px solid #374151',background:'#111827'}}>
        <Title level={5} style={{textAlign:'center',margin:0,color:'#e5e7eb',fontWeight:'bold'}}>
          📱 {appName}的{pageName}
        </Title>
        <div style={{textAlign:'center',fontSize:12,color:'#9ca3af',marginTop:4}}>
          设备分辨率: {baseW} × {baseH} | 缩放比例: {(scale*100).toFixed(0)}%
        </div>
      </div>
      <div style={{padding:16,position:'relative',background:'var(--bg-elevated, #1f2937)',overflow:'hidden',display:'flex',justifyContent:'center'}}>
        <div style={{
          width: frameWidth,
          height: frameHeight,
          position:'relative',
          background:'var(--bg-base, #000000)',
          borderRadius:20,
          padding: deviceFramePadding,
          boxShadow:'0 8px 32px rgba(0,0,0,0.3)'
        }}>
          <div style={{
            width:'100%',
            height:'100%',
            position:'relative',
            transform: `${rotate90 ? 'rotate(90deg) ' : ''}scale(${previewZoom})`,
            transformOrigin:'center top'
          }}>
            <div className="light-theme-force" style={{width:scaledWidth,height:scaledHeight,position:'relative',background:'var(--bg-light-base, #ffffff)',color:'var(--text-inverse, #1e293b)',borderRadius:12,overflow:'hidden', margin:'0 auto'}}>
              {showScreenshot && screenshotUrl && (
                <img
                  src={screenshotUrl}
                  alt="device screenshot"
                  style={{
                    position: 'absolute',
                    // 计算在容器内的“等比适配（contain）”绘制区域，避免裁剪
                    // 当无 natural 尺寸时先占满容器，加载后再过渡
                    ...((): any => {
                      if (!imgNatural) {
                        return { left: 0, top: 0, width: '100%', height: '100%' };
                      }
                      const rect = computeContainRect(scaledWidth, scaledHeight, imgNatural.w, imgNatural.h, verticalAlign);
                      return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
                    })(),
                    objectFit: 'fill', // 我们已按等比计算绘制区域尺寸，无需再让浏览器裁剪
                    userSelect: 'none',
                    pointerEvents: 'none',
                    zIndex: 0,
                    opacity: imgLoaded ? 1 : 0,
                    transition: 'opacity .25s ease'
                  }}
                  draggable={false}
                  onLoad={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
                    setImgLoaded(true);
                  }}
                  onError={() => {
                    setImgError('无法加载截图');
                    setImgLoaded(false);
                  }}
                />
              )}
              {showScreenshot && screenshotUrl && screenshotDim > 0 && (
                <div
                  style={{
                    position:'absolute',
                    inset:0,
                    background: 'rgba(0,0,0,' + Math.min(Math.max(screenshotDim, 0), 0.7) + ')',
                    zIndex: 1,
                    pointerEvents:'none'
                  }}
                />
              )}
            {filteredElements.map((element) => {
              const category = categories.find((cat) => cat.name === element.category);
              // 在容器内计算图片绘制区域（与上面 img 的 left/top/width/height 保持一致）
              const contW = scaledWidth; const contH = scaledHeight;
              const rect = imgNatural ? computeContainRect(contW, contH, imgNatural.w, imgNatural.h, verticalAlign) : { left: 0, top: 0, width: contW, height: contH };

              // 将 XML 坐标映射到绘制区域内（以 XML 视口 baseW/baseH 归一化）
              // 叠加层独立缩放：以绘制矩形中心为缩放中心，仅对叠加应用
              const cx = rect.left + rect.width / 2;
              const cy = rect.top + rect.height / 2;
              const baseLeft = rect.left + (element.position.x / baseW) * rect.width;
              const baseTop = rect.top + (element.position.y / baseH) * rect.height;
              const baseWScaled = Math.max((element.position.width / baseW) * rect.width, 1);
              const baseHScaled = Math.max((element.position.height / baseH) * rect.height, 1);
              const scaledLeft = cx + (baseLeft - cx) * overlayScale;
              const scaledTop = cy + (baseTop - cy) * overlayScale;
              const elementLeft = scaledLeft + offsetX;
              const elementTop = scaledTop + offsetY;
              const elementWidth = Math.max(baseWScaled * overlayScale, 1);
              const elementHeight = Math.max(baseHScaled * overlayScale, 1);
              const displayState = selectionManager.getElementDisplayState(element.id);

              const originalElement = originalUIElements.find((orig) => orig.id === element.id);
              const hasSemanticInfo =
                originalElement &&
                ((originalElement.content_desc && originalElement.content_desc.trim()) ||
                  (originalElement.resource_id && originalElement.resource_id.trim() && !originalElement.resource_id.includes('/')));

              const semanticIndicator = hasSemanticInfo ? '🏷️' : '';
              const semanticBorder = hasSemanticInfo
                ? '2px solid #52c41a'
                : element.clickable
                ? '1px solid #fff'
                : '1px solid rgba(255,255,255,0.3)';
              const semanticTitle = hasSemanticInfo
                ? `${element.userFriendlyName}: ${element.description} | 语义: ${originalElement?.content_desc || originalElement?.resource_id || '有标识'}`
                : `${element.userFriendlyName}: ${element.description}`;

              return (
                <div
                  key={element.id}
                  title={semanticTitle}
                  style={{
                    position: 'absolute',
                    left: elementLeft,
                    top: elementTop,
                    width: elementWidth,
                    height: elementHeight,
                    backgroundColor: category?.color || '#8b5cf6',
                    opacity: (!hideCompletely && displayState.isHidden) ? 0.12 : overlayOpacity,
                    border: displayState.isPending ? '2px solid #52c41a' : displayState.isHovered ? '2px solid #faad14' : semanticBorder,
                    borderRadius: Math.min(elementWidth, elementHeight) > 10 ? 2 : 1,
                    cursor: !hideCompletely && displayState.isHidden ? 'default' : element.clickable ? 'pointer' : 'default',
                    transition: 'all .2s ease',
                    zIndex: 10 + (displayState.isPending ? 40 : displayState.isHovered ? 20 : hasSemanticInfo ? 10 : element.clickable ? 5 : 0),
                    transform: displayState.isPending ? 'scale(1.1)' : displayState.isHovered ? 'scale(1.05)' : 'scale(1)',
                    boxShadow: displayState.isPending
                      ? '0 4px 16px rgba(82,196,26,0.4)'
                      : displayState.isHovered
                      ? '0 2px 8px rgba(0,0,0,0.2)'
                      : hasSemanticInfo
                      ? '0 0 4px rgba(82,196,26,0.6)'
                      : 'none',
                    filter: !hideCompletely && displayState.isHidden ? 'grayscale(100%) blur(1px)' : 'none',
                  }}
                  onClick={(e) => {
                    if (!element.clickable || (!hideCompletely && displayState.isHidden)) return;
                    e.stopPropagation();
                    let uiElement: UIElement;
                    if (originalElement) {
                      uiElement = originalElement;
                    } else {
                      uiElement = convertVisualToUIElement(element, selectedElementId) as unknown as UIElement;
                    }
                    selectionManager.handleElementClick(uiElement, { x: e.clientX, y: e.clientY });
                  }}
                  onMouseEnter={() => {
                    if (displayState.isHidden) return;
                    selectionManager.handleElementHover(element.id);
                  }}
                  onMouseLeave={() => {
                    if (displayState.isHidden) return;
                    selectionManager.handleElementHover(null);
                  }}
                >
                  {elementWidth > 20 && elementHeight > 15 && hasSemanticInfo && originalElement?.content_desc && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        fontSize: Math.max(6, Math.min(10, elementHeight / 4)),
                        color: '#52c41a',
                        background: 'rgba(0,0,0,0.8)',
                        textShadow: '0 1px 2px rgba(0,0,0,0.9)',
                        padding: '0px 2px',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        lineHeight: 1.1,
                        fontWeight: 'bold',
                        maxWidth: '100%',
                        borderRadius: '2px',
                        zIndex: 20,
                      }}
                    >
                      {semanticIndicator}
                      {originalElement.content_desc.substring(0, 8)}
                    </div>
                  )}

                  {elementWidth > 40 && elementHeight > 20 && element.text && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: hasSemanticInfo && originalElement?.content_desc ? Math.max(8, Math.min(12, elementHeight / 4)) + 2 : 0,
                        fontSize: Math.max(8, Math.min(12, elementHeight / 3)),
                        color: '#fff',
                        textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                        padding: '1px 2px',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        lineHeight: 1.2,
                        zIndex: 20,
                      }}
                    >
                      {element.text.substring(0, 10)}
                    </div>
                  )}

                  {elementWidth > 30 && elementHeight > 15 && element.description && !hasSemanticInfo && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        fontSize: Math.max(6, Math.min(10, elementHeight / 4)),
                        color: '#ffeb3b',
                        background: 'rgba(0,0,0,0.7)',
                        textShadow: '0 1px 2px rgba(0,0,0,0.9)',
                        padding: '1px 2px',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        lineHeight: 1.2,
                        borderRadius: '0 0 2px 2px',
                        zIndex: 20,
                      }}
                    >
                      {element.description ? `🎯 ${element.description.substring(0, 8)}` : element.text ? `📝 ${element.text.substring(0, 6)}` : ''}
                    </div>
                  )}
                </div>
              );
            })}
            {/* 图片加载失败兜底态 */}
            {showScreenshot && screenshotUrl && imgError && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.4)',
                  color: '#fff',
                  zIndex: 2,
                  fontSize: 12,
                }}
              >
                📷 截图加载失败，已继续显示元素叠加。可尝试重新采集或检查缓存图片是否存在。
              </div>
            )}
            {showGrid && scaledWidth > 200 && (
              <>
                {[0.25,0.5,0.75].map((r,i)=>(<div key={`v-${i}`} style={{position:'absolute',left:scaledWidth*r,top:0,bottom:0,width:1,background:'var(--border-muted, rgba(156,163,175,0.18))',pointerEvents:'none',zIndex:5}}/>))}
                {[0.25,0.5,0.75].map((r,i)=>(<div key={`h-${i}`} style={{position:'absolute',top:scaledHeight*r,left:0,right:0,height:1,background:'var(--border-muted, rgba(156,163,175,0.18))',pointerEvents:'none',zIndex:5}}/>))}
              </>
            )}
            {showCrosshair && (
              <>
                <div style={{position:'absolute',left:scaledWidth/2,top:0,bottom:0,width:1,background:'var(--success, #10b981)',opacity:0.4,pointerEvents:'none',zIndex:6}}/>
                <div style={{position:'absolute',top:scaledHeight/2,left:0,right:0,height:1,background:'var(--success, #10b981)',opacity:0.4,pointerEvents:'none',zIndex:6}}/>
              </>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
