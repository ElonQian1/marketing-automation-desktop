// src/modules/execution-flow-control/ui/components/jump-target-selector.tsx
// module: execution-flow-control | layer: ui | role: 跳转目标选择器组件
// summary: 选择失败处理中跳转目标步骤的下拉选择器

import React, { useMemo } from 'react';
import { Select, Space, Typography, Alert } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Text } = Typography;

export interface JumpTargetStep {
  id: string;
  index: number;
  name: string;
  description?: string;
  enabled: boolean;
}

export interface JumpTargetSelectorProps {
  /** 当前步骤ID，用于防止跳转到自己 */
  currentStepId: string;
  /** 当前选中的跳转目标步骤ID */
  value?: string;
  /** 可选择的步骤列表 */
  availableSteps: JumpTargetStep[];
  /** 选择变化回调 */
  onChange: (targetStepId: string | undefined) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 组件大小 */
  size?: 'small' | 'middle' | 'large';
  /** 占位符文本 */
  placeholder?: string;
}

/**
 * 跳转目标选择器
 * 
 * 🎯 功能特性：
 * - 显示步骤编号、名称和状态
 * - 自动过滤当前步骤（防止死循环）
 * - 禁用已关闭的步骤
 * - 支持搜索和筛选
 * - 智能推荐最佳跳转目标
 */
export const JumpTargetSelector: React.FC<JumpTargetSelectorProps> = ({
  currentStepId,
  value,
  availableSteps,
  onChange,
  disabled = false,
  size = 'small',
  placeholder = '选择跳转目标步骤'
}) => {
  // 📋 过滤可选步骤：排除当前步骤，优先显示启用的步骤
  const filteredSteps = useMemo(() => {
    return availableSteps
      .filter(step => step.id !== currentStepId) // 防止跳转到自己
      .sort((a, b) => {
        // 启用的步骤排在前面
        if (a.enabled && !b.enabled) return -1;
        if (!a.enabled && b.enabled) return 1;
        // 同样状态按索引排序
        return a.index - b.index;
      });
  }, [availableSteps, currentStepId]);

  // 🎯 获取推荐步骤（第一个启用的步骤）
  const recommendedStep = useMemo(() => {
    return filteredSteps.find(step => step.enabled);
  }, [filteredSteps]);

  // 📊 验证当前选择的有效性
  const selectedStepInfo = useMemo(() => {
    if (!value) return null;
    
    const step = filteredSteps.find(s => s.id === value);
    if (!step) {
      return { isValid: false, reason: '所选步骤不存在' };
    }
    if (!step.enabled) {
      return { isValid: false, reason: '所选步骤已禁用' };
    }
    return { isValid: true, step };
  }, [value, filteredSteps]);

  // 🔍 自定义搜索过滤器
  const filterOption = (input: string, option: any) => {
    const stepIndex = option.children.props.children[0].props.children;
    const stepName = option.children.props.children[1].props.children;
    const searchText = `${stepIndex} ${stepName}`.toLowerCase();
    return searchText.includes(input.toLowerCase());
  };

  // 🎨 获取步骤状态样式
  const getStepStatusStyle = (step: JumpTargetStep) => {
    if (!step.enabled) {
      return { color: '#999', opacity: 0.6 };
    }
    if (step.id === recommendedStep?.id) {
      return { color: '#52c41a', fontWeight: 500 };
    }
    return {};
  };

  // 📝 渲染选项内容
  const renderStepOption = (step: JumpTargetStep) => (
    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
      <Space size="small">
        <Text strong style={{ color: '#1890ff', minWidth: '32px' }}>
          #{step.index + 1}
        </Text>
        <Text style={getStepStatusStyle(step)}>
          {step.name || step.description || `步骤 ${step.index + 1}`}
        </Text>
      </Space>
      <Space size="small">
        {step.id === recommendedStep?.id && (
          <Text type="success" style={{ fontSize: '11px' }}>推荐</Text>
        )}
        {!step.enabled && (
          <Text type="secondary" style={{ fontSize: '11px' }}>已禁用</Text>
        )}
      </Space>
    </Space>
  );

  return (
    <div style={{ width: '100%' }}>
      <Select
        value={value}
        onChange={onChange}
        disabled={disabled}
        size={size}
        style={{ width: '100%' }}
        placeholder={placeholder}
        showSearch
        allowClear
        filterOption={filterOption}
        notFoundContent="没有可选择的步骤"
        dropdownRender={(menu) => (
          <div>
            {recommendedStep && !value && (
              <div style={{ 
                padding: '8px 12px', 
                backgroundColor: '#f6ffed', 
                borderBottom: '1px solid #d9d9d9',
                fontSize: '12px',
                color: '#52c41a'
              }}>
                💡 推荐选择：#{recommendedStep.index + 1} {recommendedStep.name}
              </div>
            )}
            {menu}
          </div>
        )}
      >
        {filteredSteps.map(step => (
          <Option 
            key={step.id} 
            value={step.id} 
            disabled={!step.enabled}
          >
            {renderStepOption(step)}
          </Option>
        ))}
      </Select>

      {/* 🚨 选择验证提示 */}
      {selectedStepInfo && !selectedStepInfo.isValid && (
        <Alert
          message={selectedStepInfo.reason}
          type="warning"
          size="small"
          icon={<ExclamationCircleOutlined />}
          style={{ marginTop: 8, fontSize: '12px' }}
          showIcon
        />
      )}

      {/* 📊 步骤统计信息 */}
      {filteredSteps.length > 0 && (
        <div style={{ 
          marginTop: 6, 
          fontSize: '11px', 
          color: '#666',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>
            可选择 {filteredSteps.filter(s => s.enabled).length} 个步骤
          </span>
          {filteredSteps.some(s => !s.enabled) && (
            <span style={{ color: '#ff7875' }}>
              {filteredSteps.filter(s => !s.enabled).length} 个已禁用
            </span>
          )}
        </div>
      )}
    </div>
  );
};