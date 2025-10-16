// src/modules/universal-ui/pages/enhanced-element-selection-demo.tsx
// module: universal-ui | layer: pages | role: demo-page
// summary: 增强版元素选择工作流完整演示页面

import React, { useState, useCallback } from 'react';
import { Card, Space, Button, Typography, Alert, List, Tag, message } from 'antd';
import { PlayCircleOutlined, ThunderboltOutlined, ReloadOutlined } from '@ant-design/icons';

import { useIntelligentAnalysisWorkflow } from '../hooks/use-intelligent-analysis-workflow';
import { StepCardSystem } from '../components/step-card-system/StepCardSystemClean';
import { ElementSelectionPopover } from '../../../components/universal-ui/element-selection/ElementSelectionPopover';
import type { 
  ElementSelectionContext,
  IntelligentStepCard
} from '../types/intelligent-analysis-types';
import type { UIElement } from '../../../api/universalUIAPI';

const { Title, Text, Paragraph } = Typography;

/**
 * 增强版元素选择工作流演示
 * 
 * 🎯 演示文档要求的完整工作流：
 * 1. 元素选择 → 弹出气泡
 * 2. 气泡按钮：🧠 智能分析 / ✅ 直接确定 / 🔍 发现元素 / ❌ 取消
 * 3. "直接确定" → createStepCardQuick → 立即建卡 + 后台分析
 * 4. 分析完成 → 结果回填 → 一键升级
 */
