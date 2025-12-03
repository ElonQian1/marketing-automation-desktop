// src/modules/execution-flow-control/ui/components/advanced-failure-config-modal.tsx
// module: execution-flow-control | layer: ui | role: 高级失败处理配置弹窗
// summary: 提供跳转目标选择和重试参数配置的弹窗界面

import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Tabs, 
  Space, 
  Typography, 
  Alert,
  Button,
  Divider
} from 'antd';
import { 
  SettingOutlined, 
  AimOutlined, 
  RedoOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

import { JumpTargetSelector, type JumpTargetStep } from './jump-target-selector';
import { RetryConfigPanel, type RetryConfig } from './retry-config-panel';

const { Text, Title } = Typography;
const { TabPane } = Tabs;

export interface AdvancedFailureConfig {
  /** 失败处理策略 */
  strategy: 'JUMP_TO_STEP' | 'RETRY_CURRENT';
  /** 跳转目标步骤ID (仅JUMP_TO_STEP时有效) */
  jumpTarget?: string;
  /** 重试配置 (仅RETRY_CURRENT时有效) */
  retryConfig?: RetryConfig;
}

export interface AdvancedFailureConfigModalProps {
  /** 弹窗是否可见 */
  visible: boolean;
  /** 当前步骤ID */
  currentStepId: string;
  /** 当前失败处理配置 */
  config?: AdvancedFailureConfig;
  /** 可选择的步骤列表 */
  availableSteps: JumpTargetStep[];
  /** 关闭弹窗回调 */
  onClose: () => void;
  /** 确认配置回调 */
  onConfirm: (config: AdvancedFailureConfig) => void;
  /** 弹窗标题 */
  title?: string;
}

/**
 * 高级失败处理配置弹窗
 * 
 * 🎯 功能特性：
 * - 跳转目标步骤选择
 * - 重试参数详细配置
 * - 分标签页管理不同策略
 * - 实时配置验证
 * - 智能默认值推荐
 */
export const AdvancedFailureConfigModal: React.FC<AdvancedFailureConfigModalProps> = ({
  visible,
  currentStepId,
  config,
  availableSteps,
  onClose,
  onConfirm,
  title = '高级失败处理配置'
}) => {
  const [activeTab, setActiveTab] = useState<string>('jump');
  const [jumpTarget, setJumpTarget] = useState<string | undefined>();
  const [retryConfig, setRetryConfig] = useState<RetryConfig>({ retryCount: 3, retryDelay: 1000 });

  // 🔄 同步外部配置到内部状态
  useEffect(() => {
    if (config) {
      if (config.strategy === 'JUMP_TO_STEP') {
        setActiveTab('jump');
        setJumpTarget(config.jumpTarget);
      } else if (config.strategy === 'RETRY_CURRENT') {
        setActiveTab('retry');
        setRetryConfig(config.retryConfig || { retryCount: 3, retryDelay: 1000 });
      }
    }
  }, [config, visible]);

  // 📝 处理确认
  const handleConfirm = () => {
    const newConfig: AdvancedFailureConfig = activeTab === 'jump' 
      ? {
          strategy: 'JUMP_TO_STEP',
          jumpTarget
        }
      : {
          strategy: 'RETRY_CURRENT',
          retryConfig
        };

    onConfirm(newConfig);
    onClose();
  };

  // 🔍 验证配置有效性
  const isConfigValid = () => {
    if (activeTab === 'jump') {
      return !!jumpTarget && jumpTarget !== currentStepId;
    } else {
      return retryConfig.retryCount >= 1 && retryConfig.retryDelay >= 100;
    }
  };

  // 🎨 获取当前策略说明
  const getStrategyDescription = () => {
    if (activeTab === 'jump') {
      return {
        title: '🎯 跳转到指定步骤',
        description: '当前步骤失败时，跳转到指定的步骤继续执行。适用于错误恢复流程或者重新开始某个环节。',
        icon: <AimOutlined style={{ color: '#1890ff' }} />
      };
    } else {
      return {
        title: '🔄 重试当前步骤',
        description: '当前步骤失败时，根据配置的次数和间隔重新执行该步骤。适用于临时性错误的自动恢复。',
        icon: <RedoOutlined style={{ color: '#52c41a' }} />
      };
    }
  };

  const strategyInfo = getStrategyDescription();

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined />
          {title}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      onOk={handleConfirm}
      okText="确认配置"
      cancelText="取消"
      width={600}
      okButtonProps={{
        disabled: !isConfigValid(),
        icon: <CheckCircleOutlined />
      }}
      destroyOnHidden
    >
      <div style={{ marginBottom: 16 }}>
        <Alert
          message={strategyInfo.title}
          description={strategyInfo.description}
          type="info"
          icon={strategyInfo.icon}
          showIcon
        />
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        size="small"
      >
        <TabPane 
          tab={
            <Space size="small">
              <AimOutlined />
              跳转配置
            </Space>
          } 
          key="jump"
        >
          <div style={{ padding: '16px 0' }}>
            <Title level={5} style={{ marginBottom: 12 }}>
              选择跳转目标步骤
            </Title>
            
            <JumpTargetSelector
              currentStepId={currentStepId}
              value={jumpTarget}
              availableSteps={availableSteps}
              onChange={setJumpTarget}
              size="middle"
              placeholder="请选择失败时要跳转到的步骤"
            />

            <Divider style={{ margin: '16px 0' }} />

            <div style={{ fontSize: '12px', color: '#666' }}>
              <p>💡 <strong>使用建议：</strong></p>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                <li>选择错误恢复流程的起始步骤</li>
                <li>避免跳转到当前步骤形成死循环</li>
                <li>推荐跳转到较早的关键检查点</li>
                <li>可以跳转到清理或重置步骤</li>
              </ul>
            </div>
          </div>
        </TabPane>

        <TabPane 
          tab={
            <Space size="small">
              <RedoOutlined />
              重试配置
            </Space>
          } 
          key="retry"
        >
          <div style={{ padding: '16px 0' }}>
            <Title level={5} style={{ marginBottom: 12 }}>
              重试参数设置
            </Title>

            <RetryConfigPanel
              value={retryConfig}
              onChange={setRetryConfig}
              size="middle"
              showDescription={true}
              compact={false}
            />

            <Divider style={{ margin: '16px 0' }} />

            <div style={{ fontSize: '12px', color: '#666' }}>
              <p>💡 <strong>使用建议：</strong></p>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                <li>网络相关操作：2-3次重试，间隔1-2秒</li>
                <li>UI等待操作：3-5次重试，间隔0.5-1秒</li>
                <li>关键业务步骤：5-8次重试，间隔2-3秒</li>
                <li>避免过多重试影响整体执行效率</li>
              </ul>
            </div>
          </div>
        </TabPane>
      </Tabs>

      {/* 🚨 配置验证提示 */}
      {!isConfigValid() && (
        <Alert
          message={
            activeTab === 'jump' 
              ? '请选择一个有效的跳转目标步骤' 
              : '请配置有效的重试参数（次数≥1，间隔≥100ms）'
          }
          type="warning"
          style={{ marginTop: 16 }}
          showIcon
        />
      )}
    </Modal>
  );
};