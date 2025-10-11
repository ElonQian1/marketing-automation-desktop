// src/modules/deduplication-control/examples/IntegrationExample.tsx
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * 查重频控模块集成示例
 * 
 * 展示如何在主应用中集成和使用查重频控功能
 */
import React from 'react';
import { Card, Space, Button, Typography } from 'antd';
import { SafetyCertificateOutlined } from '@ant-design/icons';

// 导入查重频控模块
import { 
  DeduplicationControlManager,
  useSafetyControl 
} from '@/modules/deduplication-control';

const { Title, Paragraph } = Typography;

/**
 * 集成示例：在任务执行中使用安全检查
 */
export const TaskExecutionWithSafety: React.FC = () => {
  const { performSafetyCheck } = useSafetyControl();

  const handleTaskExecution = async (taskData: any) => {
    try {
      // 执行安全检查
      const safetyResult = await performSafetyCheck({
        content: taskData.message,
        target: taskData.target,
        accountId: taskData.accountId,
        action: 'send_message',
        metadata: {
          taskId: taskData.id,
          taskType: taskData.type
        }
      });

      if (!safetyResult.allowed) {
        // 处理拦截情况
        console.warn('任务被安全检查拦截:', {
          riskScore: safetyResult.riskScore,
          blockReason: safetyResult.blockReason,
          recommendations: safetyResult.recommendations
        });
        
        // 可以显示用户提示或记录日志
        return { success: false, reason: '安全检查未通过' };
      }

      // 安全检查通过，执行任务
      console.log('安全检查通过，风险评分:', safetyResult.riskScore);
      
      // 这里执行实际的任务逻辑
      // await executeActualTask(taskData);
      
      return { success: true };
    } catch (error) {
      console.error('任务执行失败:', error);
      return { success: false, reason: '执行异常' };
    }
  };

  return (
    <Card 
      title="集成示例：安全任务执行"
      className="light-theme-force"
      style={{ background: 'var(--bg-light-base)' }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Paragraph style={{ color: 'var(--text-inverse)' }}>
          此示例展示如何在任务执行前进行安全检查，确保操作的安全性。
        </Paragraph>
        
        <Button 
          type="primary" 
          onClick={() => handleTaskExecution({
            id: 'test-task-001',
            type: 'message',
            message: '测试消息内容',
            target: '13800138000',
            accountId: 'default'
          })}
        >
          执行测试任务（带安全检查）
        </Button>
      </Space>
    </Card>
  );
};

/**
 * 主应用安全管理页面
 */
export const SafetyManagementPage: React.FC = () => {
  return (
    <div className="light-theme-force" style={{ 
      background: 'var(--bg-light-base)', 
      minHeight: '100vh',
      padding: 24 
    }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 页面标题 */}
        <Card style={{ background: 'var(--bg-light-elevated)' }}>
          <Space>
            <SafetyCertificateOutlined style={{ fontSize: 24, color: 'var(--brand)' }} />
            <div>
              <Title level={2} style={{ margin: 0, color: 'var(--text-inverse)' }}>
                安全管理中心
              </Title>
              <Paragraph style={{ margin: 0, color: 'var(--text-secondary)' }}>
                智能查重、频率控制、熔断保护的统一管理平台
              </Paragraph>
            </div>
          </Space>
        </Card>

        {/* 集成示例 */}
        <TaskExecutionWithSafety />

        {/* 主要管理界面 */}
        <DeduplicationControlManager />
      </Space>
    </div>
  );
};

/**
 * 快速安全检查 Hook 示例
 */
export const useQuickSafetyCheck = () => {
  const { performSafetyCheck } = useSafetyControl();

  const quickCheck = async (content: string, target: string) => {
    const result = await performSafetyCheck({
      content,
      target,
      accountId: 'default',
      action: 'quick_check'
    });

    return {
      allowed: result.allowed,
      riskLevel: result.riskScore <= 30 ? 'low' : 
                 result.riskScore <= 70 ? 'medium' : 'high',
      message: result.allowed ? '检查通过' : '存在风险'
    };
  };

  return { quickCheck };
};

// 导出所有集成组件
export default SafetyManagementPage;