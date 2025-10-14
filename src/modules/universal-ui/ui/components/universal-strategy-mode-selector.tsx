// src/modules/universal-ui/ui/components/universal-strategy-mode-selector.tsx
// module: universal-ui | layer: ui | role: component
// summary: 策略模式切换器，支持智能匹配/单步固定/用户自建三种模式

import React from 'react';
import { Radio, Space, Typography, Tooltip, Card, Alert } from 'antd';
import { 
  ThunderboltOutlined, 
  ControlOutlined, 
  EditOutlined,
  InfoCircleOutlined 
} from '@ant-design/icons';
import type { StrategyMode, StrategyCandidate } from '../../types/intelligent-analysis-types';

const { Text, Paragraph } = Typography;

export interface UniversalStrategyModeSelectorProps {
  /** 当前策略模式 */
  currentMode: StrategyMode;
  /** 模式切换回调 */
  onModeChange: (mode: StrategyMode) => void;
  /** 智能候选策略列表 */
  smartCandidates?: StrategyCandidate[];
  /** 用户自建策略列表 */
  userStrategies?: StrategyCandidate[];
  /** 是否禁用 */
  disabled?: boolean;
  /** 显示模式 */
  displayMode?: 'compact' | 'detailed';
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
}

/**
 * 策略模式切换器组件
 * 
 * 🎯 功能：
 * - 支持三种策略模式切换：
 *   1. intelligent（智能匹配）- 推荐模式，支持回退
 *   2. smart_variant（智能-单步固定）- 从智能分析中选一条，不回退
 *   3. static_user（用户自建静态）- 手写策略
 * - 显示每种模式的特点和适用场景
 * - 符合文档6要求的UI结构
 * 
 * @example
 * ```tsx
 * <UniversalStrategyModeSelector
 *   currentMode="intelligent"
 *   onModeChange={handleModeChange}
 *   smartCandidates={stepCard.smartCandidates}
 * />
 * ```
 */
