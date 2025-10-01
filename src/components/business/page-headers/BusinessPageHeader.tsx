import React from 'react';
import { Row, Col, Typography, Space, Button, theme } from 'antd';

const { Title, Text } = Typography;

export interface BusinessPageHeaderProps {
  /** 页面标题 */
  title: string;
  /** 页面副标题/描述 */
  subtitle?: string;
  /** 页面图标 */
  icon?: React.ReactNode;
  /** 右侧操作按钮 */
  actions?: React.ReactNode[];
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 是否显示分割线 */
  bordered?: boolean;
}

/**
 * 商业化页面头部组件
 * 统一的页面标题样式，使用原生 Ant Design token
 */
export const BusinessPageHeader: React.FC<BusinessPageHeaderProps> = ({
  title,
  subtitle,
  icon,
  actions = [],
  style,
  bordered = true
}) => {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        padding: `${token.paddingLG}px 0`,
        borderBottom: bordered ? `1px solid ${token.colorBorderSecondary}` : 'none',
        background: token.colorBgContainer,
        borderRadius: token.borderRadius,
        marginBottom: token.marginLG,
        ...style
      }}
    >
      <Row justify="space-between" align="middle">
        <Col flex="auto">
          <Space 
            direction="vertical" 
            size={token.sizeXS}
          >
            <Space align="center" size={token.sizeMS}>
              {icon && (
                <div style={{ 
                  fontSize: token.fontSizeHeading2,
                  color: token.colorPrimary,
                  lineHeight: 1
                }}>
                  {icon}
                </div>
              )}
              <Title 
                level={2} 
                style={{ 
                  margin: 0,
                  color: token.colorText,
                  fontWeight: token.fontWeightStrong
                }}
              >
                {title}
              </Title>
            </Space>
            {subtitle && (
              <Text 
                type="secondary"
                style={{ 
                  fontSize: token.fontSize,
                  lineHeight: token.lineHeight
                }}
              >
                {subtitle}
              </Text>
            )}
          </Space>
        </Col>
        {actions.length > 0 && (
          <Col flex="none">
            <Space size={token.sizeMS}>
              {actions}
            </Space>
          </Col>
        )}
      </Row>
    </div>
  );
};