export const EnhancedElementSelectionDemo: React.FC = () => {
  const [selectedElement, setSelectedElement] = useState<UIElement | null>(null);
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // 智能分析工作流
  const {
    stepCards,
    currentJobs,
    startAnalysis,
    cancelAnalysis,
    createStepCardQuick,
    clearAllSteps
  } = useIntelligentAnalysisWorkflow();

  // 模拟元素数据
  const mockElements: UIElement[] = [
    {
      id: 'contact_1',
      text: '张三',
      resource_id: 'contact_name_1',
      class_name: 'android.widget.TextView',
      bounds: '120,45,200,65',
      xpath: '//*[@id="contact-list"]/div[1]/span[1]',
      attributes: { 'content-desc': '联系人姓名: 张三' }
    },
    {
      id: 'contact_2', 
      text: '李四',
      resource_id: 'contact_name_2',
      class_name: 'android.widget.TextView', 
      bounds: '120,85,200,105',
      xpath: '//*[@id="contact-list"]/div[2]/span[1]',
      attributes: { 'content-desc': '联系人姓名: 李四' }
    },
    {
      id: 'add_button',
      text: '添加联系人',
      resource_id: 'add_contact_btn',
      class_name: 'android.widget.Button',
      bounds: '50,300,150,340',
      xpath: '//*[@id="toolbar"]/button[1]',
      attributes: { clickable: 'true', enabled: 'true' }
    }
  ];

  // 创建元素选择上下文
  const createElementContext = useCallback((element: UIElement): ElementSelectionContext => ({
    snapshotId: `demo_snapshot_${Date.now()}`,
    elementPath: element.xpath || element.id,
    elementType: element.text ? 'text' : 'tap',
    elementText: element.text,
    elementBounds: element.bounds,
    elementResourceId: element.resource_id,
    elementClassName: element.class_name,
    elementAttributes: element.attributes || {},
    containerHint: element.class_name?.includes('ListView') ? 'list' : 'general'
  }), []);

  // 模拟元素点击
  const handleElementClick = useCallback((element: UIElement, event: React.MouseEvent) => {
    setSelectedElement(element);
    setMousePosition({ x: event.clientX, y: event.clientY });
    setPopoverVisible(true);
    console.log('🎯 [Demo] 模拟元素点击:', element.text || element.id);
  }, []);

  // 气泡确认 - 传统模式（仅确认选择，不创建步骤）
  const handlePopoverConfirm = useCallback(() => {
    if (selectedElement) {
      message.success(`已选择元素: ${selectedElement.text || selectedElement.id}`);
      setPopoverVisible(false);
      setSelectedElement(null);
    }
  }, [selectedElement]);

  // 气泡取消
  const handlePopoverCancel = useCallback(() => {
    console.log('❌ [Demo] 取消元素选择');
    setPopoverVisible(false);
    setSelectedElement(null);
  }, []);

  // 🆕 快速创建步骤卡片（文档要求的"直接确定"功能）
  const handleQuickCreate = useCallback(async () => {
    if (!selectedElement) return;
    
    try {
      const context = createElementContext(selectedElement);
      console.log('⚡ [Demo] 快速创建步骤卡片:', context);
      
      const stepId = await createStepCardQuick(context, false);
      
      message.success(`✅ 步骤卡片已创建 (ID: ${stepId.substring(0, 8)}...)，智能分析进行中...`);
      
      // 关闭气泡
      setPopoverVisible(false);
      setSelectedElement(null);
    } catch (error) {
      console.error('创建步骤卡片失败:', error);
      message.error('创建步骤卡片失败');
    }
  }, [selectedElement, createElementContext, createStepCardQuick]);

  // 策略选择回调
  const handleStrategySelect = useCallback((strategy: any) => {
    console.log('🧠 [Demo] 策略选择:', strategy);
    message.success(`已选择策略: ${strategy.name}`);
    setPopoverVisible(false);
    setSelectedElement(null);
  }, []);

  // 步骤卡片回调
  const handleStepCardCallbacks = {
    onStartAnalysis: (stepId: string) => {
      console.log('🔄 [Demo] 重新分析步骤:', stepId);
      message.info('开始重新分析...');
    },
    onUpgradeStrategy: (stepId: string) => {
      console.log('⬆️ [Demo] 升级策略:', stepId);
      message.success('策略已升级！');
    },
    onEdit: (stepId: string) => {
      console.log('✏️ [Demo] 编辑步骤:', stepId);
    },
    onDelete: (stepId: string) => {
      console.log('🗑️ [Demo] 删除步骤:', stepId);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        
        {/* 页面标题和说明 */}
        <Card>
          <Title level={2}>
            <ThunderboltOutlined style={{ color: '#1890ff' }} /> 增强版元素选择工作流演示
          </Title>
          <Paragraph>
            演示文档要求的完整智能分析工作流：点选元素 → 气泡选择 → 快速建卡 → 后台分析 → 结果回填
          </Paragraph>
          
          <Alert
            type="info"
            message="工作流步骤"
            description={
              <ol style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                <li><strong>点击下方模拟元素</strong> → 弹出选择气泡</li>
                <li><strong>🧠 智能分析</strong>：主动触发分析后显示结果</li>
                <li><strong>✅ 直接确定</strong>：立即创建步骤卡片 + 后台分析</li>
                <li><strong>🔍 发现元素</strong>：查看相似元素</li>
                <li><strong>分析完成</strong> → 步骤卡片显示"一键升级"</li>
              </ol>
            }
            style={{ marginTop: '16px' }}
          />
        </Card>

        {/* 模拟界面元素 */}
        <Card title="模拟应用界面" extra={
          <Button 
            icon={<ReloadOutlined />} 
            onClick={clearAllSteps}
            disabled={stepCards.length === 0}
          >
            清空步骤
          </Button>
        }>
          <div style={{ 
            background: '#f5f5f5', 
            padding: '20px', 
            borderRadius: '8px',
            minHeight: '200px',
            position: 'relative'
          }}>
            <Text type="secondary" style={{ position: 'absolute', top: '8px', left: '8px' }}>
              模拟手机界面 - 点击元素体验工作流
            </Text>
            
            <Space direction="vertical" size="middle" style={{ marginTop: '30px' }}>
              {mockElements.map((element) => (
                <div
                  key={element.id}
                  onClick={(e) => handleElementClick(element, e)}
                  style={{
                    padding: '8px 16px',
                    background: element.class_name?.includes('Button') ? '#1890ff' : '#fff',
                    color: element.class_name?.includes('Button') ? '#fff' : '#000',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'inline-block',
                    transition: 'all 0.2s',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
                  }}
                >
                  {element.text || element.id}
                  <Text type="secondary" style={{ marginLeft: '8px', fontSize: '12px' }}>
                    ({element.class_name?.split('.').pop()})
                  </Text>
                </div>
              ))}
            </Space>
          </div>
        </Card>

        {/* 当前任务状态 */}
        {currentJobs.length > 0 && (
          <Card title="当前分析任务" size="small">
            <List
              size="small"
              dataSource={currentJobs}
              renderItem={(job) => (
                <List.Item>
                  <Space>
                    <Tag color="processing">分析中</Tag>
                    <Text>Job ID: {job.jobId.substring(0, 8)}...</Text>
                    <Text type="secondary">进度: {job.progress}%</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        )}

        {/* 步骤卡片列表 */}
        <Card title={`步骤卡片 (${stepCards.length})`}>
          {stepCards.length === 0 ? (
            <Text type="secondary">暂无步骤卡片，请点击上方元素并选择"直接确定"创建</Text>
          ) : (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {stepCards.map((stepCard, index) => (
                <StepCardSystem
                  key={stepCard.stepId}
                  stepData={stepCard}
                  stepIndex={index}
                  config={{
                    enableIntelligent: true,
                    enableEdit: true,
                    enableDelete: true,
                    enableTest: false
                  }}
                  callbacks={handleStepCardCallbacks}
                  systemMode="full"
                />
              ))}
            </Space>
          )}
        </Card>

      </Space>

      {/* 元素选择气泡 */}
      {selectedElement && (
        <ElementSelectionPopover
          visible={popoverVisible}
          selection={selectedElement ? {
            element: selectedElement,
            position: mousePosition,
            confirmed: false
          } : null}
          onConfirm={handlePopoverConfirm}
          onCancel={handlePopoverCancel}
          // 智能分析功能
          enableIntelligentAnalysis={true}
          stepId={`demo_step_${Date.now()}`}
          onStrategySelect={handleStrategySelect}
          // 🆕 快速创建步骤卡片（文档要求的核心功能）
          onQuickCreate={handleQuickCreate}
          // 其他配置
          allElements={mockElements}
          onElementSelect={setSelectedElement}
          autoPlacement={true}
          autoCancelOnOutsideClick={true}
        />
      )}
    </div>
  );
};

export default EnhancedElementSelectionDemo;