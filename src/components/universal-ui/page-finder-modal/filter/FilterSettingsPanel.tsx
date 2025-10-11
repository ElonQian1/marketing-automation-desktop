// src/components/universal-ui/page-finder-modal/filter/FilterSettingsPanel.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React, { useEffect } from 'react';
import { Drawer, Form, Input, InputNumber, Switch, Alert, Space, Button } from 'antd';
import type { VisualFilterConfig } from '../../types';

export interface FilterSettingsPanelProps {
  open: boolean;
  config: VisualFilterConfig;
  onChange: (next: VisualFilterConfig) => void;
  onClose: () => void;
  onReset?: () => void;
}

export const FilterSettingsPanel: React.FC<FilterSettingsPanelProps> = ({
  open,
  config,
  onChange,
  onClose,
  onReset,
}) => {
  const [form] = Form.useForm<VisualFilterConfig>();

  useEffect(() => {
    // 仅在抽屉打开且 Form 已挂载后再同步表单值，避免 AntD 警告：
    // "Instance created by useForm is not connected to any Form element"
    if (!open || !config) return;
    const t = setTimeout(() => {
      try {
        form.setFieldsValue(config as any);
      } catch {}
    }, 0);
    return () => clearTimeout(t);
  }, [open, config, form]);

  return (
    <Drawer
      title="可视化过滤设置"
      open={open}
      onClose={onClose}
      width={420}
      destroyOnClose
      className="light-theme-force"
      extra={
        <Space>
          {onReset && <Button onClick={onReset}>重置规则</Button>}
          <Button type="primary" onClick={onClose}>完成</Button>
        </Space>
      }
    >
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
    </Drawer>
  );
};

export default FilterSettingsPanel;
