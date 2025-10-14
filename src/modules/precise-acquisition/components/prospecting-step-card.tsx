// src/modules/precise-acquisition/components/prospecting-step-card.tsx  
// module: precise-acquisition | layer: ui | role: component
// summary: 精准获客步骤卡片，专门处理获客流程中的步骤展示

import React from 'react';
import { Tag, Space } from 'antd';
import { UnifiedStepCard } from '../../universal-ui/components/unified-step-card';
import { adaptScriptStepToIntelligent } from '../../universal-ui/adapters/step-card-adapter';
import type { IntelligentStepCard } from '../../universal-ui/types/intelligent-analysis-types';

/**
 * 精准获客步骤卡片属性
 */
export interface ProspectingStepCardProps {
  /** 步骤数据 */
  stepCard: IntelligentStepCard;
  /** 步骤索引 */
  stepIndex: number;
  /** 获客阶段 */
  prospectingStage?: 'discovery' | 'analysis' | 'contact' | 'follow-up';
  /** 是否显示获客指标 */
  showMetrics?: boolean;
  /** 获客成功率 */
  successRate?: number;
  /** 自定义类名 */
  className?: string;
  
  // 获客特有回调
  /** 查看获客数据 */
  onViewProspectingData?: () => void;
  /** 导出联系人 */
  onExportContacts?: () => void;
  /** 调整获客策略 */
  onAdjustStrategy?: () => void;
  
  // 智能分析回调
  /** 升级策略 */
  onUpgradeStrategy?: () => void;
  /** 重试分析 */
  onRetryAnalysis?: () => void;
  /** 切换策略 */
  onSwitchStrategy?: (strategyKey: string, followSmart: boolean) => void;
}

/**
 * 获客阶段配置
 */
const PROSPECTING_STAGE_CONFIG = {
  discovery: { 
    label: '发现阶段', 
    color: 'blue', 
    icon: '🔍' 
  },
  analysis: { 
    label: '分析阶段', 
    color: 'orange', 
    icon: '📊' 
  },
  contact: { 
    label: '联系阶段', 
    color: 'green', 
    icon: '📞' 
  },
  'follow-up': { 
    label: '跟进阶段', 
    color: 'purple', 
    icon: '📬' 
  }
} as const;

/**
 * 精准获客步骤卡片
 * 
 * 🎯 设计理念：
 * - 基于 UnifiedStepCard 扩展获客特有功能
 * - 显示获客阶段和成功率指标
 * - 提供获客数据操作入口
 */
export const ProspectingStepCard: React.FC<ProspectingStepCardProps> = ({
  stepCard,
  stepIndex,
  prospectingStage = 'discovery',
  showMetrics = true,
  successRate,
  className = '',
  onViewProspectingData,
  onExportContacts,
  onAdjustStrategy,
  onUpgradeStrategy,
  onRetryAnalysis,
  onSwitchStrategy
}) => {
  
  const stageConfig = PROSPECTING_STAGE_CONFIG[prospectingStage];
  
  // 组合类名
  const combinedClassName = [
    'prospecting-step-card',
    `stage-${prospectingStage}`,
    className
  ].filter(Boolean).join(' ');
  
  // 自定义标题
  const customTitle = (
    <Space>
      <span>{stageConfig.icon}</span>
      <span>{stepCard.stepName}</span>
      <Tag color={stageConfig.color}>
        {stageConfig.label}
      </Tag>
      {showMetrics && successRate !== undefined && (
        <Tag color={successRate > 70 ? 'success' : successRate > 40 ? 'warning' : 'error'}>
          成功率: {successRate}%
        </Tag>
      )}
    </Space>
  );
  
  return (
    <div className={combinedClassName}>
      <UnifiedStepCard
        stepCard={{
          ...stepCard,
          stepName: customTitle
        }}
        stepIndex={stepIndex}
        className="prospecting-unified"
        onUpgradeStrategy={onUpgradeStrategy}
        onRetryAnalysis={onRetryAnalysis}
        onSwitchStrategy={onSwitchStrategy}
      />
      
      {/* 获客特有操作区 */}
      <div className="prospecting-actions">
        <Space>
          {onViewProspectingData && (
            <button 
              className="prospecting-btn view-data-btn"
              onClick={onViewProspectingData}
            >
              📊 查看获客数据
            </button>
          )}
          {onExportContacts && (
            <button 
              className="prospecting-btn export-btn"
              onClick={onExportContacts}
            >
              📤 导出联系人
            </button>
          )}
          {onAdjustStrategy && (
            <button 
              className="prospecting-btn adjust-btn"
              onClick={onAdjustStrategy}
            >
              ⚙️ 调整策略
            </button>
          )}
        </Space>
      </div>
      
      <style jsx>{`
        .prospecting-step-card {
          margin: 12px 0;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .stage-discovery {
          border-left: 4px solid #1890ff;
        }
        
        .stage-analysis {
          border-left: 4px solid #fa8c16;
        }
        
        .stage-contact {
          border-left: 4px solid #52c41a;
        }
        
        .stage-follow-up {
          border-left: 4px solid #722ed1;
        }
        
        .prospecting-actions {
          padding: 12px 16px;
          background: linear-gradient(135deg, #f6f8fa 0%, #e9ecef 100%);
          border-top: 1px solid #e8e8e8;
        }
        
        .prospecting-btn {
          background: white;
          border: 1px solid #d9d9d9;
          border-radius: 6px;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s ease;
        }
        
        .prospecting-btn:hover {
          border-color: #1890ff;
          color: #1890ff;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .view-data-btn:hover {
          background: linear-gradient(135deg, #e6f7ff, #bae7ff);
        }
        
        .export-btn:hover {
          background: linear-gradient(135deg, #f6ffed, #d9f7be);
        }
        
        .adjust-btn:hover {
          background: linear-gradient(135deg, #fff7e6, #ffd591);
        }
      `}</style>
    </div>
  );
};

export default ProspectingStepCard;