export const UniversalStrategyModeSelector: React.FC<UniversalStrategyModeSelectorProps> = ({
  currentMode,
  onModeChange,
  smartCandidates = [],
  userStrategies = [],
  disabled = false,
  displayMode = 'detailed',
  style,
  className = ''
}) => {
  const isCompact = displayMode === 'compact';

  /**
   * 模式配置
   */
  const modeConfig = {
    intelligent: {
      icon: <ThunderboltOutlined />,
      label: '智能匹配（推荐）',
      color: '#52c41a',
      description: '完整决策链Step1→Step6，按Plan顺序受控回退',
      features: ['自动推荐最优策略', '支持回退机制', '适应性强'],
      disabled: smartCandidates.length === 0,
      disabledReason: '需要先完成智能分析'
    },
    smart_variant: {
      icon: <ControlOutlined />,
      label: '智能-单步固定',
      color: '#1890ff',
      description: '从智能分析中挑一条，失败直接报错不回退',
      features: ['精确控制', '轻校验', '快速失败'],
      disabled: smartCandidates.length === 0,
      disabledReason: '需要先完成智能分析'
    },
    static_user: {
      icon: <EditOutlined />,
      label: '用户自建静态',
      color: '#faad14',
      description: '手写XPath/CSS，可加入智能候选',
      features: ['完全自定义', '可置顶', '环境约束'],
      disabled: false,
      disabledReason: ''
    }
  } as const;

  /**
   * 渲染紧凑模式
   */
  if (isCompact) {
    return (
      <div className={`light-theme-force ${className}`} style={style}>
        <Radio.Group 
          value={currentMode} 
          onChange={(e) => onModeChange(e.target.value)}
          disabled={disabled}
          buttonStyle="solid"
          size="small"
        >
          <Radio.Button 
            value="intelligent"
            disabled={modeConfig.intelligent.disabled}
          >
            <Tooltip title={modeConfig.intelligent.description}>
              <Space size={4}>
                {modeConfig.intelligent.icon}
                智能匹配
              </Space>
            </Tooltip>
          </Radio.Button>
          
          <Radio.Button 
            value="smart_variant"
            disabled={modeConfig.smart_variant.disabled}
          >
            <Tooltip title={modeConfig.smart_variant.description}>
              <Space size={4}>
                {modeConfig.smart_variant.icon}
                单步固定
              </Space>
            </Tooltip>
          </Radio.Button>
          
          <Radio.Button 
            value="static_user"
            disabled={modeConfig.static_user.disabled}
          >
            <Tooltip title={modeConfig.static_user.description}>
              <Space size={4}>
                {modeConfig.static_user.icon}
                自建策略
              </Space>
            </Tooltip>
          </Radio.Button>
        </Radio.Group>
      </div>
    );
  }

  /**
   * 渲染详细模式
   */
  return (
    <div className={`light-theme-force ${className}`} style={style}>
      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text strong style={{ color: 'var(--text-1, #1e293b)' }}>
            策略模式
          </Text>
          <Tooltip title="选择策略的执行模式，影响回退行为和失败处理">
            <InfoCircleOutlined style={{ fontSize: 12, color: 'var(--text-3, #94a3b8)' }} />
          </Tooltip>
        </div>

        <Radio.Group 
          value={currentMode} 
          onChange={(e) => onModeChange(e.target.value)}
          disabled={disabled}
          style={{ width: '100%' }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size={8}>
            {/* 智能匹配模式 */}
            <Card
              size="small"
              className={`light-theme-force mode-card ${currentMode === 'intelligent' ? 'mode-card-active' : ''}`}
              style={{
                borderColor: currentMode === 'intelligent' ? modeConfig.intelligent.color : 'var(--border-2, #e2e8f0)',
                backgroundColor: currentMode === 'intelligent' ? `${modeConfig.intelligent.color}10` : 'transparent',
                opacity: modeConfig.intelligent.disabled ? 0.6 : 1,
              }}
            >
              <Radio 
                value="intelligent" 
                disabled={modeConfig.intelligent.disabled}
                style={{ width: '100%' }}
              >
                <div style={{ marginLeft: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ color: modeConfig.intelligent.color }}>
                      {modeConfig.intelligent.icon}
                    </span>
                    <Text strong style={{ color: 'var(--text-1, #1e293b)' }}>
                      {modeConfig.intelligent.label}
                    </Text>
                    {smartCandidates.length > 0 && (
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        ({smartCandidates.length} 个候选)
                      </Text>
                    )}
                  </div>
                  <Paragraph 
                    type="secondary" 
                    style={{ fontSize: 12, margin: '4px 0', color: 'var(--text-3, #64748b)' }}
                  >
                    {modeConfig.intelligent.description}
                  </Paragraph>
                  {modeConfig.intelligent.disabled && (
                    <Alert 
                      message={modeConfig.intelligent.disabledReason} 
                      type="info" 
                      showIcon 
                      banner 
                      style={{ marginTop: 4 }}
                    />
                  )}
                </div>
              </Radio>
            </Card>

            {/* 智能-单步固定模式 */}
            <Card
              size="small"
              className={`light-theme-force mode-card ${currentMode === 'smart_variant' ? 'mode-card-active' : ''}`}
              style={{
                borderColor: currentMode === 'smart_variant' ? modeConfig.smart_variant.color : 'var(--border-2, #e2e8f0)',
                backgroundColor: currentMode === 'smart_variant' ? `${modeConfig.smart_variant.color}10` : 'transparent',
                opacity: modeConfig.smart_variant.disabled ? 0.6 : 1,
              }}
            >
              <Radio 
                value="smart_variant" 
                disabled={modeConfig.smart_variant.disabled}
                style={{ width: '100%' }}
              >
                <div style={{ marginLeft: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ color: modeConfig.smart_variant.color }}>
                      {modeConfig.smart_variant.icon}
                    </span>
                    <Text strong style={{ color: 'var(--text-1, #1e293b)' }}>
                      {modeConfig.smart_variant.label}
                    </Text>
                  </div>
                  <Paragraph 
                    type="secondary" 
                    style={{ fontSize: 12, margin: '4px 0', color: 'var(--text-3, #64748b)' }}
                  >
                    {modeConfig.smart_variant.description}
                  </Paragraph>
                  {modeConfig.smart_variant.disabled && (
                    <Alert 
                      message={modeConfig.smart_variant.disabledReason} 
                      type="info" 
                      showIcon 
                      banner 
                      style={{ marginTop: 4 }}
                    />
                  )}
                </div>
              </Radio>
            </Card>

            {/* 用户自建静态模式 */}
            <Card
              size="small"
              className={`light-theme-force mode-card ${currentMode === 'static_user' ? 'mode-card-active' : ''}`}
              style={{
                borderColor: currentMode === 'static_user' ? modeConfig.static_user.color : 'var(--border-2, #e2e8f0)',
                backgroundColor: currentMode === 'static_user' ? `${modeConfig.static_user.color}10` : 'transparent',
              }}
            >
              <Radio 
                value="static_user" 
                disabled={modeConfig.static_user.disabled}
                style={{ width: '100%' }}
              >
                <div style={{ marginLeft: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ color: modeConfig.static_user.color }}>
                      {modeConfig.static_user.icon}
                    </span>
                    <Text strong style={{ color: 'var(--text-1, #1e293b)' }}>
                      {modeConfig.static_user.label}
                    </Text>
                    {userStrategies.length > 0 && (
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        ({userStrategies.length} 个自建)
                      </Text>
                    )}
                  </div>
                  <Paragraph 
                    type="secondary" 
                    style={{ fontSize: 12, margin: '4px 0', color: 'var(--text-3, #64748b)' }}
                  >
                    {modeConfig.static_user.description}
                  </Paragraph>
                </div>
              </Radio>
            </Card>
          </Space>
        </Radio.Group>

        {/* 当前模式说明 */}
        {currentMode && (
          <Alert
            type="info"
            showIcon
            message={
              <Space direction="vertical" size={2}>
                <Text strong style={{ fontSize: 12 }}>
                  当前模式特性：
                </Text>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12 }}>
                  {modeConfig[currentMode].features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </Space>
            }
            style={{ fontSize: 12 }}
          />
        )}
      </Space>

      {/* 内联样式 */}
      <style>{`
        .mode-card {
          transition: all 0.3s ease;
          cursor: pointer;
        }
        
        .mode-card:hover:not(.mode-card-active) {
          border-color: var(--primary, #1890ff);
          box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
        }
        
        .mode-card-active {
          box-shadow: 0 4px 12px rgba(24, 144, 255, 0.25);
        }
      `}</style>
    </div>
  );
};

export default UniversalStrategyModeSelector;
