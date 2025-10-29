// src/components/text-matching/components/TextMatchingInlineControl.tsx
// module: text-matching | layer: ui | role: 内联控制组件
// summary: 可嵌入到步骤卡片中的小型文本匹配模式控制组件

import React, { useState } from 'react';
import {
  Space,
  Tag,
  Tooltip,
  Button,
  Dropdown,
  Switch
} from 'antd';
import {
  SettingOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

import { useTextMatchingConfig } from '../TextMatchingConfigPanel';
import type { TextMatchingConfig, TextMatchingMode } from '../TextMatchingConfigPanel';

export interface TextMatchingInlineControlProps {
  /** 当前步骤的配置，如果不提供则使用全局配置 */
  stepConfig?: Partial<TextMatchingConfig>;
  /** 配置变化回调 */
  onChange?: (config: TextMatchingConfig) => void;
  /** 是否为紧凑模式 */
  compact?: boolean;
  /** 自定义样式类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

export const TextMatchingInlineControl: React.FC<TextMatchingInlineControlProps> = ({
  stepConfig,
  onChange,
  compact = false,
  className,
  style
}) => {
  const { config: globalConfig, updateConfig: updateGlobalConfig } = useTextMatchingConfig();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // 合并配置：步骤级配置优先于全局配置
  const currentConfig = { ...globalConfig, ...stepConfig };

  const handleConfigChange = (newConfig: TextMatchingConfig) => {
    if (onChange) {
      onChange(newConfig);
    } else {
      updateGlobalConfig(newConfig);
    }
  };

  const handleModeChange = (mode: TextMatchingMode) => {
    const newConfig: TextMatchingConfig = {
      ...currentConfig,
      mode,
      // 绝对匹配模式下自动禁用智能功能
      antonymCheckEnabled: mode === 'exact' ? false : currentConfig.antonymCheckEnabled,
      semanticAnalysisEnabled: mode === 'exact' ? false : currentConfig.semanticAnalysisEnabled
    };
    handleConfigChange(newConfig);
  };

  const handleFeatureToggle = (feature: keyof TextMatchingConfig, value: boolean) => {
    handleConfigChange({
      ...currentConfig,
      [feature]: value
    });
  };

  // 获取当前模式的显示信息
  const getModeInfo = () => {
    if (currentConfig.mode === 'exact') {
      return {
        label: '绝对匹配',
        icon: <SafetyOutlined />,
        color: 'orange',
        description: '精确匹配，高可靠性'
      };
    } else {
      return {
        label: '智能匹配',
        icon: <ThunderboltOutlined />,
        color: 'blue',
        description: '部分匹配，支持反义词检测'
      };
    }
  };

  const modeInfo = getModeInfo();

  // 下拉菜单项
  const menuItems: MenuProps['items'] = [
    {
      key: 'mode-exact',
      label: (
        <Space>
          <SafetyOutlined style={{ color: '#f59e0b' }} />
          <span>绝对匹配模式</span>
          {currentConfig.mode === 'exact' && <CheckCircleOutlined style={{ color: '#10b981' }} />}
        </Space>
      ),
      onClick: () => handleModeChange('exact')
    },
    {
      key: 'mode-partial',
      label: (
        <Space>
          <ThunderboltOutlined style={{ color: '#3b82f6' }} />
          <span>智能匹配模式</span>
          {currentConfig.mode === 'partial' && <CheckCircleOutlined style={{ color: '#10b981' }} />}
        </Space>
      ),
      onClick: () => handleModeChange('partial')
    },
    {
      type: 'divider'
    },
    {
      key: 'antonym-check',
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '200px' }}>
          <span>反义词检测</span>
          <Switch
            size="small"
            checked={currentConfig.antonymCheckEnabled}
            disabled={currentConfig.mode === 'exact'}
            onChange={(checked) => handleFeatureToggle('antonymCheckEnabled', checked)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ),
      onClick: (e) => e.domEvent.stopPropagation()
    },
    {
      key: 'semantic-analysis',
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '200px' }}>
          <span>语义分析</span>
          <Switch
            size="small"
            checked={currentConfig.semanticAnalysisEnabled}
            disabled={currentConfig.mode === 'exact'}
            onChange={(checked) => handleFeatureToggle('semanticAnalysisEnabled', checked)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ),
      onClick: (e) => e.domEvent.stopPropagation()
    }
  ];

  if (compact) {
    // 紧凑模式：只显示当前模式标签
    return (
      <Dropdown
        menu={{ items: menuItems }}
        trigger={['click']}
        open={dropdownOpen}
        onOpenChange={setDropdownOpen}
        placement="bottomRight"
      >
        <Tag
          className={className}
          style={{
            cursor: 'pointer',
            userSelect: 'none',
            ...style
          }}
          color={modeInfo.color}
          icon={modeInfo.icon}
        >
          {modeInfo.label}
        </Tag>
      </Dropdown>
    );
  }

  // 完整模式：显示详细状态
  return (
    <div 
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        ...style
      }}
    >
      <Dropdown
        menu={{ items: menuItems }}
        trigger={['click']}
        open={dropdownOpen}
        onOpenChange={setDropdownOpen}
        placement="bottomRight"
      >
        <Button
          size="small"
          type="text"
          icon={<SettingOutlined />}
          style={{
            border: '1px solid var(--border-primary, #e5e7eb)',
            background: 'var(--bg-elevated, #ffffff)',
            color: 'var(--text-primary, #1f2937)',
            fontSize: '12px',
            padding: '2px 8px',
            height: '24px'
          }}
        >
          文本匹配
        </Button>
      </Dropdown>

      <Space size={4}>
        <Tooltip title={modeInfo.description}>
          <Tag
            color={modeInfo.color}
            icon={modeInfo.icon}
            style={{ margin: 0, fontSize: '11px' }}
          >
            {modeInfo.label}
          </Tag>
        </Tooltip>

        {currentConfig.mode === 'partial' && currentConfig.antonymCheckEnabled && (
          <Tooltip title="反义词检测已启用">
            <Tag color="green" style={{ margin: 0, fontSize: '11px' }}>
              反义词✓
            </Tag>
          </Tooltip>
        )}

        {currentConfig.mode === 'partial' && currentConfig.semanticAnalysisEnabled && (
          <Tooltip title="语义分析已启用">
            <Tag color="purple" style={{ margin: 0, fontSize: '11px' }}>
              语义✓
            </Tag>
          </Tooltip>
        )}

        {currentConfig.mode === 'exact' && (
          <Tooltip title="绝对匹配模式下智能功能已禁用">
            <WarningOutlined style={{ color: '#f59e0b', fontSize: '12px' }} />
          </Tooltip>
        )}
      </Space>
    </div>
  );
};