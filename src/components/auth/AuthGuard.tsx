// src/components/auth/AuthGuard.tsx
// module: ui | layer: ui | role: component
// summary: 认证守卫组件 - 支持试用期管理

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { LoginPageNative } from '../../pages/auth/LoginPageNative';
import { Modal, Button, Typography, Space, Progress, Spin } from 'antd';
import { WarningOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { XmlPageCacheService } from '../../services/xml-page-cache-service';

const { Title, Text, Paragraph } = Typography;

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * 认证守护组件
 * - 检查用户是否已登录
 * - 检查试用期是否过期
 * - 显示试用期警告
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { 
    isAuthenticated, 
    user, 
    checkTrialExpiry, 
    getTrialDaysRemaining,
    logout,
    isTrialExpired
  } = useAuthStore();

  const [showTrialWarning, setShowTrialWarning] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(0);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // 检查试用期
    if (isAuthenticated && user) {
      if (user.role === 'trial') {
        const isExpired = checkTrialExpiry();
        const daysRemaining = getTrialDaysRemaining();
        setTrialDaysRemaining(daysRemaining);

        // 如果试用期已过期，强制登出
        if (isExpired) {
          Modal.error({
            title: '试用期已过期',
            content: '您的试用期已结束，请联系管理员升级账户。',
            okText: '返回登录',
            onOk: () => {
              logout();
            }
          });
        } else if (daysRemaining <= 3 && daysRemaining > 0) {
          // 如果剩余天数 <= 3 天，显示警告
          setShowTrialWarning(true);
        }
      }
      setIsChecking(false);

      // 🚀 [优化] 登录成功后在后台预加载 XML 缓存
      // 这样首次打开"页面分析"时可以瞬间显示，提升演示体验
      const preloadCache = async () => {
        try {
          const startTime = performance.now();
          console.log('🔄 [AuthGuard] 开始后台预加载 XML 缓存...');
          
          await XmlPageCacheService.getCachedPages();
          
          const duration = (performance.now() - startTime).toFixed(0);
          console.log(`✅ [AuthGuard] XML 缓存预加载完成，耗时 ${duration}ms`);
        } catch (error) {
          console.warn('⚠️ [AuthGuard] XML 缓存预加载失败（不影响主流程）:', error);
        }
      };

      // 延迟 500ms 后开始预加载，避免影响主界面渲染
      const timer = setTimeout(() => {
        preloadCache();
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setIsChecking(false);
    }
  }, [isAuthenticated, user, checkTrialExpiry, getTrialDaysRemaining, logout]);

  // 正在检查认证状态
  if (isChecking) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <Space direction="vertical" align="center" size="large">
          <Spin size="large" />
          <Text type="secondary">正在验证身份...</Text>
        </Space>
      </div>
    );
  }

  // 未登录，显示登录页面
  if (!isAuthenticated || !user) {
    return <LoginPageNative />;
  }

  // 试用期已过期
  if (isTrialExpired) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ 
          background: 'white', 
          padding: 48, 
          borderRadius: 16,
          maxWidth: 500,
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <WarningOutlined style={{ fontSize: 64, color: '#ff4d4f', marginBottom: 24 }} />
          <Title level={2}>试用期已过期</Title>
          <Paragraph type="secondary" style={{ fontSize: 16 }}>
            您的试用期已结束。如需继续使用，请联系管理员升级账户。
          </Paragraph>
          <Button 
            type="primary" 
            size="large"
            onClick={logout}
            style={{ marginTop: 24 }}
          >
            返回登录
          </Button>
        </div>
      </div>
    );
  }

  // 试用期警告弹窗
  const trialWarningModal = showTrialWarning && user?.role === 'trial' && (
    <Modal
      open={showTrialWarning}
      onCancel={() => setShowTrialWarning(false)}
      footer={[
        <Button key="ok" type="primary" onClick={() => setShowTrialWarning(false)}>
          我知道了
        </Button>
      ]}
      width={480}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Space align="center">
          <ClockCircleOutlined style={{ fontSize: 40, color: '#faad14' }} />
          <Title level={3} style={{ margin: 0 }}>试用期即将到期</Title>
        </Space>
        
        <div>
          <Text style={{ fontSize: 16 }}>
            您的试用期还剩 <Text strong style={{ fontSize: 20, color: '#faad14' }}>{trialDaysRemaining}</Text> 天
          </Text>
          <Progress 
            percent={((15 - trialDaysRemaining) / 15) * 100} 
            status="active"
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#ff4d4f',
            }}
            style={{ marginTop: 16 }}
          />
        </div>

        <Paragraph type="secondary">
          试用期结束后，您将无法继续使用本系统。请及时联系管理员升级账户。
        </Paragraph>
      </Space>
    </Modal>
  );

  // 已认证，显示子组件
  return (
    <>
      {children}
      {trialWarningModal}
    </>
  );
};

