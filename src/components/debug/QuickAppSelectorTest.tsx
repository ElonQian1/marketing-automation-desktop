// src/components/debug/QuickAppSelectorTest.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React, { useState } from 'react';
import { Button, Card, Typography, Space, message } from 'antd';
import { useAdb } from '../../application/hooks/useAdb';
import { AppSelectorDetector } from '../../modules/contact-import/automation/detectors/AppSelectorDetector';

const { Title, Text } = Typography;

/**
 * 快速测试应用选择器检测器
 */
export const QuickAppSelectorTest: React.FC = () => {
  const { selectedDevice } = useAdb();
  const [isDetecting, setIsDetecting] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [detectionResult, setDetectionResult] = useState<any>(null);

  const detector = new AppSelectorDetector({
    titleText: "使用以下方式打开",
    package: "com.hihonor.android.internal.app",
    onceButtonId: "android:id/button_once",
    alwaysButtonId: "android:id/button_always",
    targetButtonText: "仅此一次"
  });
  // const automationService = new ImportAutomationService(); // 暂时注释掉

  /**
   * 测试检测器
   */
  const testDetection = async () => {
    if (!selectedDevice) {
      message.error('请先选择设备');
      return;
    }

    setIsDetecting(true);
    try {
      console.log('🔍 开始测试应用选择器检测...');
      
      // 抓取XML - 暂时禁用
      // const xmlContent = await automationService.captureUiXml(selectedDevice.id);
      console.log('📱 XML抓取功能暂时禁用');
      
      // 测试检测 - 暂时禁用
      // const result = await detector.detect(xmlContent);
      console.log('🎯 检测功能暂时禁用');
      // 占位提示：当前检测逻辑未启用
      message.info('⚠️ 检测功能暂未启用（仅日志验证）');
      
    } catch (error) {
      console.error('检测失败:', error);
      message.error(`检测失败: ${error}`);
    } finally {
      setIsDetecting(false);
    }
  };

  /**
   * 测试点击
   */
  const testClick = async () => {
    // 占位提示：点击功能暂未启用
    message.info('⚠️ 点击功能暂未启用');
    return;

    if (!selectedDevice || !detectionResult?.targetElement) {
      message.error('请先检测到目标元素');
      return;
    }

    setIsClicking(true);
    try {
      console.log('🖱️ 开始测试点击...');
      
      const element = detectionResult.targetElement;
      console.log('目标元素:', element);
      
      // 尝试通过resource-id点击
      // const clickResult = await automationService.clickElement(
      //   selectedDevice.id, 
      //   element.resourceId
      // );
      // console.log('点击结果:', clickResult);
      // if (clickResult.success) {
      //   message.success('✅ 点击成功！');
      // } else {
      //   message.error(`❌ 点击失败: ${clickResult.error}`);
      // }
      
    } catch (error) {
      console.error('点击失败:', error);
      message.error(`点击失败: ${error}`);
    } finally {
      setIsClicking(false);
    }
  };

  return (
    <Card title="应用选择器测试工具">
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Title level={4}>当前设备</Title>
          <Text>{selectedDevice ? selectedDevice.id : '未选择设备'}</Text>
        </div>

        <Space>
          <Button 
            type="primary" 
            loading={isDetecting} 
            onClick={testDetection}
            disabled={!selectedDevice}
          >
            🔍 测试检测
          </Button>
          
          <Button 
            type="default" 
            loading={isClicking} 
            onClick={testClick}
            disabled={!detectionResult?.detected || !detectionResult?.targetElement}
          >
            🖱️ 测试点击
          </Button>
        </Space>

        {detectionResult && (
          <Card size="small" title="检测结果">
            <pre style={{ fontSize: '12px', maxHeight: '300px', overflow: 'auto' }}>
              {JSON.stringify(detectionResult, null, 2)}
            </pre>
          </Card>
        )}
      </Space>
    </Card>
  );
};