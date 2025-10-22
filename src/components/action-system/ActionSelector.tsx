// src/components/action-system/ActionSelector.tsx
// module: action-system | layer: ui | role: 操作类型选择器
// summary: 操作类型下拉选择器组件

import React, { useState } from 'react';
import { Button, Dropdown, Menu, Space, Tag } from 'antd';
import { DownOutlined, CheckOutlined } from '@ant-design/icons';
import type { ActionTypeId, ActionType } from '../../types/action-types';
import { ACTION_CONFIGS, getActionConfig } from '../../types/action-types';

interface ActionSelectorProps {
  currentAction: ActionType;
  onChange: (action: ActionType) => void;
  disabled?: boolean;
  size?: 'small' | 'middle' | 'large';
  showIcon?: boolean;
  showDescription?: boolean;
}

export const ActionSelector: React.FC<ActionSelectorProps> = ({
  currentAction,
  onChange,
  disabled = false,
  size = 'middle',
  showIcon = true,
  showDescription = false
}) => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const currentConfig = getActionConfig(currentAction.type);

  const handleMenuClick = (actionType: ActionTypeId) => {
    const newAction: ActionType = {
      type: actionType,
      params: ACTION_CONFIGS[actionType].defaultParams,
    };
    onChange(newAction);
    setDropdownVisible(false);
  };

  const menu = (
    <Menu className="light-theme-force action-selector-menu">
      {Object.entries(ACTION_CONFIGS).map(([key, config]) => (
        <Menu.Item
          key={key}
          onClick={() => handleMenuClick(key as ActionTypeId)}
          className={`action-menu-item ${key === currentAction.type ? 'selected' : ''}`}
        >
          <Space size="small" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <span className="action-icon">{config.icon}</span>
              <div>
                <div 
                  className="action-label"
                  style={{ 
                    fontWeight: key === currentAction.type ? 'bold' : 'normal',
                    color: key === currentAction.type ? config.color : undefined
                  }}
                >
                  {config.label}
                </div>
                {showDescription && (
                  <div className="action-description">
                    {config.description}
                  </div>
                )}
              </div>
            </Space>
            {key === currentAction.type && (
              <CheckOutlined style={{ color: config.color }} />
            )}
          </Space>
        </Menu.Item>
      ))}
    </Menu>
  );

  return (
    <div className="action-selector">
      <Dropdown
        overlay={menu}
        trigger={['click']}
        placement="bottomLeft"
        open={dropdownVisible}
        onOpenChange={setDropdownVisible}
        disabled={disabled}
      >
        <Button 
          className="action-selector-button light-theme-force"
          size={size}
          disabled={disabled}
          style={{
            borderColor: currentConfig.color,
            borderStyle: 'dashed',
            color: currentConfig.color,
            backgroundColor: `${currentConfig.color}08`,
          }}
        >
          <Space>
            {showIcon && <span>{currentConfig.icon}</span>}
            <span>{currentConfig.label}</span>
            <DownOutlined style={{ fontSize: 12 }} />
          </Space>
        </Button>
      </Dropdown>
    </div>
  );
};

export default ActionSelector;