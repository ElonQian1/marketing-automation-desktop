/**
 * 主题配置面板组件
 * 提供主题自定义和高级配置功能
 */

import React, { useState, useCallback } from 'react';
import { 
  Card, 
  Space, 
  Button, 
  Switch, 
  Slider, 
  ColorPicker, 
  Select, 
  InputNumber,
  Divider,
  Typography,
  Row,
  Col,
  Collapse,
  message,
  Tooltip,
} from 'antd';
import { 
  ReloadOutlined, 
  SaveOutlined, 
  SettingOutlined,
  InfoCircleOutlined,
  DownloadOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useTheme, useThemeState, useThemeActions } from '../providers/EnhancedThemeProvider';
import { useThemeUtils } from '../hooks/useThemeUtils';
import type { AppThemeConfig } from '../types';
import type { Color } from 'antd/es/color-picker';
import type { ThemeMode } from '../types';

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { Option } = Select;

/**
 * 主题配置面板属性
 */
export interface ThemeConfigPanelProps {
  /** 是否显示高级选项 */
  showAdvanced?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 配置变更回调 */
  onChange?: (config: any) => void;
}

/**
 * 主题配置面板组件
 */
export const ThemeConfigPanel: React.FC<ThemeConfigPanelProps> = ({
  showAdvanced = true,
  className,
  style,
  onChange,
}) => {
  const { config } = useThemeState();
  const { updateConfig, resetConfig, setMode } = useThemeActions();
  const { getTokens, generateAntdConfig } = useThemeUtils();
  
  // 本地状态
  type LocalThemeConfig = AppThemeConfig & { animation?: { enabled?: boolean; duration?: number } };
  const [localConfig, setLocalConfig] = useState<LocalThemeConfig>(config as LocalThemeConfig);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 更新本地配置
  const updateLocalConfig = useCallback((updates: any) => {
    const newConfig = { ...localConfig, ...updates };
    setLocalConfig(newConfig);
    setHasUnsavedChanges(true);
    onChange?.(newConfig);
  }, [localConfig, onChange]);

  // 应用配置
  const applyConfig = useCallback(() => {
    updateConfig(localConfig);
    setHasUnsavedChanges(false);
    message.success('主题配置已应用');
  }, [localConfig, updateConfig]);

  // 重置配置
  const handleReset = useCallback(() => {
    resetConfig();
    setLocalConfig(config);
    setHasUnsavedChanges(false);
    message.success('主题配置已重置');
  }, [resetConfig, config]);

  // 主题模式切换
  const handleModeChange = useCallback((mode: ThemeMode) => {
    setMode(mode);
    const newConfig = generateAntdConfig(mode);
    setLocalConfig(newConfig);
    setHasUnsavedChanges(false);
  }, [setMode, generateAntdConfig]);

  // 颜色变更处理
  const handleColorChange = useCallback((key: string, color: Color) => {
    const hexColor = color.toHexString();
    updateLocalConfig({
      token: {
        ...localConfig.token,
        [key]: hexColor,
      },
    });
  }, [localConfig, updateLocalConfig]);

  // 导出配置
  const exportConfig = useCallback(() => {
    const dataStr = JSON.stringify(localConfig, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `theme-config-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    message.success('主题配置已导出');
  }, [localConfig]);

  // 导入配置
  const importConfig = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const importedConfig = JSON.parse(event.target?.result as string);
            setLocalConfig(importedConfig);
            setHasUnsavedChanges(true);
            message.success('主题配置已导入');
          } catch {
            message.error('配置文件格式错误');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, []);

  return (
    <Card
      className={`theme-config-panel ${className || ''}`}
      style={style}
      title={
        <Space>
          <SettingOutlined />
          <span>主题配置</span>
        </Space>
      }
      extra={
        <Space>
          {hasUnsavedChanges && (
            <Text type="warning" style={{ fontSize: 12 }}>
              有未保存的更改
            </Text>
          )}
          <Button
            type="primary"
            size="small"
            icon={<SaveOutlined />}
            onClick={applyConfig}
            disabled={!hasUnsavedChanges}
          >
            应用
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 基础设置 */}
        <Card size="small" title="基础设置">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Row gutter={16} align="middle">
              <Col span={8}>
                <Text>主题模式：</Text>
              </Col>
              <Col span={16}>
                <Select
                  value={localConfig.mode}
                  onChange={handleModeChange}
                  style={{ width: '100%' }}
                >
                  <Option value="light">亮色模式</Option>
                  <Option value="dark">暗色模式</Option>
                </Select>
              </Col>
            </Row>
          </Space>
        </Card>

        {/* 颜色配置 */}
        <Card size="small" title="颜色配置">
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Space>
                <Text>主色调：</Text>
                <ColorPicker
                  value={localConfig.token?.colorPrimary}
                  onChange={(color) => handleColorChange('colorPrimary', color)}
                  showText
                />
              </Space>
            </Col>
            <Col span={12}>
              <Space>
                <Text>成功色：</Text>
                <ColorPicker
                  value={localConfig.token?.colorSuccess}
                  onChange={(color) => handleColorChange('colorSuccess', color)}
                  showText
                />
              </Space>
            </Col>
            <Col span={12}>
              <Space>
                <Text>警告色：</Text>
                <ColorPicker
                  value={localConfig.token?.colorWarning}
                  onChange={(color) => handleColorChange('colorWarning', color)}
                  showText
                />
              </Space>
            </Col>
            <Col span={12}>
              <Space>
                <Text>错误色：</Text>
                <ColorPicker
                  value={localConfig.token?.colorError}
                  onChange={(color) => handleColorChange('colorError', color)}
                  showText
                />
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 高级配置 */}
        {showAdvanced && (
          <Collapse>
            <Panel header="高级配置" key="advanced">
              <Space direction="vertical" style={{ width: '100%' }}>
                {/* 尺寸配置 */}
                <Card size="small" title="尺寸配置">
                  <Row gutter={[16, 16]} align="middle">
                    <Col span={8}>
                      <Text>控件高度：</Text>
                    </Col>
                    <Col span={16}>
                      <Slider
                        min={28}
                        max={48}
                        value={localConfig.token?.controlHeight || 32}
                        onChange={(value) => updateLocalConfig({
                          token: { ...localConfig.token, controlHeight: value }
                        })}
                        marks={{ 28: '28px', 32: '32px', 36: '36px', 40: '40px', 48: '48px' }}
                      />
                    </Col>
                    
                    <Col span={8}>
                      <Text>圆角大小：</Text>
                    </Col>
                    <Col span={16}>
                      <Slider
                        min={0}
                        max={16}
                        value={localConfig.token?.borderRadius || 6}
                        onChange={(value) => updateLocalConfig({
                          token: { ...localConfig.token, borderRadius: value }
                        })}
                        marks={{ 0: '0px', 4: '4px', 8: '8px', 12: '12px', 16: '16px' }}
                      />
                    </Col>

                    <Col span={8}>
                      <Text>字体大小：</Text>
                    </Col>
                    <Col span={16}>
                      <InputNumber
                        min={12}
                        max={18}
                        value={localConfig.token?.fontSize || 14}
                        onChange={(value) => updateLocalConfig({
                          token: { ...localConfig.token, fontSize: value }
                        })}
                        addonAfter="px"
                        style={{ width: '100%' }}
                      />
                    </Col>
                  </Row>
                </Card>

                {/* 动画配置 */}
                <Card size="small" title="动画配置">
                  <Row gutter={[16, 16]} align="middle">
                    <Col span={8}>
                      <Text>启用动画：</Text>
                    </Col>
                    <Col span={16}>
                      <Switch
                        checked={(localConfig as LocalThemeConfig).animation?.enabled}
                        onChange={(checked) => updateLocalConfig({
                          animation: { ...((localConfig as LocalThemeConfig).animation || {}), enabled: checked }
                        })}
                      />
                    </Col>

                    <Col span={8}>
                      <Text>动画时长：</Text>
                    </Col>
                    <Col span={16}>
                      <Slider
                        min={100}
                        max={1000}
                        value={(localConfig as LocalThemeConfig).animation?.duration || 200}
                        onChange={(value) => updateLocalConfig({
                          animation: { ...((localConfig as LocalThemeConfig).animation || {}), duration: value as number }
                        })}
                        marks={{ 100: '100ms', 200: '200ms', 500: '500ms', 1000: '1000ms' }}
                        disabled={!((localConfig as LocalThemeConfig).animation?.enabled)}
                      />
                    </Col>
                  </Row>
                </Card>
              </Space>
            </Panel>
          </Collapse>
        )}

        {/* 操作按钮 */}
        <Divider />
        <Row gutter={16}>
          <Col span={6}>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleReset}
              block
            >
              重置
            </Button>
          </Col>
          <Col span={6}>
            <Button 
              icon={<DownloadOutlined />} 
              onClick={exportConfig}
              block
            >
              导出
            </Button>
          </Col>
          <Col span={6}>
            <Button 
              icon={<UploadOutlined />} 
              onClick={importConfig}
              block
            >
              导入
            </Button>
          </Col>
          <Col span={6}>
            <Tooltip title="获取更多主题配置信息">
              <Button 
                icon={<InfoCircleOutlined />} 
                block
                onClick={() => {
                  console.log('当前主题配置:', localConfig);
                  message.info('配置信息已输出到控制台');
                }}
              >
                调试
              </Button>
            </Tooltip>
          </Col>
        </Row>
      </Space>
    </Card>
  );
};