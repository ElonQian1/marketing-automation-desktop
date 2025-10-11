// src/components/LoopEndCardNative.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React, { useState } from 'react';
import { Card, Typography, Space, Button, Tag, Modal, InputNumber, Switch } from 'antd';
import { 
  CheckCircleOutlined, 
  DragOutlined, 
  ReloadOutlined, 
  DeleteOutlined,
  SettingOutlined 
} from '@ant-design/icons';

const { Text } = Typography;

interface LoopEndCardNativeProps {
  step: any;
  loopConfig?: any;
  isDragging?: boolean;
  onDeleteLoop: (loopId: string) => void;
  onUpdateStepParameters?: (stepId: string, parameters: any) => void;
}

/**
 * 循环结束卡片 - 原生 Ant Design 版本
 * 移除所有 Tailwind CSS 类名，使用原生 Ant Design 5 样式
 */
export const LoopEndCardNative: React.FC<LoopEndCardNativeProps> = ({
  step,
  loopConfig,
  isDragging = false,
  onDeleteLoop,
  onUpdateStepParameters,
}) => {
  const [isLoopConfigVisible, setIsLoopConfigVisible] = useState(false);
  const [loopCount, setLoopCount] = useState((step.parameters?.loop_count as number) || 3);
  const [isInfiniteLoop, setIsInfiniteLoop] = useState((step.parameters?.is_infinite_loop as boolean) || false);

  const handleDeleteLoop = () => {
    if (loopConfig) {
      onDeleteLoop(loopConfig.loopId);
    }
  };

  const handleSaveLoopConfig = () => {
    if (onUpdateStepParameters) {
      const parameters = {
        ...step.parameters,
        loop_count: isInfiniteLoop ? -1 : loopCount,
        is_infinite_loop: isInfiniteLoop
      };
      onUpdateStepParameters(step.id, parameters);
    }
    setIsLoopConfigVisible(false);
  };

  const cardStyle = {
    border: '2px solid #1677ff',
    backgroundColor: '#f0f9ff',
    opacity: isDragging ? 0.9 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    transform: isDragging ? 'scale(1.02)' : 'scale(1)',
    transition: 'all 0.3s ease',
    boxShadow: isDragging 
      ? '0 8px 24px rgba(22, 119, 255, 0.3)' 
      : '0 2px 8px rgba(0, 0, 0, 0.1)',
  };

  const headerStyle = {
    backgroundColor: '#e6f4ff',
    margin: -12,
    padding: 16,
    borderRadius: '6px 6px 0 0',
    borderBottom: '1px solid #91caff',
  };

  return (
    <div style={{ width: '100%', touchAction: 'none' }}>
      <Card
        size="small"
        style={cardStyle}
        title={
          <div style={headerStyle}>
            <Space size="middle" style={{ width: '100%', justifyContent: 'space-between' }}>
              <Space>
                <div style={{ 
                  padding: 8, 
                  backgroundColor: 'rgba(22, 119, 255, 0.1)', 
                  borderRadius: 6,
                  cursor: 'grab'
                }}>
                  <DragOutlined style={{ color: '#1677ff', fontSize: 16 }} />
                </div>
                
                <div style={{ 
                  padding: 6, 
                  backgroundColor: '#1677ff', 
                  borderRadius: '50%',
                  color: 'white'
                }}>
                  <CheckCircleOutlined style={{ fontSize: 14 }} />
                </div>
                
                <Text strong style={{ color: '#1677ff', fontSize: 16 }}>
                  🏁 循环结束
                </Text>
                
                <Tag color="blue" style={{ fontWeight: 500 }}>
                  {loopConfig?.name || '未命名循环'}
                </Tag>
                
                {!step.enabled && (
                  <Tag color="default">
                    已禁用
                  </Tag>
                )}
              </Space>
              
              <Space size="small">
                <Button
                  type="text"
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLoopConfigVisible(true);
                  }}
                  style={{ borderColor: '#1677ff' }}
                >
                  {isInfiniteLoop ? '∞' : `${loopCount}次`}
                </Button>
                
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  danger
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteLoop();
                  }}
                >
                  删除循环
                </Button>
              </Space>
            </Space>
          </div>
        }
      >
        <div style={{ padding: 8 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text type="secondary">
              循环区块结束，将根据配置的次数重复执行循环内的所有步骤
            </Text>
            
            <Space>
              <Text type="secondary" style={{ fontSize: 12 }}>
                当前配置:
              </Text>
              <Tag color={isInfiniteLoop ? 'orange' : 'blue'}>
                {isInfiniteLoop ? '无限循环' : `重复 ${loopCount} 次`}
              </Tag>
            </Space>
          </Space>
        </div>
      </Card>

      {/* 循环配置模态框 */}
      <Modal
        title={
          <Space>
            <SettingOutlined />
            <span>循环配置</span>
          </Space>
        }
        open={isLoopConfigVisible}
        onOk={handleSaveLoopConfig}
        onCancel={() => setIsLoopConfigVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              循环模式
            </Text>
            <Switch
              checked={isInfiniteLoop}
              onChange={setIsInfiniteLoop}
              checkedChildren="无限循环"
              unCheckedChildren="固定次数"
            />
          </div>
          
          {!isInfiniteLoop && (
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                循环次数
              </Text>
              <InputNumber
                min={1}
                max={1000}
                value={loopCount}
                onChange={(value) => setLoopCount(value || 1)}
                style={{ width: '100%' }}
                placeholder="请输入循环次数"
              />
            </div>
          )}
          
          <Text type="secondary" style={{ fontSize: 12 }}>
            {isInfiniteLoop 
              ? '⚠️ 无限循环模式将一直执行，直到手动停止或遇到错误'
              : `循环将重复执行 ${loopCount} 次后自动结束`
            }
          </Text>
        </Space>
      </Modal>
    </div>
  );
};