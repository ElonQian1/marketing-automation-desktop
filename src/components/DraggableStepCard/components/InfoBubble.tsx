// src/components/DraggableStepCard/components/InfoBubble.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React, { useMemo } from 'react';
import { Popover, Button, Descriptions, Tag, Card, Badge, Divider } from 'antd';
import { InfoCircleOutlined, EyeOutlined, AimOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { MatchingStrategyTag } from '../../step-card';
import { childElementAnalyzer, type ActionableChildElement } from '../../../components/universal-ui/views/grid-view/services/childElementAnalyzer';

interface InfoBubbleProps {
  step: any;
  boundNode: any;
  snapshotAvailable: boolean;
  onOpenXmlInspector: () => void;
  onSelectChildElement?: (element: ActionableChildElement) => void; // 🆕 子元素选择回调
  onUpdateStepParameters?: (stepId: string, nextParams: any) => void; // 🆕 步骤参数更新回调
}

/**
 * 信息气泡（小泡泡）
 * 展示三项核心数据：
 * 1) 绑定元素是谁（从 boundNode 或参数兜底）
 * 2) 匹配规则（strategy、fields、部分值）
 * 3) 原始 XML 快照（是否可用 + 一键打开检查器）
 */
export const InfoBubble: React.FC<InfoBubbleProps> = ({ 
  step, 
  boundNode, 
  snapshotAvailable, 
  onOpenXmlInspector, 
  onSelectChildElement,
  onUpdateStepParameters 
}) => {
  const matching = step?.parameters?.matching || {};

  const attrs = (() => {
    if (boundNode?.attrs) return boundNode.attrs;
    const p = step?.parameters || {};
    const v = matching.values || {};
    return {
      'resource-id': v['resource-id'] || p.resource_id,
      'text': v['text'] || p.text,
      'content-desc': v['content-desc'] || p.content_desc,
      'class': v['class'] || p.class_name,
      'bounds': v['bounds'] || p.bounds,
      'package': v['package'] || p.package,
    } as Record<string, any>;
  })();

  const fields: string[] = Array.isArray(matching.fields) ? matching.fields : [];
  const values = matching.values || {};

  // 🆕 分析子元素
  const childElementAnalysis = useMemo(() => {
    if (!boundNode || !boundNode.children || boundNode.children.length === 0) {
      return null;
    }
    
    try {
      return childElementAnalyzer.analyzeChildren(boundNode);
    } catch (error) {
      console.warn('子元素分析失败:', error);
      return null;
    }
  }, [boundNode]);

  const content = (
    <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
      <Descriptions size="small" column={1} bordered labelStyle={{ width: 120 }}>
        <Descriptions.Item label="元素标识">
          <div className="text-xs space-y-1">
            <div>id: <span className="text-neutral-700">{attrs['resource-id'] || '—'}</span></div>
            <div>text: <span className="text-neutral-700">{attrs['text'] || '—'}</span></div>
            <div>desc: <span className="text-neutral-700">{attrs['content-desc'] || '—'}</span></div>
            <div>class: <span className="text-neutral-700">{attrs['class'] || '—'}</span></div>
            <div>bounds: <span className="text-neutral-700 break-all">{attrs['bounds'] || '—'}</span></div>
          </div>
        </Descriptions.Item>
        <Descriptions.Item label="匹配规则">
          <div className="flex items-center gap-2 text-xs">
            <MatchingStrategyTag strategy={matching.strategy} />
            <span>字段数: {fields.length}</span>
            {fields.length > 0 && (
              <span className="truncate max-w-64" title={fields.join(', ')}>
                [{fields.slice(0, 4).join(', ')}{fields.length > 4 ? '…' : ''}]
              </span>
            )}
          </div>
          {fields.length > 0 && (
            <div className="mt-1 grid grid-cols-1 gap-1 text-xs">
              {fields.slice(0, 4).map((f) => (
                <div key={f} className="flex items-start">
                  <span className="min-w-20 text-neutral-500">{f}：</span>
                  <span className="flex-1 break-all text-neutral-800">{values?.[f] ?? '—'}</span>
                </div>
              ))}
              {fields.length > 4 && <div className="text-neutral-400">… 其余 {fields.length - 4} 项</div>}
            </div>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="上下文">
          <div className="text-xs space-y-1">
            <div>
              父节点类名：
              <span className="text-neutral-700">{boundNode?.parent?.attrs?.['class'] || '—'}</span>
            </div>
            <div>
              子节点数量：
              <span className="text-neutral-700">{Array.isArray(boundNode?.children) ? boundNode.children.length : (typeof boundNode?.childCount === 'number' ? boundNode.childCount : 0)}</span>
            </div>
          </div>
        </Descriptions.Item>
        <Descriptions.Item label="XML 快照">
          <div className="flex items-center gap-2 text-xs">
            <Tag color={snapshotAvailable ? 'green' : 'red'}>{snapshotAvailable ? '可用' : '缺失'}</Tag>
            <Button
              size="small"
              type="default"
              icon={<EyeOutlined />}
              disabled={!snapshotAvailable}
              onClick={(e) => { e.stopPropagation(); onOpenXmlInspector(); }}
            >
              查看XML快照
            </Button>
          </div>
        </Descriptions.Item>
      </Descriptions>

      {/* 🆕 子元素卡片展示 */}
      {childElementAnalysis && childElementAnalysis.children.length > 0 && (
        <>
          <Divider style={{ margin: '12px 0' }} />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">可操作的子元素</span>
              <Badge count={childElementAnalysis.totalCount} size="small" />
            </div>
            
            <div className="max-h-64 overflow-y-auto space-y-2">
              {childElementAnalysis.children.slice(0, 6).map((element, index) => (
                <Card
                  key={element.key}
                  size="small"
                  className={`cursor-pointer transition-all hover:shadow-sm border ${
                    element === childElementAnalysis.recommendation 
                      ? 'border-green-400 bg-green-50' 
                      : 'border-gray-200'
                  }`}
                  bodyStyle={{ padding: '8px 12px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectChildElement?.(element);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <AimOutlined className="text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {element.actionText}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {element.node.attrs['text'] && (
                            <span>文本: {element.node.attrs['text'].substring(0, 20)}{element.node.attrs['text'].length > 20 ? '...' : ''}</span>
                          )}
                          {element.node.attrs['resource-id'] && (
                            <span className="ml-2">ID: {element.node.attrs['resource-id'].split('/').pop()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {element === childElementAnalysis.recommendation && (
                        <Badge color="green" text="推荐" />
                      )}
                      <span className="text-xs text-gray-400">
                        {(element.confidence * 100).toFixed(0)}%
                      </span>
                      <Button
                        size="small"
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectChildElement?.(element);
                        }}
                      />
                    </div>
                  </div>
                </Card>
              ))}
              
              {childElementAnalysis.children.length > 6 && (
                <div className="text-center text-xs text-gray-400 py-2">
                  还有 {childElementAnalysis.children.length - 6} 个子元素...
                </div>
              )}
            </div>
            
            {childElementAnalysis.recommendation && (
              <div className="text-xs text-green-600 bg-green-50 p-2 rounded border border-green-200">
                💡 智能推荐: {childElementAnalysis.recommendation.actionText}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  return (
    <Popover
      placement="bottomRight"
      trigger={["click"]}
      styles={{ body: { padding: 8 } }}
      content={content}
      overlayClassName="overlay-surface overlay-elevated"
      zIndex={2100}
      destroyOnHidden
      autoAdjustOverflow
    >
      <Button
        className="step-action-btn"
        size="small"
        type="text"
        icon={<InfoCircleOutlined />}
        onClick={(e) => e.stopPropagation()}
        title="查看元素/匹配/快照信息"
        style={{ padding: '0 4px', fontSize: 12 }}
      >
        信息
      </Button>
    </Popover>
  );
};

export default InfoBubble;
