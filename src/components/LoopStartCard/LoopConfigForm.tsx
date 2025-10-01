// 循环配置表单组件

import React from 'react';
import {
  InputNumber,
  Input,
  Space,
  Typography,
} from 'antd';
import type { LoopConfigFormProps } from './types';

const { Text } = Typography;
const { TextArea } = Input;

export const LoopConfigForm: React.FC<LoopConfigFormProps> = ({
  tempConfig,
  isEditing,
  onTempConfigChange,
}) => {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%', paddingTop: 8 }}>
      {/* 循环次数设置 */}
      <div>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>
          循环次数
        </Text>
        <InputNumber
          value={tempConfig.iterations}
          onChange={(value) =>
            onTempConfigChange({ iterations: value || 1 })
          }
          min={1}
          max={1000}
          placeholder="输入循环次数"
          style={{ width: '100%' }}
          disabled={!isEditing}
        />
      </div>

      {/* 循环描述 */}
      <div>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>
          循环描述
        </Text>
        <TextArea
          value={tempConfig.description || ''}
          onChange={(e) =>
            onTempConfigChange({ description: e.target.value })
          }
          placeholder="描述这个循环的作用..."
          rows={2}
          disabled={!isEditing}
          style={{ resize: 'none' }}
        />
      </div>

      {/* 循环条件（高级设置） */}
      <div>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>
          循环条件 <Text type="secondary">(可选)</Text>
        </Text>
        <Input
          value={tempConfig.condition || ''}
          onChange={(e) =>
            onTempConfigChange({ condition: e.target.value })
          }
          placeholder="例如：element_exists('.next-button')"
          disabled={!isEditing}
        />
        <Text type="secondary" style={{ fontSize: '12px' }}>
          留空则按次数循环，填写条件则按条件循环
        </Text>
      </div>

      {/* 循环统计信息 */}
      <div style={{ 
        backgroundColor: '#f0f9ff', 
        padding: 12, 
        borderRadius: 6, 
        border: '1px solid #e0f2fe' 
      }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          循环ID: {tempConfig.loopId}
        </Text>
        <br />
        <Text type="secondary" style={{ fontSize: '12px' }}>
          状态: {tempConfig.enabled ? '已启用' : '已禁用'}
        </Text>
      </div>
    </Space>
  );
};