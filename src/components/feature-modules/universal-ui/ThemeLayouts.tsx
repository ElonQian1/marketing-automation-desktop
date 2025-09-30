/**
 * 主题感知的布局增强模块
 * 提供适配各种页面的布局组件
 */

import React, { useState } from 'react';
import { 
  Layout, 
  Card, 
  Row, 
  Col, 
  Space, 
  Button, 
  Drawer, 
  BackTop, 
  Affix,
  Breadcrumb,
  Typography,
  Divider,
  Switch,
  ConfigProvider,
} from 'antd';
import { 
  MenuFoldOutlined, 
  MenuUnfoldOutlined,
  UpOutlined,
  HomeOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useThemeManager } from '../theme-system';

const { Header, Sider, Content, Footer } = Layout;
const { Title, Text } = Typography;

/**
 * 主题感知的页面容器
 */
export interface ThemeAwarePageContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  extra?: React.ReactNode;
  breadcrumb?: Array<{ title: string; href?: string }>;
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const ThemeAwarePageContainer: React.FC<ThemeAwarePageContainerProps> = ({
  children,
  title,
  subtitle,
  extra,
  breadcrumb = [],
  loading = false,
  className,
  style,
}) => {
  const themeManager = useThemeManager();
  const isDark = themeManager.mode === 'dark';

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: 'var(--colorBgLayout)',
    padding: '24px',
    ...style,
  };

  const pageHeaderStyle: React.CSSProperties = {
    backgroundColor: 'var(--colorBgContainer)',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
    border: '1px solid var(--colorBorderSecondary)',
    boxShadow: isDark 
      ? '0 2px 8px rgba(0, 0, 0, 0.1)' 
      : '0 2px 8px rgba(0, 0, 0, 0.06)',
  };

  const contentStyle: React.CSSProperties = {
    backgroundColor: 'var(--colorBgContainer)',
    borderRadius: '8px',
    padding: '24px',
    border: '1px solid var(--colorBorderSecondary)',
    boxShadow: isDark 
      ? '0 2px 8px rgba(0, 0, 0, 0.1)' 
      : '0 2px 8px rgba(0, 0, 0, 0.06)',
  };

  return (
    <div style={containerStyle} className={className}>
      {/* 面包屑导航 */}
      {breadcrumb.length > 0 && (
        <Breadcrumb style={{ marginBottom: '16px' }}>
          <Breadcrumb.Item href="/">
            <HomeOutlined />
          </Breadcrumb.Item>
          {breadcrumb.map((item, index) => (
            <Breadcrumb.Item key={index} href={item.href}>
              {item.title}
            </Breadcrumb.Item>
          ))}
        </Breadcrumb>
      )}

      {/* 页面头部 */}
      {(title || extra) && (
        <div style={pageHeaderStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              {title && (
                <Title level={2} style={{ margin: 0, color: 'var(--colorText)' }}>
                  {title}
                </Title>
              )}
              {subtitle && (
                <Text style={{ color: 'var(--colorTextSecondary)', marginTop: '8px' }}>
                  {subtitle}
                </Text>
              )}
            </div>
            {extra && <div>{extra}</div>}
          </div>
        </div>
      )}

      {/* 页面内容 */}
      <div style={contentStyle}>
        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '80px 0',
            color: 'var(--colorTextSecondary)',
          }}>
            加载中...
          </div>
        ) : (
          children
        )}
      </div>

      {/* 回到顶部 */}
      <BackTop 
        style={{
          backgroundColor: 'var(--colorPrimary)',
          color: '#ffffff',
        }}
      >
        <div style={{
          height: 40,
          width: 40,
          lineHeight: '40px',
          borderRadius: 4,
          backgroundColor: 'var(--colorPrimary)',
          color: '#ffffff',
          textAlign: 'center',
          fontSize: 14,
        }}>
          <UpOutlined />
        </div>
      </BackTop>
    </div>
  );
};

/**
 * 主题感知的网格布局
 */
export interface ThemeAwareGridLayoutProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 6 | 8 | 12;
  gutter?: [number, number];
  responsive?: boolean;
}

export const ThemeAwareGridLayout: React.FC<ThemeAwareGridLayoutProps> = ({
  children,
  columns = 3,
  gutter = [16, 16],
  responsive = true,
}) => {
  const span = 24 / columns;
  
  const responsiveProps = responsive ? {
    xs: 24,
    sm: columns >= 2 ? 12 : 24,
    md: columns >= 3 ? 8 : columns >= 2 ? 12 : 24,
    lg: span,
    xl: span,
    xxl: span,
  } : { span };

  return (
    <Row gutter={gutter}>
      {React.Children.map(children, (child, index) => (
        <Col key={index} {...responsiveProps}>
          {child}
        </Col>
      ))}
    </Row>
  );
};

/**
 * 主题感知的侧边栏布局
 */
export interface ThemeAwareSidebarLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  sidebarWidth?: number;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  placement?: 'left' | 'right';
}

