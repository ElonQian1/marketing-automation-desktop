// src/pages/debug/DatabaseDebug.tsx
// module: debug | layer: pages | role: 数据库调试页面  
// summary: 提供数据库连接状态和数据查询的调试界面

import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Alert, Space, Spin } from 'antd';
import { DatabaseOutlined, ReloadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface DatabaseStatus {
  connected: boolean;
  version?: string;
  tableCount?: number;
  error?: string;
}

export const DatabaseDebugPage: React.FC = () => {
  const [status, setStatus] = useState<DatabaseStatus>({ connected: false });
  const [loading, setLoading] = useState(false);

  const checkDatabaseStatus = async () => {
    setLoading(true);
    try {
      // 这里可以调用后端API检查数据库状态
      // 暂时使用模拟数据
      setTimeout(() => {
        setStatus({
          connected: true,
          version: 'SQLite 3.x',
          tableCount: 12
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      setStatus({
        connected: false,
        error: error instanceof Error ? error.message : '未知错误'
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  return (
    <div className="light-theme-force" style={{ padding: '24px', background: 'var(--bg-light-base, #ffffff)' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2} style={{ color: 'var(--text-inverse, #1e293b)' }}>
            <DatabaseOutlined /> 数据库调试
          </Title>
          <Text type="secondary" style={{ color: 'var(--text-secondary, #64748b)' }}>
            检查数据库连接状态和基本信息
          </Text>
        </div>

        <Card title="数据库状态" 
              extra={
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={checkDatabaseStatus}
                  loading={loading}
                  style={{ color: 'var(--text-inverse, #1e293b)' }}
                >
                  刷新状态
                </Button>
              }
              style={{ 
                background: 'var(--bg-light-base, #ffffff)', 
                borderColor: 'var(--border-color, #d1d5db)' 
              }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
              <div style={{ marginTop: '16px', color: 'var(--text-inverse, #1e293b)' }}>
                检查数据库状态中...
              </div>
            </div>
          ) : (
            <Space direction="vertical" style={{ width: '100%' }}>
              {status.connected ? (
                <Alert
                  message="数据库连接正常"
                  description={
                    <div style={{ color: 'var(--text-inverse, #1e293b)' }}>
                      <p>版本: {status.version}</p>
                      <p>表数量: {status.tableCount}</p>
                    </div>
                  }
                  type="success"
                  showIcon
                />
              ) : (
                <Alert
                  message="数据库连接失败"
                  description={status.error || '无法连接到数据库'}
                  type="error"
                  showIcon
                />
              )}
            </Space>
          )}
        </Card>

        <Card 
          title="快速操作" 
          style={{ 
            background: 'var(--bg-light-base, #ffffff)', 
            borderColor: 'var(--border-color, #d1d5db)' 
          }}
        >
          <Space wrap>
            <Button 
              type="primary" 
              disabled={!status.connected}
              style={{ 
                backgroundColor: status.connected ? 'var(--primary-color, #1677ff)' : undefined,
                borderColor: status.connected ? 'var(--primary-color, #1677ff)' : undefined 
              }}
            >
              查看表结构
            </Button>
            <Button disabled={!status.connected}>执行查询</Button>
            <Button disabled={!status.connected}>数据备份</Button>
            <Button disabled={!status.connected}>清理数据</Button>
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default DatabaseDebugPage;