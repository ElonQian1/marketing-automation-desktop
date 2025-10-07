import React, { useState, useEffect } from 'react';

import { Card, Button, Space, Typography, Alert, Divider } from 'antd';

const { Title, Text } = Typography;

const ArchitectureTestPage: React.FC = () => {
  const [testStatus, setTestStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [resultMessage, setResultMessage] = useState<string>('');

  const runArchitectureTest = async () => {
    setTestStatus('running');
    try {
      // 模拟架构测试
      await new Promise(resolve => setTimeout(resolve, 2000));
      setTestStatus('success');
      setResultMessage('架构图层次结构测试通过！');
    } catch (error) {
      setTestStatus('error');
      setResultMessage('架构测试失败: ' + String(error));
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>架构图测试页面</Title>
      <Divider />
      
      <Card title="架构层次结构测试" style={{ marginBottom: '16px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>测试底部导航架构的层次结构是否正确显示</Text>
          
          <Button 
            type="primary" 
            loading={testStatus === 'running'} 
            onClick={runArchitectureTest}
          >
            运行架构测试
          </Button>
          
          {testStatus !== 'idle' && (
            <Alert
              type={testStatus === 'success' ? 'success' : testStatus === 'error' ? 'error' : 'info'}
              message={resultMessage || '测试运行中...'}
              showIcon
            />
          )}
        </Space>
      </Card>
    </div>
  );
};

export default ArchitectureTestPage;
