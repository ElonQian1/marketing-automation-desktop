// src/modules/loop-control/components/SimpleLoopCard.tsx
// module: loop-control | layer: ui | role: 简化循环卡片组件
// summary: 简洁的循环卡片，只需颜色区分，支持成对显示

import React from 'react';
import { Space, Button, Tooltip } from 'antd';
import { 
  RedoOutlined, 
  PlayCircleOutlined, 
  DeleteOutlined,
  SettingOutlined
} from '@ant-design/icons';

export interface SimpleLoopCardProps {
  /** 循环ID */
  loopId: string;
  /** 卡片类型：开始或结束 */
  type: 'start' | 'end';
  /** 循环名称 */
  name: string;
  /** 是否正在执行 */
  executing?: boolean;
  /** 循环次数（仅开始卡片显示） */
  iterations?: number;
  /** 当前执行次数 */
  currentIteration?: number;
  /** 是否可编辑 */
  editable?: boolean;
  /** 删除回调 */
  onDelete?: () => void;
  /** 配置回调 */
  onConfig?: () => void;
  /** 测试回调 */
  onTest?: () => void;
}

export const SimpleLoopCard: React.FC<SimpleLoopCardProps> = ({
  loopId,
  type,
  name,
  executing = false,
  iterations = 1,
  currentIteration = 0,
  editable = true,
  onDelete,
  onConfig,
  onTest
}) => {
  const isStart = type === 'start';
  
  return (
    <div 
      className={`loop-step-card loop-${type} ${executing ? 'executing' : ''}`}
      style={{ marginLeft: '16px' }} // 内容区域左边距，避开拖拽指示器
    >
      {/* 循环对指示器 */}
      <div className="loop-pair-indicator" />
      
      {/* 标题区域 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* 循环图标 */}
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: isStart ? '#10b981' : '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {isStart ? '🔄' : '🏁'}
          </div>
          
          {/* 标题 */}
          <h4 style={{ 
            margin: 0, 
            fontSize: '14px', 
            fontWeight: '500',
            color: 'inherit'
          }}>
            {isStart ? `开始循环: ${name}` : `结束循环: ${name}`}
          </h4>
        </div>
        
        {/* 操作按钮 */}
        {editable && (
          <Space size="small">
            {isStart && onTest && (
              <Tooltip title="测试循环">
                <Button
                  type="text"
                  size="small"
                  icon={<PlayCircleOutlined />}
                  onClick={onTest}
                  style={{ 
                    color: 'inherit',
                    border: 'none',
                    background: 'rgba(255, 255, 255, 0.1)'
                  }}
                />
              </Tooltip>
            )}
            
            {isStart && onConfig && (
              <Tooltip title="循环配置">
                <Button
                  type="text"
                  size="small"
                  icon={<SettingOutlined />}
                  onClick={onConfig}
                  style={{ 
                    color: 'inherit',
                    border: 'none',
                    background: 'rgba(255, 255, 255, 0.1)'
                  }}
                />
              </Tooltip>
            )}
            
            <Tooltip title="删除循环">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={onDelete}
                style={{ 
                  color: '#fca5a5',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.1)'
                }}
              />
            </Tooltip>
          </Space>
        )}
      </div>
      
      {/* 状态信息 */}
      <div style={{ 
        fontSize: '12px', 
        opacity: 0.9,
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        {isStart && (
          <>
            <span>循环次数: {iterations}</span>
            {executing && (
              <span style={{ color: '#10b981', fontWeight: '500' }}>
                执行中 ({currentIteration}/{iterations})
              </span>
            )}
          </>
        )}
        
        {!isStart && (
          <span className="text-secondary">循环结束点</span>
        )}
      </div>
    </div>
  );
};

export default SimpleLoopCard;