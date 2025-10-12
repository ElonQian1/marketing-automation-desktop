// src/modules/universal-ui/integration/NodeDetailIntegration.tsx
// module: universal-ui | layer: ui | role: integration
// summary: 节点详情面板集成示例，展示如何在现有UI中使用新策略系统

import React, { useEffect, useState } from 'react';
import { Card, Divider, Space, Button, Alert } from 'antd';
import { 
  StepCard,
  useStepStrategy,
  setSmartStrategyUseCase,
  type ElementDescriptor
} from '../index';
import { GenerateSmartStrategyUseCase } from '../application/usecases/GenerateSmartStrategyUseCase';
import { LegacySmartProvider } from '../infrastructure/adapters/LegacySmartProvider';
import { HeuristicProvider } from '../infrastructure/adapters/HeuristicProvider';

/**
 * 节点详情集成组件属性
 */
interface NodeDetailIntegrationProps {
  /** 当前选中的节点 */
  selectedNode?: any; // 使用现有的UiNode类型
  /** 是否显示策略卡片 */
  showStrategyCard?: boolean;
  /** 卡片标题 */
  cardTitle?: string;
  /** 自定义样式类名 */
  className?: string;
}

/**
 * 节点详情策略系统集成组件
 * 展示如何在现有的节点详情面板中集成新的策略系统
 */
export const NodeDetailIntegration: React.FC<NodeDetailIntegrationProps> = ({
  selectedNode,
  showStrategyCard = true,
  cardTitle = "元素匹配策略",
  className = ''
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const { state, utils } = useStepStrategy();

  // 初始化策略系统
  useEffect(() => {
    const initializeStrategySystem = async () => {
      try {
        console.log('🚀 初始化策略系统...');
        
        // 创建策略提供方
        const providers = [
          new LegacySmartProvider(),
          new HeuristicProvider()
        ];
        
        // 创建用例
        const useCase = new GenerateSmartStrategyUseCase(providers);
        
        // 注入依赖
        setSmartStrategyUseCase(useCase);
        
        setIsInitialized(true);
        console.log('✅ 策略系统初始化完成');
      } catch (error) {
        console.error('❌ 策略系统初始化失败:', error);
        setInitError(error instanceof Error ? error.message : '初始化失败');
      }
    };

    if (!isInitialized) {
      initializeStrategySystem();
    }
  }, [isInitialized]);

  // 处理节点选择
  useEffect(() => {
    if (!selectedNode || !isInitialized) return;

    const convertNodeToElementDescriptor = (node: any): ElementDescriptor => {
      return {
        nodeId: node.id || node.nodeId || 'unknown',
        tagName: node.tag || node.tagName,
        text: node.text,
        attributes: node.attributes || {},
        cssPath: node.cssPath,
        xpath: node.xpath,
        nthChild: node.nthChild,
        bounds: node.bounds,
        resourceId: node['resource-id'] || node.resourceId,
        contentDesc: node['content-desc'] || node.contentDesc,
        clickable: node.clickable === true || node.clickable === 'true',
        elementType: node.tag || node.type
      };
    };

    const elementDescriptor = convertNodeToElementDescriptor(selectedNode);
    
    // 异步设置元素，触发策略生成
    const setElementAsync = async () => {
      try {
        // 这里会调用我们的useStepStrategy hook中的setElement方法
        console.log('🎯 设置选中元素:', elementDescriptor.nodeId);
        // 注意：这里需要从useStepStrategy获取actions
        // const { actions } = useStepStrategy();
        // await actions.setElement(elementDescriptor);
      } catch (error) {
        console.error('❌ 设置元素失败:', error);
      }
    };

    setElementAsync();
  }, [selectedNode, isInitialized]);

  // 如果未初始化，显示加载状态
  if (!isInitialized) {
    return (
      <Card 
        title={cardTitle}
        className={`light-theme-force ${className}`}
        loading={!initError}
      >
        {initError && (
          <Alert
            message="初始化失败"
            description={initError}
            type="error"
            showIcon
          />
        )}
      </Card>
    );
  }

  // 如果不显示策略卡片，返回空
  if (!showStrategyCard) {
    return null;
  }

  return (
    <div className={`light-theme-force ${className}`}>
      {/* 策略卡片 */}
      <StepCard
        title={cardTitle}
        showModeSwitch={true}
        editable={true}
        size="default"
      />
      
      {/* 调试信息（开发环境） */}
      {process.env.NODE_ENV === 'development' && (
        <>
          <Divider />
          <Card 
            title="调试信息" 
            size="small"
            style={{ marginTop: 16 }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <strong>当前模式:</strong> {state.mode}
              </div>
              <div>
                <strong>是否有策略:</strong> {utils.hasStrategy ? '是' : '否'}
              </div>
              <div>
                <strong>是否可切换:</strong> {utils.canSwitchMode ? '是' : '否'}
              </div>
              <div>
                <strong>选中元素:</strong> {state.element?.nodeId || '无'}
              </div>
              {state.current && (
                <div>
                  <strong>当前策略:</strong> {state.current.kind} - {
                    state.current.kind === 'smart' 
                      ? state.current.selector.variant 
                      : (state.current as any).type
                  }
                </div>
              )}
              {state.error && (
                <Alert 
                  message={state.error} 
                  type="error" 
                  size="small" 
                />
              )}
            </Space>
          </Card>
        </>
      )}
    </div>
  );
};

export default NodeDetailIntegration;