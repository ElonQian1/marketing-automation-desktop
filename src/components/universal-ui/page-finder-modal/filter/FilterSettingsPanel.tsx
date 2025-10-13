// src/components/universal-ui/page-finder-modal/filter/FilterSettingsPanel.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React, { useEffect, useMemo } from 'react';
import { Drawer, Form, Input, InputNumber, Switch, Alert, Space, Button } from 'antd';
import type { VisualFilterConfig } from '../../types';

export interface FilterSettingsPanelProps {
  open: boolean;
  config: VisualFilterConfig;
  onChange: (next: VisualFilterConfig) => void;
  onClose: () => void;
  onReset?: () => void;
}

interface FilterSettingsPanelContentProps {
  config: VisualFilterConfig;
  onChange: (next: VisualFilterConfig) => void;
}

const FilterSettingsPanelContent: React.FC<FilterSettingsPanelContentProps> = ({
  config,
  onChange,
}) => {
  const [form] = Form.useForm<VisualFilterConfig>();

  useEffect(() => {
    // 设置表单初始值
    if (config) {
      try {
        form.setFieldsValue(config);
      } catch (error) {
        console.warn('设置表单值失败:', error);
      }
    }
  }, [config, form]);

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={config}
      onValuesChange={(_, all) => onChange(all as VisualFilterConfig)}
    >
      <Form.Item label="仅显示可点击元素" name="onlyClickable" valuePropName="checked">
        <Switch />
      </Form.Item>
      <Form.Item label="将类名包含 'Button' 视为可点击" name="treatButtonAsClickable" valuePropName="checked">
        <Switch />
      </Form.Item>
      <Form.Item label="需要存在 文本 或 描述 (text/content-desc)" name="requireTextOrDesc" valuePropName="checked">
        <Switch />
      </Form.Item>
      <Form.Item label="最小宽度(px)" name="minWidth">
        <InputNumber min={0} max={2000} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item label="最小高度(px)" name="minHeight">
        <InputNumber min={0} max={2000} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item label="类名包含（逗号分隔）">
        <Input
          value={(config?.includeClasses ?? []).join(',')}
          onChange={(e) => {
            const list = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
            onChange({ ...config, includeClasses: list } as VisualFilterConfig);
          }}
          placeholder="如：Button, TextView"
        />
      </Form.Item>
      <Form.Item label="类名排除（逗号分隔）">
        <Input
          value={(config?.excludeClasses ?? []).join(',')}
          onChange={(e) => {
            const list = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
            onChange({ ...config, excludeClasses: list } as VisualFilterConfig);
          }}
          placeholder="如：ImageView, RecyclerView"
        />
      </Form.Item>
      <Alert type="info" showIcon message="提示" description="这些规则仅影响前端可视化显示，不会修改后端解析结果。" />
    </Form>
  );
};

export const FilterSettingsPanel: React.FC<FilterSettingsPanelProps> = ({
  open,
  config,
  onChange,
  onClose,
  onReset,
}) => {
  // 只有在 Drawer 打开时才渲染内容，避免 useForm 警告
  const drawerContent = useMemo(() => {
    if (!open) return null;
    return (
      <FilterSettingsPanelContent
        config={config}
        onChange={onChange}
      />
    );
  }, [open, config, onChange, onReset]);

  return (
    <Drawer
      title="可视化过滤设置"
      open={open}
      onClose={onClose}
      width={420}
      destroyOnHidden
      className="light-theme-force"
      extra={
        <Space>
          {onReset && <Button onClick={onReset}>重置规则</Button>}
          <Button type="primary" onClick={onClose}>完成</Button>
        </Space>
      }
    >
      {drawerContent}
    </Drawer>
  );
};

export default FilterSettingsPanel;