export const ThemeAwareSidebarLayout: React.FC<ThemeAwareSidebarLayoutProps> = ({
  children,
  sidebar,
  sidebarWidth = 280,
  collapsible = true,
  defaultCollapsed = false,
  placement = 'left',
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const themeManager2 = useThemeManager();
  const isDark = themeManager2.mode === 'dark';

  const siderStyle: React.CSSProperties = {
    backgroundColor: 'var(--colorBgContainer)',
    borderRight: placement === 'left' ? '1px solid var(--colorBorderSecondary)' : 'none',
    borderLeft: placement === 'right' ? '1px solid var(--colorBorderSecondary)' : 'none',
    height: '100vh',
    position: 'fixed',
    [placement]: 0,
    top: 0,
    zIndex: 100,
    boxShadow: isDark 
      ? '2px 0 8px rgba(0, 0, 0, 0.1)' 
      : '2px 0 8px rgba(0, 0, 0, 0.06)',
  };

  const contentStyle: React.CSSProperties = {
    marginLeft: placement === 'left' ? (collapsed ? 80 : sidebarWidth) : 0,
    marginRight: placement === 'right' ? (collapsed ? 80 : sidebarWidth) : 0,
    transition: 'all 0.2s',
    minHeight: '100vh',
    backgroundColor: 'var(--colorBgLayout)',
  };

  const toggleButton = (
    <Button
      type="text"
      icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
      onClick={() => setCollapsed(!collapsed)}
      style={{
        fontSize: '16px',
        width: 64,
        height: 64,
        color: 'var(--colorText)',
      }}
    />
  );

  return (
    <>
      {/* 桌面端侧边栏 */}
      <div className="hidden md:block">
        <Sider
          width={sidebarWidth}
          collapsible={collapsible}
          collapsed={collapsed}
          onCollapse={setCollapsed}
          trigger={collapsible ? toggleButton : null}
          style={siderStyle}
          theme={isDark ? 'dark' : 'light'}
        >
          <div style={{ height: '100%', overflow: 'auto' }}>
            {sidebar}
          </div>
        </Sider>
        <div style={contentStyle}>
          {children}
        </div>
      </div>

      {/* 移动端抽屉侧边栏 */}
      <div className="block md:hidden">
        <div style={{ padding: '16px' }}>
          <Button
            type="primary"
            icon={<MenuUnfoldOutlined />}
            onClick={() => setDrawerVisible(true)}
          >
            菜单
          </Button>
        </div>
        <Drawer
          title="菜单"
          placement={placement}
          width={sidebarWidth}
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          styles={{
            body: { padding: 0 },
          }}
        >
          {sidebar}
        </Drawer>
        <div style={{ backgroundColor: 'var(--colorBgLayout)', minHeight: '100vh' }}>
          {children}
        </div>
      </div>
    </>
  );
};

/**
 * 主题感知的卡片网格
 */
export interface ThemeAwareCardGridProps {
  items: Array<{
    key: string;
    title: string;
    content: React.ReactNode;
    extra?: React.ReactNode;
    actions?: React.ReactNode[];
  }>;
  columns?: 1 | 2 | 3 | 4;
  loading?: boolean;
}

export const ThemeAwareCardGrid: React.FC<ThemeAwareCardGridProps> = ({
  items,
  columns = 3,
  loading = false,
}) => {
  const themeManager3 = useThemeManager();
  const isDark = themeManager3.mode === 'dark';

  const cardStyle: React.CSSProperties = {
    height: '100%',
    backgroundColor: 'var(--colorBgContainer)',
    borderColor: 'var(--colorBorderSecondary)',
    borderRadius: '8px',
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: isDark 
      ? '0 2px 8px rgba(0, 0, 0, 0.1)' 
      : '0 2px 8px rgba(0, 0, 0, 0.06)',
  };

  return (
    <ThemeAwareGridLayout columns={columns}>
      {items.map((item) => (
        <Card
          key={item.key}
          title={
            <Text style={{ color: 'var(--colorText)', fontWeight: 'bold' }}>
              {item.title}
            </Text>
          }
          extra={item.extra}
          actions={item.actions}
          loading={loading}
          style={cardStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = isDark 
              ? '0 4px 16px rgba(0, 0, 0, 0.2)' 
              : '0 4px 16px rgba(0, 0, 0, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = cardStyle.boxShadow as string;
          }}
        >
          {item.content}
        </Card>
      ))}
    </ThemeAwareGridLayout>
  );
};

/**
 * 主题感知的固定工具栏
 */
export interface ThemeAwareFloatingToolbarProps {
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  offset?: number;
}

export const ThemeAwareFloatingToolbar: React.FC<ThemeAwareFloatingToolbarProps> = ({
  children,
  position = 'bottom',
  offset = 24,
}) => {
  const themeManager4 = useThemeManager();
  const isDark = themeManager4.mode === 'dark';

  const getPositionStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'fixed',
      zIndex: 1000,
      backgroundColor: 'var(--colorBgContainer)',
      border: '1px solid var(--colorBorderSecondary)',
      borderRadius: '8px',
      padding: '12px 16px',
      boxShadow: isDark 
        ? '0 4px 16px rgba(0, 0, 0, 0.2)' 
        : '0 4px 16px rgba(0, 0, 0, 0.08)',
    };

    switch (position) {
      case 'top':
        return { ...base, top: offset, left: '50%', transform: 'translateX(-50%)' };
      case 'bottom':
        return { ...base, bottom: offset, left: '50%', transform: 'translateX(-50%)' };
      case 'left':
        return { ...base, left: offset, top: '50%', transform: 'translateY(-50%)' };
      case 'right':
        return { ...base, right: offset, top: '50%', transform: 'translateY(-50%)' };
      default:
        return base;
    }
  };

  return (
    <Affix>
      <div style={getPositionStyle()}>
        {children}
      </div>
    </Affix>
  );
};