import React from 'react';
import { Space, Button, Divider, theme } from 'antd';
import { SettingOutlined, EyeOutlined } from '@ant-design/icons';
import type { ActionButtonsSectionProps } from '../types';

/**
 * 操作按钮部分
 * 包含导航模态框、页面分析器等操作按钮
 */
export const ActionButtonsSection: React.FC<ActionButtonsSectionProps> = ({
  onShowNavigationModal,
  onShowPageAnalyzer,
}) => {
  const { token } = theme.useToken();

  return (
    <>
      <Divider style={{ margin: `${token.marginSM}px 0` }} />
      
      <Space 
        direction="vertical" 
        style={{ width: '100%' }}
        size={token.marginXS}
      >
        <Space wrap>
          <Button
            icon={<SettingOutlined />}
            onClick={onShowNavigationModal}
            size="small"
          >
            智能导航
          </Button>
          
          <Button
            icon={<EyeOutlined />}
            onClick={onShowPageAnalyzer}
            size="small"
          >
            页面分析器
          </Button>
        </Space>
      </Space>
    </>
  );
};