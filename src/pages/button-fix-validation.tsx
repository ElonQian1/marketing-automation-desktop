// src/pages/button-fix-validation.tsx
// module: pages | layer: ui | role: 按钮识别修复验证页面
// summary: 一键验证"已关注"vs"关注"按钮识别修复是否成功

import React, { useEffect, useState } from 'react';
import { Card, Button, Space, Typography, Alert, Divider, Steps, Row, Col } from 'antd';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  SettingOutlined,
  BugOutlined,
  RocketOutlined
} from '@ant-design/icons';
import ButtonRecognitionFixTest from '../test/button-recognition-fix-test';
import { V3SystemStatusChecker } from '../test/v3-system-status';

const { Title, Text, Paragraph } = Typography;

interface SystemStatus {
  isEnabled: boolean;
  issues: string[];
  recommendations: string[];
  summary: string;
}

export const ButtonFixValidationPage: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // 检查系统状态
  const checkSystemStatus = async () => {
    setIsLoading(true);
    try {
      const status = await V3SystemStatusChecker.checkV3SystemStatus();
      setSystemStatus(status);
      
      // 根据状态设置当前步骤
      if (status.isEnabled) {
        setCurrentStep(2); // 系统就绪，可以测试
      } else {
        setCurrentStep(1); // 需要修复
      }
    } catch (error) {
      console.error('系统状态检查失败:', error);
      setSystemStatus({
        isEnabled: false,
        issues: [`检查失败: ${error.message}`],
        recommendations: ['刷新页面重试'],
        summary: '❌ 系统状态检查异常'
      });
      setCurrentStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  // 快速修复
  const quickFix = async () => {
    setIsLoading(true);
    try {
      await V3SystemStatusChecker.quickFixV3();
      await checkSystemStatus(); // 重新检查状态
    } catch (error) {
      console.error('快速修复失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 生成报告
  const generateReport = async () => {
    try {
      const report = await V3SystemStatusChecker.generateButtonRecognitionReport();
      console.log('📋 修复报告已生成:');
      console.log(report);
      
      // 创建下载链接
      const blob = new Blob([report], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `button-fix-report-${Date.now()}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('生成报告失败:', error);
    }
  };

  // 页面加载时检查状态
  useEffect(() => {
    checkSystemStatus();
  }, []);

  const stepItems = [
    {
      title: '检查系统状态',
      description: '验证V3智能分析系统配置',
      icon: <SettingOutlined />
    },
    {
      title: '修复配置问题',
      description: '启用V3系统和智能自动链',
      icon: <ExclamationCircleOutlined />
    },
    {
      title: '运行验证测试',
      description: '测试按钮识别修复效果',
      icon: <BugOutlined />
    },
    {
      title: '修复完成',
      description: '按钮识别问题已解决',
      icon: <CheckCircleOutlined />
    }
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <Title level={2}>
        <RocketOutlined style={{ marginRight: 8 }} />
        按钮识别修复验证页面
      </Title>
      
      <Alert 
        type="info" 
        message="修复目标" 
        description="解决用户选择'已关注'按钮时系统错误生成'关注'步骤卡片的问题。通过启用V3智能分析系统和增强元素识别逻辑来实现精确的按钮类型区分。" 
        style={{ marginBottom: '24px' }}
      />

      {/* 修复进度 */}
      <Card title="🔧 修复进度" style={{ marginBottom: '24px' }}>
        <Steps current={currentStep} items={stepItems} />
      </Card>

      {/* 系统状态检查 */}
      <Card 
        title="🏥 系统状态检查" 
        extra={
          <Button onClick={checkSystemStatus} loading={isLoading}>
            重新检查
          </Button>
        }
        style={{ marginBottom: '24px' }}
      >
        {systemStatus ? (
          <>
            <Alert 
              type={systemStatus.isEnabled ? 'success' : 'warning'}
              message={systemStatus.summary}
            />
            
            {systemStatus.issues.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <Text strong>发现的问题:</Text>
                <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                  {systemStatus.issues.map((issue, index) => (
                    <li key={index}>
                      <Text type="danger">{issue}</Text>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {systemStatus.recommendations.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <Text strong>修复建议:</Text>
                <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                  {systemStatus.recommendations.map((rec, index) => (
                    <li key={index}>
                      <Text>{rec}</Text>
                    </li>
                  ))}
                </ul>
                
                <div style={{ marginTop: '16px' }}>
                  <Button type="primary" onClick={quickFix} loading={isLoading}>
                    一键修复
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div>正在检查系统状态...</div>
        )}
      </Card>

      {/* 功能测试区域 */}
      {systemStatus?.isEnabled && (
        <Card title="🧪 按钮识别测试" style={{ marginBottom: '24px' }}>
          <ButtonRecognitionFixTest />
        </Card>
      )}

      {/* 快速操作 */}
      <Card title="🛠️ 快速操作">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>系统检查</Text>
                <Button block onClick={checkSystemStatus} loading={isLoading}>
                  检查V3系统状态
                </Button>
              </Space>
            </Card>
          </Col>
          
          <Col xs={24} sm={8}>
            <Card size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>配置修复</Text>
                <Button block onClick={quickFix} loading={isLoading}>
                  快速修复V3配置
                </Button>
              </Space>
            </Card>
          </Col>
          
          <Col xs={24} sm={8}>
            <Card size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>报告生成</Text>
                <Button block onClick={generateReport}>
                  生成修复报告
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 修复说明 */}
      <Card title="📋 修复说明" style={{ marginTop: '24px' }}>
        <Row gutter={[24, 16]}>
          <Col xs={24} lg={12}>
            <Title level={5}>🔍 问题诊断</Title>
            <ul>
              <li>选择"已关注"按钮时系统生成"关注"步骤</li>
              <li>V2系统只做简单文本匹配，无语义区分能力</li>
              <li>缺少按钮类型的互斥排除规则</li>
              <li>未启用V3的Step 0-6智能策略分析</li>
            </ul>
          </Col>
          
          <Col xs={24} lg={12}>
            <Title level={5}>✅ 修复方案</Title>
            <ul>
              <li>启用V3智能分析系统和自动链功能</li>
              <li>在元素转换中添加智能文本分析逻辑</li>
              <li>设置"已关注"与"关注"的互斥排除规则</li>
              <li>增强调试日志用于问题追踪</li>
            </ul>
          </Col>
        </Row>
        
        <Divider />
        
        <Paragraph>
          <Text strong>验证标准：</Text>
          所有按钮识别测试通过，系统能正确区分"已关注"和"关注"按钮，
          生成对应类型的步骤卡片，在批量操作模式下也能保持准确性。
        </Paragraph>
      </Card>

      {/* 控制台提示 */}
      <Alert 
        type="info" 
        message="开发者工具"
        description={
          <div>
            <Text>打开浏览器控制台可使用以下命令：</Text>
            <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
              <li><Text code>window.checkV3Status()</Text> - 检查V3系统状态</li>
              <li><Text code>window.fixV3()</Text> - 快速修复V3配置</li>
              <li><Text code>window.generateReport()</Text> - 生成详细修复报告</li>
            </ul>
          </div>
        }
        style={{ marginTop: '24px' }}
      />
    </div>
  );
};

export default ButtonFixValidationPage;