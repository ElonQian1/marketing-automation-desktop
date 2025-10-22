// src/components/testing/V2StepTestButton.tsx
// module: components | layer: ui | role: V2版本步骤测试按钮
// summary: 基于V2引擎的步骤测试组件，替代有问题的V1测试

import React from 'react';
import { Button, Modal, Spin, Alert, Typography, Tag, Space, Collapse } from 'antd';
import { PlayCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useV2StepTest } from '../../hooks/useV2StepTest';
import type { SmartScriptStep } from '../../types/smartScript';

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface V2StepTestButtonProps {
  step: SmartScriptStep;
  deviceId: string;
  mode?: 'match-only' | 'execute-step';
  size?: 'small' | 'middle' | 'large';
  disabled?: boolean;
  onTestComplete?: (success: boolean, result: any) => void;
}

/**
 * 🚀 V2版本的步骤测试按钮组件
 * 
 * 特点：
 * - 使用最新的V2引擎，无V1兼容性问题
 * - 实时显示测试进度和结果
 * - 详细的错误信息和日志展示
 * - 支持影子执行对比（可选）
 */
export const V2StepTestButton: React.FC<V2StepTestButtonProps> = ({
  step,
  deviceId,
  mode = 'execute-step',
  size = 'middle',
  disabled = false,
  onTestComplete,
}) => {
  const {
    isLoading,
    lastResult,
    error,
    executeStep,
    clearResult,
    clearError,
  } = useV2StepTest();

  const [modalVisible, setModalVisible] = React.useState(false);

  /**
   * 执行V2测试
   */
  const handleV2Test = async () => {
    console.log('🚀 开始V2步骤测试:', { stepId: step.id, stepType: step.step_type, deviceId });

    try {
      const result = await executeStep(step, deviceId, mode);
      
      console.log('✅ V2测试完成:', result);
      
      // 自动显示结果
      setModalVisible(true);
      
      // 通知父组件
      onTestComplete?.(result.success, result);
      
    } catch (testError) {
      console.error('❌ V2测试异常:', testError);
      setModalVisible(true); // 显示错误详情
    }
  };

  /**
   * 关闭结果模态框
   */
  const closeModal = () => {
    setModalVisible(false);
    clearResult();
    clearError();
  };

  /**
   * 获取测试状态图标
   */
  const getStatusIcon = () => {
    if (isLoading) return <Spin size="small" />;
    if (error) return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
    if (lastResult?.success) return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    if (lastResult && !lastResult.success) return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
    return <PlayCircleOutlined />;
  };

  /**
   * 获取按钮文本
   */
  const getButtonText = () => {
    if (isLoading) return '测试中...';
    if (mode === 'match-only') return '匹配测试';
    return '执行测试';
  };

  /**
   * 获取按钮类型
   */
  const getButtonType = () => {
    if (error || (lastResult && !lastResult.success)) return 'danger';
    if (lastResult?.success) return 'primary';
    return 'default';
  };

  return (
    <>
      {/* V2测试按钮 */}
      <Button
        type={getButtonType()}
        size={size}
        icon={getStatusIcon()}
        loading={isLoading}
        disabled={disabled || !deviceId}
        onClick={handleV2Test}
        style={{ marginRight: 8 }}
      >
        {getButtonText()}
      </Button>

      {/* 测试结果模态框 */}
      <Modal
        title={
          <Space>
            <Tag color="blue">V2引擎</Tag>
            <span>步骤测试结果</span>
          </Space>
        }
        open={modalVisible}
        onCancel={closeModal}
        footer={[
          <Button key="close" onClick={closeModal}>
            关闭
          </Button>,
          lastResult && !lastResult.success && (
            <Button key="retry" type="primary" onClick={handleV2Test} loading={isLoading}>
              重试
            </Button>
          ),
        ].filter(Boolean)}
        width={800}
      >
        <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {/* 错误信息 */}
          {error && (
            <Alert
              message="V2测试异常"
              description={error}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
              action={
                <Button size="small" onClick={clearError}>
                  清除
                </Button>
              }
            />
          )}

          {/* 测试结果 */}
          {lastResult && (
            <div>
              {/* 基本信息 */}
              <Alert
                message={`测试${lastResult.success ? '成功' : '失败'}`}
                description={
                  <div>
                    <Paragraph>
                      <Text strong>步骤:</Text> {lastResult.stepName} ({lastResult.stepId})
                    </Paragraph>
                    <Paragraph>
                      <Text strong>消息:</Text> {lastResult.message}
                    </Paragraph>
                    <Paragraph>
                      <Text strong>引擎:</Text> <Tag color={lastResult.engine === 'v2' ? 'green' : 'orange'}>{lastResult.engine.toUpperCase()}</Tag>
                      <Text strong>耗时:</Text> {lastResult.durationMs}ms
                    </Paragraph>
                  </div>
                }
                type={lastResult.success ? 'success' : 'error'}
                showIcon
                style={{ marginBottom: 16 }}
              />

              {/* 详细信息折叠面板 */}
              <Collapse size="small">
                {/* 匹配结果 */}
                {lastResult.matched && (
                  <Panel header={`匹配结果 (置信度: ${lastResult.matched.confidence})`} key="matched">
                    <div>
                      <Paragraph>
                        <Text strong>元素ID:</Text> {lastResult.matched.id}
                      </Paragraph>
                      <Paragraph>
                        <Text strong>评分:</Text> {lastResult.matched.score}
                      </Paragraph>
                      <Paragraph>
                        <Text strong>边界:</Text> {JSON.stringify(lastResult.matched.bounds)}
                      </Paragraph>
                      {lastResult.matched.text && (
                        <Paragraph>
                          <Text strong>文本:</Text> {lastResult.matched.text}
                        </Paragraph>
                      )}
                    </div>
                  </Panel>
                )}

                {/* 执行动作 */}
                {lastResult.executedAction && (
                  <Panel header={`执行动作: ${lastResult.executedAction}`} key="action">
                    <div>
                      <Paragraph>
                        <Text strong>动作类型:</Text> {lastResult.executedAction}
                      </Paragraph>
                      {lastResult.verifyPassed !== undefined && (
                        <Paragraph>
                          <Text strong>验证结果:</Text>{' '}
                          <Tag color={lastResult.verifyPassed ? 'green' : 'red'}>
                            {lastResult.verifyPassed ? '通过' : '失败'}
                          </Tag>
                        </Paragraph>
                      )}
                    </div>
                  </Panel>
                )}

                {/* 日志信息 */}
                {lastResult.logs && lastResult.logs.length > 0 && (
                  <Panel header={`执行日志 (${lastResult.logs.length}条)`} key="logs">
                    <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                      {lastResult.logs.map((log, index) => (
                        <div key={index} style={{ marginBottom: '4px' }}>
                          <Text type="secondary">[{index + 1}]</Text> {log}
                        </div>
                      ))}
                    </div>
                  </Panel>
                )}

                {/* 影子执行结果 */}
                {lastResult.rawResponse?.shadowResult && (
                  <Panel header="影子执行对比" key="shadow">
                    <div>
                      <Alert
                        message="影子执行模式"
                        description="V1真实执行 + V2并行验证的对比结果"
                        type="info"
                        icon={<InfoCircleOutlined />}
                        style={{ marginBottom: 12 }}
                      />
                      
                      {lastResult.rawResponse.shadowResult.comparison && (
                        <div>
                          <Paragraph>
                            <Text strong>匹配对比:</Text>{' '}
                            <Tag color={lastResult.rawResponse.shadowResult.comparison.matched ? 'green' : 'red'}>
                              {lastResult.rawResponse.shadowResult.comparison.matched ? '一致' : '不一致'}
                            </Tag>
                          </Paragraph>
                          <Paragraph>
                            <Text strong>评分差异:</Text> {lastResult.rawResponse.shadowResult.comparison.scoreDiff.toFixed(3)}
                          </Paragraph>
                          <Paragraph>
                            <Text strong>置信度差异:</Text> {lastResult.rawResponse.shadowResult.comparison.confidenceDiff.toFixed(3)}
                          </Paragraph>
                        </div>
                      )}
                    </div>
                  </Panel>
                )}

                {/* 原始响应 */}
                <Panel header="原始响应数据" key="raw">
                  <pre style={{ 
                    fontSize: '11px', 
                    maxHeight: '200px', 
                    overflow: 'auto',
                    background: '#f5f5f5',
                    padding: '8px',
                    borderRadius: '4px'
                  }}>
                    {JSON.stringify(lastResult.rawResponse, null, 2)}
                  </pre>
                </Panel>
              </Collapse>
            </div>
          )}

          {/* 加载状态 */}
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>
                <Text>V2引擎执行中...</Text>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

/**
 * 🎯 V2测试按钮的默认导出
 */
export default V2StepTestButton;