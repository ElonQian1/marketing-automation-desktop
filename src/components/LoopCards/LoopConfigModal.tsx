// src/components/LoopCards/LoopConfigModal.tsx
// module: ui | layer: ui | role: component
// summary: 循环配置模态框 - 开始卡片和结束卡片共享

import React, { useState, useEffect } from 'react';
import { Modal, Space, InputNumber, Switch, Input, Alert, Typography } from 'antd';
import type { LoopConfig } from '../../types/loopScript';

const { Text } = Typography;

export interface LoopConfigModalProps {
  open: boolean;
  loopConfig?: LoopConfig;
  onSave: (config: LoopConfig) => void;
  onCancel: () => void;
}

export const LoopConfigModal: React.FC<LoopConfigModalProps> = ({
  open,
  loopConfig,
  onSave,
  onCancel,
}) => {
  const [tempConfig, setTempConfig] = useState({
    loopId: loopConfig?.loopId || '',
    name: loopConfig?.name || '新循环',
    iterations: loopConfig?.iterations || 1,
    isInfinite: loopConfig?.isInfinite || false,
    condition: loopConfig?.condition || '',
    enabled: loopConfig?.enabled ?? true,
  });

  // 当 loopConfig 变化时更新临时配置
  useEffect(() => {
    if (loopConfig) {
      setTempConfig({
        loopId: loopConfig.loopId,
        name: loopConfig.name,
        iterations: loopConfig.iterations,
        isInfinite: loopConfig.isInfinite || false,
        condition: loopConfig.condition || '',
        enabled: loopConfig.enabled,
      });
    }
  }, [loopConfig]);

  const handleSave = () => {
    onSave({
      ...tempConfig,
      iterations: tempConfig.isInfinite ? -1 : tempConfig.iterations,
    } as LoopConfig);
  };

  const handleCancel = () => {
    // 恢复原始值
    if (loopConfig) {
      setTempConfig({
        loopId: loopConfig.loopId,
        name: loopConfig.name,
        iterations: loopConfig.iterations,
        isInfinite: loopConfig.isInfinite || false,
        condition: loopConfig.condition || '',
        enabled: loopConfig.enabled,
      });
    }
    onCancel();
  };

  return (
    <Modal
      title="循环配置"
      open={open}
      onOk={handleSave}
      onCancel={handleCancel}
      okText="保存"
      cancelText="取消"
      width={500}
      className="light-theme-force"
    >
      <Space direction="vertical" size="large" style={{ width: '100%', padding: '20px 0' }}>
        {/* 循环名称 */}
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>循环名称</Text>
          <Input
            placeholder="输入循环名称"
            value={tempConfig.name}
            onChange={(e) => setTempConfig({ ...tempConfig, name: e.target.value })}
          />
        </div>

        {/* 无限循环开关 */}
        <div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: 12 
          }}>
            <Space>
              <Text strong>无限循环模式</Text>
              <span style={{ fontSize: 18 }}>∞</span>
            </Space>
            <Switch
              checked={tempConfig.isInfinite}
              onChange={(checked) => setTempConfig({ ...tempConfig, isInfinite: checked })}
              checkedChildren="开启"
              unCheckedChildren="关闭"
            />
          </div>
          
          {tempConfig.isInfinite && (
            <Alert
              type="warning"
              message="⚠️ 警告：无限循环将持续执行直到手动停止，请谨慎使用！"
              showIcon
              style={{ fontSize: 12 }}
            />
          )}
        </div>

        {/* 循环次数 */}
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>循环执行次数</Text>
          <Space style={{ width: '100%' }}>
            <InputNumber
              min={1}
              max={999}
              value={tempConfig.iterations}
              onChange={(val) => setTempConfig({ ...tempConfig, iterations: val || 1 })}
              disabled={tempConfig.isInfinite}
              style={{ width: 120 }}
              addonAfter="次"
            />
            <Text type="secondary">
              {tempConfig.isInfinite 
                ? '已启用无限循环 ∞' 
                : `执行 ${tempConfig.iterations} 次后结束`
              }
            </Text>
          </Space>
        </div>

        {/* 循环条件（可选） */}
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            循环条件（可选）
            <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
              高级功能
            </Text>
          </Text>
          <Input
            placeholder="例如：currentPage < totalPages"
            value={tempConfig.condition}
            onChange={(e) => setTempConfig({ ...tempConfig, condition: e.target.value })}
            disabled={tempConfig.isInfinite}
          />
        </div>

        {/* 说明提示 */}
        <Alert
          type="info"
          message={
            tempConfig.isInfinite 
              ? '💡 无限循环模式下，循环体内的步骤将不断重复执行。'
              : `💡 达到设定次数后，将跳出循环继续执行后续步骤。`
          }
          showIcon
          style={{ fontSize: 12 }}
        />
      </Space>
    </Modal>
  );
};

export default LoopConfigModal;
