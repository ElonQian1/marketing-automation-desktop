// src/components/universal-ui/views/visual-view/components/LeftControlPanel.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Input, Button, Space, Alert, Typography } from 'antd';
import { SearchOutlined, AppstoreOutlined } from '@ant-design/icons';
import type { VisualElementCategory, VisualUIElement } from '../../../types';

const { Title, Text } = Typography;

export interface LeftControlPanelProps {
  searchText: string;
  setSearchText: (v: string) => void;
  showOnlyClickable: boolean;
  setShowOnlyClickable: (v: boolean) => void;
  hideCompletely: boolean;
  setHideCompletely: (v: boolean) => void;
  // 🆕 显示截图背景开关
  showScreenshot: boolean;
  setShowScreenshot: (v: boolean) => void;
  // 🆕 预览辅助控制
  showGrid?: boolean;
  setShowGrid?: (v: boolean) => void;
  showCrosshair?: boolean;
  setShowCrosshair?: (v: boolean) => void;
  overlayOpacity?: number; // 0.2 - 1.0
  setOverlayOpacity?: (v: number) => void;
  screenshotDim?: number; // 0 - 0.7
  setScreenshotDim?: (v: number) => void;
  rotate90?: boolean;
  setRotate90?: (v: boolean) => void;
  // 🆕 统一预览缩放
  previewZoom?: number; // 0.5 - 3.0
  setPreviewZoom?: (v: number) => void;
  // 🆕 覆盖层独立缩放
  overlayScale?: number; // 0.2 - 3.0
  setOverlayScale?: (v: number) => void;
  // 🆕 轴向缩放
  overlayScaleX?: number;
  setOverlayScaleX?: (v: number|undefined) => void;
  overlayScaleY?: number;
  setOverlayScaleY?: (v: number|undefined) => void;
  // 🆕 对齐微调
  offsetX?: number;
  setOffsetX?: (v: number) => void;
  offsetY?: number;
  setOffsetY?: (v: number) => void;
  // 🆕 垂直对齐（宽受限时 top/center/bottom）
  verticalAlign?: 'top' | 'center' | 'bottom';
  setVerticalAlign?: (v: 'top' | 'center' | 'bottom') => void;
  // 🆕 自动校准 overlayScale
  autoCalibration?: boolean;
  setAutoCalibration?: (v: boolean) => void;
  // 🆕 校准方案选择
  calibrationMode?: 'A' | 'B' | 'C' | 'none';
  setCalibrationMode?: (mode: 'A' | 'B' | 'C' | 'none') => void;
  // 🆕 校准信息（用于显示状态）
  calibrationInfo?: {
    detected: boolean;
    suggested: number;
    confidence: number;
    reason?: string;
    hasDeviceProfile?: boolean;  // 是否有保存的设备配置
    hasDims?: boolean;           // 是否已具备有效的 XML 与截图尺寸
  };
  // 🆕 方案 B/C 操作：应用自动校准、保存设备配置
  canApplyAutoCalibration?: boolean;
  canSaveCalibrationProfile?: boolean;
  onApplyAutoCalibration?: () => void;
  onSaveCalibrationProfile?: () => void;
  selectedCategory: string;
  setSelectedCategory: (v: string) => void;
  selectionManager: any;
  finalElements: VisualUIElement[];
  categories: VisualElementCategory[];
}

