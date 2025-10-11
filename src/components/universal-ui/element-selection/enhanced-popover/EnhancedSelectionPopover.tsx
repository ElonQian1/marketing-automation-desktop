// src/components/universal-ui/element-selection/enhanced-popover/EnhancedSelectionPopover.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 增强的元素选择气泡组件
 * 支持显示替代元素选项和层次导航
 */

import React, { useState, useEffect } from 'react';
import { Divider, Space, Typography, Button, Empty, Spin } from 'antd';
import ConfirmPopover from '../../common-popover/ConfirmPopover';
import { 
  CheckOutlined, 
  EyeInvisibleOutlined, 
  SwapOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import type { UIElement } from '../../../../api/universalUIAPI';
import type { AlternativeElement, ElementHierarchyNode } from '../hierarchy/types';
import { useSmartPopoverPosition } from '../utils/popoverPositioning';
import { ElementHierarchyAnalyzer } from '../hierarchy/ElementHierarchyAnalyzer';
import { AlternativeElementFinder } from '../alternative-selection/AlternativeElementFinder';
import { AlternativeElementCard } from './AlternativeElementCard';

const { Text } = Typography;

export interface EnhancedElementSelectionState {
  element: UIElement;
  position: { x: number; y: number };
  confirmed: boolean;
  allElements?: UIElement[]; // 需要传入所有元素以构建层次结构
}

export interface EnhancedSelectionPopoverProps {
  visible: boolean;
  selection: EnhancedElementSelectionState | null;
  onConfirm: () => void;
  onCancel: () => void;
  onAlternativeSelected?: (alternative: AlternativeElement) => void;
  /** 是否显示替代元素选项 */
  showAlternatives?: boolean;
}

export const EnhancedSelectionPopover: React.FC<EnhancedSelectionPopoverProps> = ({
  visible,
  selection,
  onConfirm,
  onCancel,
  onAlternativeSelected,
  showAlternatives = true
}) => {
  const [alternatives, setAlternatives] = useState<AlternativeElement[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAlternativesList, setShowAlternativesList] = useState(false);

  // 使用智能定位
  const positioning = useSmartPopoverPosition(
    selection?.position || null,
    {
      preferredPlacement: 'top',
      popoverSize: { width: showAlternativesList ? 320 : 240, height: showAlternativesList ? 200 : 120 },
      margin: 12
    }
  );

  // 当选择变化时，计算替代元素
  useEffect(() => {
    console.log('🔄 EnhancedSelectionPopover useEffect 触发:', {
      hasSelection: !!selection,
      showAlternatives,
      allElementsLength: selection?.allElements?.length
    });
    
    if (!selection || !showAlternatives) {
      console.log('🚫 跳过替代元素计算:', { hasSelection: !!selection, showAlternatives });
      setAlternatives([]);
      return;
    }

    if (!selection.allElements || selection.allElements.length === 0) {
      console.log('❌ 缺少 allElements 数据，无法分析层次结构');
      console.log('   - allElements 是否存在:', !!selection.allElements);
      console.log('   - allElements 长度:', selection.allElements?.length);
      setAlternatives([]);
      return;
    }

    const calculateAlternatives = async () => {
      setLoading(true);
      try {
        console.log('🔍 开始计算替代元素...');
        console.log('📊 传入元素总数:', selection.allElements?.length);
        console.log('🎯 目标元素:', selection.element.id, selection.element.text);
        
        // 构建层次结构
        const hierarchy = ElementHierarchyAnalyzer.analyzeHierarchy(selection.allElements!);
        const targetNode = hierarchy.nodeMap.get(selection.element.id);
        
        console.log('🏗️ 层次结构构建完成:', {
          总节点数: hierarchy.nodeMap.size,
          最大深度: hierarchy.maxDepth,
          叶子节点数: hierarchy.leafNodes.length,
          目标节点存在: !!targetNode
        });
        
        if (targetNode) {
          // 查找替代元素
          const foundAlternatives = AlternativeElementFinder.findAlternatives(
            targetNode,
            hierarchy.nodeMap,
            {
              maxDepth: 2,
              includeSiblings: true,
              sortBy: 'quality'
            }
          );
          
          console.log('✅ 找到替代元素:', foundAlternatives.length);
          foundAlternatives.forEach((alt, index) => {
            console.log(`  ${index + 1}. ${alt.relationship} - ${alt.node.element.text || alt.node.element.element_type} (质量: ${alt.qualityScore.toFixed(2)})`);
          });
          
          setAlternatives(foundAlternatives);
        } else {
          console.log('❌ 目标节点未找到，无法生成替代元素');
          setAlternatives([]);
        }
      } catch (error) {
        console.error('❌ 计算替代元素失败:', error);
        setAlternatives([]);
      } finally {
        setLoading(false);
      }
    };

    calculateAlternatives();
  }, [selection, showAlternatives]);

  if (!visible || !selection || !positioning) {
    return null;
  }

  // 处理替代元素选择
  const handleAlternativeSelect = (alternative: AlternativeElement) => {
    console.log('✅ 选择替代元素:', alternative);
    onAlternativeSelected?.(alternative);
  };

  // 切换替代元素列表显示
  const toggleAlternativesList = () => {
    setShowAlternativesList(!showAlternativesList);
  };

  // 渲染主要内容
  const renderMainContent = () => (
    <div style={{ minWidth: '200px', maxWidth: '300px' }}>
      {/* 原始元素信息 */}
      <div style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: '12px', color: '#666' }}>
          选择此元素？
        </Text>
        <div style={{ fontSize: '13px', fontWeight: 'bold', marginTop: 2 }}>
          {selection.element.text || 
           selection.element.resource_id || 
           selection.element.class_name || '未知元素'}
        </div>
      </div>

      {/* 替代元素选项 */}
      {showAlternatives && alternatives.length > 0 && (
        <>
          <Divider style={{ margin: '8px 0' }} />
          <div style={{ marginBottom: 8 }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: '11px', color: '#8c8c8c' }}>
                发现 {alternatives.length} 个更好的选择
              </Text>
              <Button
                type="link"
                size="small"
                icon={<SwapOutlined />}
                onClick={toggleAlternativesList}
                style={{ padding: 0, fontSize: '10px', height: 'auto' }}
              >
                {showAlternativesList ? '收起' : '展开'}
              </Button>
            </Space>
          </div>

          {/* 替代元素列表 */}
          {showAlternativesList && (
            <div style={{ maxHeight: '200px', overflow: 'auto' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <Spin size="small" />
                  <div style={{ fontSize: '11px', color: '#999', marginTop: 4 }}>
                    分析中...
                  </div>
                </div>
              ) : alternatives.length > 0 ? (
                <div>
                  {alternatives.slice(0, 3).map((alternative, index) => (
                    <AlternativeElementCard
                      key={`${alternative.node.element.id}-${index}`}
                      alternative={alternative}
                      onSelect={handleAlternativeSelect}
                      compact={true}
                    />
                  ))}
                  {alternatives.length > 3 && (
                    <Text style={{ fontSize: '10px', color: '#999', textAlign: 'center', display: 'block' }}>
                      还有 {alternatives.length - 3} 个选项...
                    </Text>
                  )}
                </div>
              ) : (
                <Empty 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="暂无替代选项"
                  style={{ margin: '8px 0' }}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div
      style={{
        position: 'fixed',
        left: positioning.position.x,
        top: positioning.position.y,
        zIndex: 10000,
        pointerEvents: 'none',
      }}
    >
      <ConfirmPopover
        open={visible}
        title={renderMainContent()}
        placement={positioning.placement}
        overlayStyle={{ maxWidth: showAlternativesList ? '350px' : '250px' }}
        onCancel={() => onCancel()}
      >
        <div style={{ 
          width: 1, 
          height: 1, 
          opacity: 0,
          pointerEvents: 'auto'
        }} />
      </ConfirmPopover>
    </div>
  );
};