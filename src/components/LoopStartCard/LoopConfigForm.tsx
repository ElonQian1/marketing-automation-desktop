// src/components/LoopStartCard/LoopConfigForm.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

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
  // 🎯 简化循环卡片：只显示关键信息，不显示复杂表单
  // 当不在编辑模式时，显示紧凑的信息摘要
  if (!isEditing) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px',
        padding: '8px 0',
        fontSize: '13px',
        color: '#0c4a6e' // 深蓝色文字，匹配循环卡片主题
      }}>
        <span>🔄 循环类型: for</span>
        <span>次数: {tempConfig.iterations || 1}</span>
        {tempConfig.condition && (
          <span>条件: {tempConfig.condition.length > 20 ? tempConfig.condition.slice(0, 20) + '...' : tempConfig.condition}</span>
        )}
        <span style={{ color: '#059669' }}>✓ 已启用</span>
      </div>
    );
  }

  // 编辑模式时显示完整表单（但布局更紧凑）
  return (
    <Space direction="vertical" size="small" style={{ width: '100%', paddingTop: 8 }}>
      {/* 循环次数设置 - 紧凑布局 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Text strong style={{ minWidth: '60px', fontSize: '12px' }}>次数:</Text>
        <InputNumber
          value={tempConfig.iterations}
          onChange={(value) =>
            onTempConfigChange({ iterations: value || 1 })
          }
          min={1}
          max={1000}
          size="small"
          style={{ width: '80px' }}
        />
      </div>

      {/* 循环条件 - 紧凑布局 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Text strong style={{ minWidth: '60px', fontSize: '12px' }}>条件:</Text>
        <Input
          value={tempConfig.condition || ''}
          onChange={(e) =>
            onTempConfigChange({ condition: e.target.value })
          }
          placeholder="可选条件"
          size="small"
          style={{ flex: 1 }}
        />
      </div>

      {/* 循环描述 - 单行输入 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Text strong style={{ minWidth: '60px', fontSize: '12px' }}>描述:</Text>
        <Input
          value={tempConfig.description || ''}
          onChange={(e) =>
            onTempConfigChange({ description: e.target.value })
          }
          placeholder="循环描述"
          size="small"
          style={{ flex: 1 }}
        />
      </div>
    </Space>
  );
};