/**
 * 现代化ADB诊断页面
 * 使用仪表板式布局替代tab布局
 */
import React from 'react';
import { Layout, Typography, Space } from 'antd';
import { ModernAdbDashboard } from '../components/adb-diagnostic/ModernAdbDashboard';

const { Content, Header } = Layout;
const { Title, Text } = Typography;

interface ModernAdbDiagnosticPageProps {
  className?: string;
}

export const ModernAdbDiagnosticPage: React.FC<ModernAdbDiagnosticPageProps> = ({ className }) => {
  return (
    <Layout className={`modern-adb-diagnostic-page ${className || ''}`}>
      <Header 
        style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px'
        }}
      >
        <Space>
          <div style={{ fontSize: 24 }}>🔧</div>
          <div>
            <Title level={3} style={{ color: 'white', margin: 0 }}>
              ADB诊断中心
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
              专业级Android调试工具诊断平台
            </Text>
          </div>
        </Space>
      </Header>

      <Content style={{ padding: 24, backgroundColor: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
        <ModernAdbDashboard />
      </Content>
    </Layout>
  );
};

export default ModernAdbDiagnosticPage;