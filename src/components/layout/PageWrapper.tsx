import React from 'react';
import { Layout, Typography, Space, Button, Spin } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined, MoreOutlined } from '@ant-design/icons';

const { Content } = Layout;
const { Title, Text } = Typography;

interface PageWrapperProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  onBack?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

/**
 * 页面包装器组件
 * 为每个页面提供统一的标题栏和布局
 */
export const PageWrapper: React.FC<PageWrapperProps> = ({
  title,
  subtitle,
  icon,
  actions,
  children,
  onBack,
  onRefresh,
  isLoading = false
}) => {
  return (
    <Layout style={{ height: '100%' }}>
      <Content>
        {/* 页面标题栏 */}
        <div style={{ 
          padding: '16px 24px', 
          borderBottom: '1px solid var(--colorBorderSecondary)',
          backgroundColor: 'var(--colorBgContainer)'
        }}>
          <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space align="center">
              {onBack && (
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  onClick={onBack}
                  title="返回"
                />
              )}

              <Space align="center">
                {icon && <div>{icon}</div>}
                <div>
                  <Title level={4} style={{ margin: 0 }}>{title}</Title>
                  {subtitle && (
                    <Text type="secondary" style={{ fontSize: '14px' }}>
                      {subtitle}
                    </Text>
                  )}
                </div>
              </Space>
            </Space>

            <Space>
              {onRefresh && (
                <Button
                  type="text"
                  icon={<ReloadOutlined spin={isLoading} />}
                  onClick={onRefresh}
                  disabled={isLoading}
                  title="刷新"
                />
              )}

              {actions}

              <Button 
                type="text" 
                icon={<MoreOutlined />}
                title="更多选项"
              />
            </Space>
          </Space>
        </div>

        {/* 页面内容 */}
        <div style={{ 
          height: 'calc(100% - 73px)', 
          overflow: 'hidden'
        }}>
          <div style={{ 
            height: '100%', 
            overflowY: 'auto',
            padding: '24px'
          }}>
            <Spin spinning={isLoading}>
              {children}
            </Spin>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

