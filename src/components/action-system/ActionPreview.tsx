// src/components/action-system/ActionPreview.tsx
// module: action-system | layer: ui | role: 操作预览展示
// summary: 显示将要执行的操作预览信息

import React from 'react';
import { Alert, Space, Tag, Typography } from 'antd';
import { PlayCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { ActionType } from '../../types/action-types';
import { getActionConfig, formatActionDescription, validateActionParams } from '../../types/action-types';

const { Text } = Typography;

interface ActionPreviewProps {
  action: ActionType;
  elementInfo?: {
    text?: string;
    resourceId?: string;
    bounds?: string;
  };
  showValidation?: boolean;
}

export const ActionPreview: React.FC<ActionPreviewProps> = ({
  action,
  elementInfo,
  showValidation = true
}) => {
  const config = getActionConfig(action.type);
  const description = formatActionDescription(action);
  const validationError = showValidation ? validateActionParams(action) : null;

  return (
    <div className="action-preview">
      {/* 操作预览信息 */}
      <Alert
        type={validationError ? 'error' : 'info'}
        showIcon
        icon={validationError ? undefined : <PlayCircleOutlined />}
        message={
          <Space>
            <span style={{ color: config.color }}>{config.icon}</span>
            <Text strong>
              {validationError ? '参数错误' : '即将执行'}
            </Text>
          </Space>
        }
        description={
          <div>
            <div style={{ marginBottom: 4 }}>
              <Text>{validationError || description}</Text>
            </div>
            
            {/* 目标元素信息 */}
            {elementInfo && !validationError && (
              <div style={{ marginTop: 8 }}>
                <Space wrap size="small">
                  <Tag 
                    color="blue" 
                    icon={<InfoCircleOutlined />}
                    style={{ fontSize: 11 }}
                  >
                    目标元素
                  </Tag>
                  {elementInfo.text && (
                    <Text 
                      code 
                      style={{ 
                        fontSize: 11,
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'inline-block',
                        verticalAlign: 'top'
                      }}
                      title={elementInfo.text}
                    >
                      "{elementInfo.text}"
                    </Text>
                  )}
                  {elementInfo.resourceId && (
                    <Text 
                      type="secondary" 
                      style={{ fontSize: 11 }}
                    >
                      {elementInfo.resourceId.split('/').pop()}
                    </Text>
                  )}
                  {elementInfo.bounds && (
                    <Text 
                      type="secondary" 
                      style={{ fontSize: 11 }}
                    >
                      {elementInfo.bounds}
                    </Text>
                  )}
                </Space>
              </div>
            )}
          </div>
        }
        style={{
          borderColor: validationError ? undefined : config.color + '40',
          backgroundColor: validationError ? undefined : config.color + '08'
        }}
      />
    </div>
  );
};

export default ActionPreview;