export const LeftControlPanel: React.FC<LeftControlPanelProps> = ({
  searchText,
  setSearchText,
  showOnlyClickable,
  setShowOnlyClickable,
  hideCompletely,
  setHideCompletely,
  showScreenshot,
  setShowScreenshot,
  showGrid = false,
  setShowGrid,
  showCrosshair = false,
  setShowCrosshair,
  overlayOpacity = 0.7,
  setOverlayOpacity,
  screenshotDim = 0,
  setScreenshotDim,
  rotate90 = false,
  setRotate90,
  previewZoom = 1.0,
  setPreviewZoom,
  overlayScale = 1.0,
  setOverlayScale,
  overlayScaleX,
  setOverlayScaleX,
  overlayScaleY,
  setOverlayScaleY,
  offsetX = 0,
  setOffsetX,
  offsetY = 0,
  setOffsetY,
  verticalAlign = 'center',
  setVerticalAlign,
  autoCalibration = true,
  setAutoCalibration,
  calibrationMode = 'none',
  setCalibrationMode,
  calibrationInfo,
  canApplyAutoCalibration,
  canSaveCalibrationProfile,
  onApplyAutoCalibration,
  onSaveCalibrationProfile,
  selectedCategory,
  setSelectedCategory,
  selectionManager,
  finalElements,
  categories
}) => {
  return (
    <div style={{width:'clamp(120px,10vw,140px)',minWidth:120,borderRight:'1px solid #f0f0f0',paddingRight:6,flex:'0 0 clamp(120px,10vw,140px)',flexShrink:0}}>
      <Space direction="vertical" style={{width:'100%'}} size={12}>
        <Input placeholder="搜索..." prefix={<SearchOutlined/>} value={searchText} onChange={e=>setSearchText(e.target.value)} size="small" style={{fontSize:12}} />
        <div>
          <Space direction="vertical" style={{width:'100%'}} size={12}>
            <Space align="center" size={8}>
              <input type="checkbox" checked={showOnlyClickable} onChange={e=>setShowOnlyClickable(e.target.checked)} />
              <Text style={{fontSize:13}}>只显示可点击元素</Text>
            </Space>
            <Space align="center" size={8}>
              <input type="checkbox" checked={showScreenshot} onChange={e=>setShowScreenshot(e.target.checked)} />
              <Text style={{fontSize:13}}>显示截图背景</Text>
            </Space>
            <div>
              <Space align="start" size={8}>
                <input type="checkbox" checked={hideCompletely} onChange={e=>setHideCompletely(e.target.checked)} style={{marginTop:2}} />
                <div style={{flex:1,lineHeight:1.4}}>
                  <Text style={{fontSize:13}}>完全隐藏元素<br/><Text type="secondary" style={{fontSize:11,lineHeight:1.2}}>（否则半透明显示）</Text></Text>
                </div>
              </Space>
            </div>
            <Space align="center" size={8}>
              <input type="checkbox" checked={showGrid} onChange={e=>setShowGrid && setShowGrid(e.target.checked)} />
              <Text style={{fontSize:13}}>显示网格线</Text>
            </Space>
            <Space align="center" size={8}>
              <input type="checkbox" checked={showCrosshair} onChange={e=>setShowCrosshair && setShowCrosshair(e.target.checked)} />
              <Text style={{fontSize:13}}>显示准星</Text>
            </Space>
            <div>
              <Text style={{fontSize:12}}>覆盖层不透明度: {(overlayOpacity*100).toFixed(0)}%</Text>
              <input type="range" min={0.2} max={1} step={0.05} value={overlayOpacity} onChange={e=>setOverlayOpacity && setOverlayOpacity(parseFloat(e.target.value))} style={{width:'100%'}} />
            </div>
            <div>
              <Text style={{fontSize:12}}>截图暗化: {(screenshotDim*100).toFixed(0)}%</Text>
              <input type="range" min={0} max={0.7} step={0.05} value={screenshotDim} onChange={e=>setScreenshotDim && setScreenshotDim(parseFloat(e.target.value))} style={{width:'100%'}} />
            </div>
            <Space align="center" size={8}>
              <input type="checkbox" checked={rotate90} onChange={e=>setRotate90 && setRotate90(e.target.checked)} />
              <Text style={{fontSize:13}}>旋转 90°</Text>
            </Space>
            <div>
              <Text style={{fontSize:12}}>预览缩放: {(previewZoom*100).toFixed(0)}%</Text>
              <input type="range" min={0.5} max={3} step={0.1} value={previewZoom} onChange={e=>setPreviewZoom && setPreviewZoom(parseFloat(e.target.value))} style={{width:'100%'}} />
            </div>
            <Space align="center" size={8}>
              <input type="checkbox" checked={autoCalibration} onChange={e=>setAutoCalibration && setAutoCalibration(e.target.checked)} />
              <Text style={{fontSize:13}}>自动校准缩放</Text>
            </Space>
            <div>
              <Text style={{fontSize:12,fontWeight:'bold',marginBottom:4,display:'block'}}>🎯 校准方案</Text>
              <Space direction="vertical" size={4} style={{width:'100%'}}>
                <Button 
                  size="small" 
                  type={calibrationMode === 'A' ? 'primary' : 'default'}
                  onClick={() => setCalibrationMode && setCalibrationMode('A')}
                  style={{width:'100%',textAlign:'left',fontSize:11}}
                  disabled={!calibrationInfo?.hasDims}
                >
                  方案A: 自动检测
                </Button>
                <Button 
                  size="small" 
                  type={calibrationMode === 'B' ? 'primary' : 'default'}
                  onClick={() => setCalibrationMode && setCalibrationMode('B')}
                  style={{width:'100%',textAlign:'left',fontSize:11}}
                  disabled={!calibrationInfo?.hasDims}
                >
                  方案B: 统一坐标系
                </Button>
                <Button 
                  size="small" 
                  type={calibrationMode === 'C' ? 'primary' : 'default'}
                  onClick={() => setCalibrationMode && setCalibrationMode('C')}
                  style={{width:'100%',textAlign:'left',fontSize:11}}
                  disabled={!calibrationInfo?.hasDeviceProfile}
                  title={calibrationInfo?.hasDeviceProfile ? '使用保存的设备配置' : '暂无保存的配置'}
                >
                  方案C: 用户配置 {!calibrationInfo?.hasDeviceProfile && '(无)'}
                </Button>
                <Button 
                  size="small" 
                  type={calibrationMode === 'none' ? 'primary' : 'default'}
                  onClick={() => setCalibrationMode && setCalibrationMode('none')}
                  style={{width:'100%',textAlign:'left',fontSize:11}}
                  danger={calibrationMode === 'none'}
                >
                  关闭校准
                </Button>
                {/* 🆕 操作：应用/保存 */}
                <div style={{marginTop:6}}>
                  <Text style={{fontSize:12,fontWeight:600,display:'block',marginBottom:4}}>📦 设备配置</Text>
                  <Space direction="vertical" style={{width:'100%'}} size={4}>
                    <Button size="small" onClick={onApplyAutoCalibration} disabled={!canApplyAutoCalibration} style={{width:'100%',textAlign:'left'}}>
                      应用自动校准为当前
                    </Button>
                    <Button size="small" type="dashed" onClick={onSaveCalibrationProfile} disabled={!canSaveCalibrationProfile} style={{width:'100%',textAlign:'left'}}>
                      保存当前为设备配置
                    </Button>
                  </Space>
                </div>
              </Space>
            </div>
            {calibrationInfo && calibrationInfo.detected && calibrationMode !== 'none' && (
              <Alert 
                message="🎯 检测到校准需求" 
                description={
                  <div style={{fontSize:11}}>
                    <div>建议缩放: {(calibrationInfo.suggested * 100).toFixed(0)}%</div>
                    <div>置信度: {(calibrationInfo.confidence * 100).toFixed(0)}%</div>
                    {calibrationInfo.reason && (
                      <div style={{marginTop:4,color:'#666'}}>
                        {calibrationInfo.reason.split('\n').map((line, i) => (
                          <div key={i}>{line}</div>
                        ))}
                      </div>
                    )}
                  </div>
                }
                type="info"
                showIcon
                closable={false}
                style={{fontSize:11}}
              />
            )}
            <div>
              <Text style={{fontSize:12}}>叠加层缩放: {(overlayScale*100).toFixed(0)}% <Text type="secondary" style={{fontSize:11}}>(Ctrl +/-, Ctrl+Shift +/- = 1%)</Text></Text>
              <input type="range" min={0.2} max={3} step={0.01} value={overlayScale} onChange={e=>setOverlayScale && setOverlayScale(parseFloat(e.target.value))} style={{width:'100%'}} />
            </div>
            <div>
              <Text style={{fontSize:12}}>X 轴缩放: {(((overlayScaleX ?? overlayScale))*100).toFixed(0)}% <Text type="secondary" style={{fontSize:11}}>(Alt +/-, Alt+Shift +/-)</Text></Text>
              <input type="range" min={0.2} max={3} step={0.01} value={overlayScaleX ?? overlayScale} onChange={e=>setOverlayScaleX && setOverlayScaleX(parseFloat(e.target.value))} style={{width:'100%'}} />
              <Button size="small" style={{marginTop:4}} onClick={()=> setOverlayScaleX && setOverlayScaleX(undefined)}>重置 X（跟随整体）</Button>
            </div>
            <div>
              <Text style={{fontSize:12}}>Y 轴缩放: {(((overlayScaleY ?? overlayScale))*100).toFixed(0)}% <Text type="secondary" style={{fontSize:11}}>(Ctrl+Alt +/-, Ctrl+Alt+Shift +/-)</Text></Text>
              <input type="range" min={0.2} max={3} step={0.01} value={overlayScaleY ?? overlayScale} onChange={e=>setOverlayScaleY && setOverlayScaleY(parseFloat(e.target.value))} style={{width:'100%'}} />
              <Button size="small" style={{marginTop:4}} onClick={()=> setOverlayScaleY && setOverlayScaleY(undefined)}>重置 Y（跟随整体）</Button>
            </div>
            <div>
              <Text style={{fontSize:12}}>垂直对齐（宽受限）</Text>
              <select value={verticalAlign} onChange={(e)=> setVerticalAlign && setVerticalAlign(e.target.value as any)} style={{width:'100%'}}>
                <option value="top">top</option>
                <option value="center">center</option>
                <option value="bottom">bottom</option>
              </select>
            </div>
            <div>
              <Text style={{fontSize:12}}>对齐微调 (px)</Text>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                <div>
                  <Text style={{fontSize:12}}>X</Text>
                  <input type="number" value={offsetX} onChange={e=>setOffsetX && setOffsetX(parseInt(e.target.value||'0',10)||0)} style={{width:'100%'}} />
                </div>
                <div>
                  <Text style={{fontSize:12}}>Y</Text>
                  <input type="number" value={offsetY} onChange={e=>setOffsetY && setOffsetY(parseInt(e.target.value||'0',10)||0)} style={{width:'100%'}} />
                </div>
              </div>
              <Button size="small" style={{marginTop:6}} onClick={() => { setOffsetX && setOffsetX(0); setOffsetY && setOffsetY(0); }}>重置对齐 (Ctrl+0)</Button>
            </div>
            {selectionManager.hiddenElements.length>0 && (
              <div style={{padding:8,background:'#f6ffed',border:'1px solid #b7eb8f',borderRadius:4,fontSize:12}}>
                <Space direction="vertical" size={4} style={{width:'100%'}}>
                  <Text style={{fontSize:12,color:'#52c41a'}}>
                    已隐藏 {selectionManager.hiddenElements.length} 个元素 {hideCompletely? '（完全隐藏）':'（半透明显示）'}
                  </Text>
                  <Button size="small" type="link" onClick={selectionManager.restoreAllElements} style={{padding:0,height:'auto',fontSize:11}}>恢复所有隐藏元素</Button>
                </Space>
              </div>
            )}
          </Space>
        </div>
        <div>
          <Title level={5} style={{fontSize:13,marginBottom:8}}>分类</Title>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            <Button type={selectedCategory==='all'?'primary':'default'} size="small" onClick={()=>setSelectedCategory('all')} style={{textAlign:'left',fontSize:11,height:28,padding:'0 6px'}}>
              <AppstoreOutlined/> 全部 ({finalElements.length})
            </Button>
            {categories.map(category => (
              <Button key={category.name} type={selectedCategory===category.name?'primary':'default'} size="small" onClick={()=>setSelectedCategory(category.name)} style={{textAlign:'left',fontSize:11,height:28,padding:'0 6px',borderColor:category.color,backgroundColor: selectedCategory===category.name?category.color:undefined}} title={`${category.name} (${category.elements.length})`}>
                {category.icon} {category.name.length>4? category.name.substring(0,4)+'...':category.name} ({category.elements.length})
              </Button>
            ))}
          </div>
        </div>
        <div style={{width:'100%'}}>
          <Alert message="统计" type="info" description={<div style={{fontSize:11,lineHeight:1.3}}>
            <div>总数: {finalElements.length}</div>
            <div>可见: {finalElements.filter(e=>!selectionManager.isElementHidden(e.id)).length}</div>
            <div>隐藏: {finalElements.filter(e=>selectionManager.isElementHidden(e.id)).length}</div>
            <div>可点击: {finalElements.filter(e=>e.clickable && !selectionManager.isElementHidden(e.id)).length}</div>
            <div>重要: {finalElements.filter(e=>e.importance==='high' && !selectionManager.isElementHidden(e.id)).length}</div>
          </div>} />
        </div>
        {selectionManager.hiddenElements.length>0 && (
          <Alert message={<span>🙈 已隐藏 {selectionManager.hiddenElements.length} 个元素</span>} description="隐藏的元素仍会显示但呈现半透明状态，60秒后自动恢复" type="warning" showIcon closable={false} />
        )}
      </Space>
    </div>
  );
};
