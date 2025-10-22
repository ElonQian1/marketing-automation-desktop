// src/components/stepCards/ActionParams.tsx
// module: components | layer: ui | role: 动态动作参数面板
// summary: 根据动作类型显示对应的参数控件

import React from 'react';
import { Space, Divider, InputNumber, Input, Switch, Segmented, Card } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import type { 
  ActionType, 
  StepActionCommon, 
  TapLikeParams, 
  SwipeParams, 
  TypeParams, 
  WaitParams,
  SwipeDirection 
} from '../../types/stepActions';

export interface ActionParamsProps {
  action: ActionType;
  params: Record<string, unknown>; // 动态类型，根据action决定
  common: StepActionCommon;
  onParamsChange: (params: Record<string, unknown>) => void;
  onCommonChange: (common: StepActionCommon) => void;
}

export const ActionParams: React.FC<ActionParamsProps> = ({
  action,
  params,
  common,
  onParamsChange,
  onCommonChange,
}) => {
  // 通用参数控件
  const renderCommonParams = () => (
    <Card size="small" title="通用设置" className="light-theme-force">
      <Space wrap>
        <span>选择器优先</span>
        <Switch 
          checked={common.useSelector} 
          onChange={v => onCommonChange({ ...common, useSelector: v })} 
        />
        
        <Divider type="vertical" />
        
        <span>坐标兜底</span>
        <Switch 
          checked={common.allowAbsolute} 
          onChange={v => onCommonChange({ ...common, allowAbsolute: v })} 
        />
        
        <Divider type="vertical" />
        
        <span>置信度阈值</span>
        <InputNumber 
          min={0.1} 
          max={1} 
          step={0.05} 
          value={common.confidenceThreshold}
          onChange={(v) => onCommonChange({ ...common, confidenceThreshold: Number(v) || 0.8 })}
          style={{ width: 80 }}
        />
        
        <Divider type="vertical" />
        
        <span>重试次数</span>
        <InputNumber 
          min={0} 
          max={5} 
          value={common.retries}
          onChange={(v) => onCommonChange({ ...common, retries: Number(v) || 1 })}
          style={{ width: 60 }}
        />
        
        <Divider type="vertical" />
        
        <span>执行后验证</span>
        <Switch 
          checked={common.verifyAfter} 
          onChange={v => onCommonChange({ ...common, verifyAfter: v })} 
        />
      </Space>
    </Card>
  );

  // 点击类参数
  const renderTapLikeParams = () => {
    const tapParams = params as TapLikeParams;
    return (
      <Card size="small" title={`${action === 'tap' ? '点选' : action === 'doubleTap' ? '双击' : '长按'}参数`} className="light-theme-force">
        <Space wrap>
          <span>X坐标</span>
          <InputNumber 
            value={tapParams.x} 
            onChange={v => onParamsChange({ ...tapParams, x: v || undefined })}
            placeholder="自动"
            style={{ width: 80 }}
          />
          
          <span>Y坐标</span>
          <InputNumber 
            value={tapParams.y} 
            onChange={v => onParamsChange({ ...tapParams, y: v || undefined })}
            placeholder="自动"
            style={{ width: 80 }}
          />
          
          <span>X偏移</span>
          <InputNumber 
            value={tapParams.offsetX || 0} 
            onChange={v => onParamsChange({ ...tapParams, offsetX: Number(v) || 0 })}
            style={{ width: 70 }}
          />
          
          <span>Y偏移</span>
          <InputNumber 
            value={tapParams.offsetY || 0} 
            onChange={v => onParamsChange({ ...tapParams, offsetY: Number(v) || 0 })}
            style={{ width: 70 }}
          />

          {action === 'longPress' && (
            <>
              <Divider type="vertical" />
              <span>按住时长(ms)</span>
              <InputNumber 
                min={200} 
                max={2000} 
                step={50}
                value={tapParams.pressDurationMs || 450}
                onChange={v => onParamsChange({ ...tapParams, pressDurationMs: Number(v) || 450 })}
                style={{ width: 100 }}
              />
            </>
          )}
        </Space>
      </Card>
    );
  };

  // 滑动参数
  const renderSwipeParams = () => {
    const swipeParams = params as unknown as SwipeParams;
    const directionOptions = [
      { label: <ArrowUpOutlined />, value: 'up' },
      { label: <ArrowDownOutlined />, value: 'down' },
      { label: <ArrowLeftOutlined />, value: 'left' },
      { label: <ArrowRightOutlined />, value: 'right' },
    ];

    return (
      <Card size="small" title="滑动参数" className="light-theme-force">
        <Space wrap>
          <span>方向</span>
          <Segmented 
            options={directionOptions} 
            value={swipeParams.direction} 
            onChange={v => onParamsChange({ ...swipeParams, direction: v as SwipeDirection })}
          />
          
          <Divider type="vertical" />
          
          <span>滑动距离(%)</span>
          <InputNumber 
            min={10} 
            max={100} 
            step={5}
            value={Math.round((swipeParams.distance || 0.6) * 100)}
            onChange={(v) => onParamsChange({ ...swipeParams, distance: Number(v) / 100 || 0.6 })}
            style={{ width: 80 }}
          />
          
          <span>滑动时长(ms)</span>
          <InputNumber 
            min={50} 
            max={1200} 
            step={50}
            value={swipeParams.durationMs || 250}
            onChange={(v) => onParamsChange({ ...swipeParams, durationMs: Number(v) || 250 })}
            style={{ width: 100 }}
          />
          
          <Divider type="vertical" />
          
          <span>起点</span>
          <Segmented 
            options={[
              { label: '元素中心', value: 'element' },
              { label: '屏幕中心', value: 'screenCenter' },
              { label: '自定义', value: 'custom' },
            ]} 
            value={swipeParams.startFrom} 
            onChange={v => onParamsChange({ ...swipeParams, startFrom: v })}
          />
        </Space>
      </Card>
    );
  };

  // 输入参数
  const renderTypeParams = () => {
    const typeParams = params as unknown as TypeParams;
    return (
      <Card size="small" title="输入参数" className="light-theme-force">
        <Space wrap>
          <span>输入文本</span>
          <Input 
            style={{ width: 300 }} 
            value={typeParams.text || ''} 
            onChange={e => onParamsChange({ ...typeParams, text: e.target.value })}
            placeholder="请输入要发送的文本"
          />
          
          <Divider type="vertical" />
          
          <span>安全模式</span>
          <Switch 
            checked={typeParams.secure} 
            onChange={v => onParamsChange({ ...typeParams, secure: v })} 
          />
          
          <span>清空后输入</span>
          <Switch 
            checked={typeParams.clearBefore} 
            onChange={v => onParamsChange({ ...typeParams, clearBefore: v })} 
          />
          
          <span>输入后回车</span>
          <Switch 
            checked={typeParams.keyboardEnter} 
            onChange={v => onParamsChange({ ...typeParams, keyboardEnter: v })} 
          />
        </Space>
      </Card>
    );
  };

  // 等待参数
  const renderWaitParams = () => {
    const waitParams = params as unknown as WaitParams;
    return (
      <Card size="small" title="等待参数" className="light-theme-force">
        <Space>
          <span>等待时长(ms)</span>
          <InputNumber 
            min={100} 
            max={10000} 
            step={100} 
            value={waitParams.waitMs || 500}
            onChange={v => onParamsChange({ ...waitParams, waitMs: Number(v) || 500 })}
            style={{ width: 120 }}
          />
        </Space>
      </Card>
    );
  };

  // 返回参数（无特殊参数）
  const renderBackParams = () => (
    <Card size="small" title="返回参数" className="light-theme-force">
      <span style={{ color: '#999' }}>返回操作无需额外参数</span>
    </Card>
  );

  return (
    <div className="action-params light-theme-force">
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* 动作特定参数 */}
        {['tap', 'doubleTap', 'longPress'].includes(action) && renderTapLikeParams()}
        {action === 'swipe' && renderSwipeParams()}
        {action === 'type' && renderTypeParams()}
        {action === 'wait' && renderWaitParams()}
        {action === 'back' && renderBackParams()}
        
        {/* 通用参数 */}
        {renderCommonParams()}
      </Space>

    </div>
  );
};