// src/modules/precise-acquisition/components/prospecting-step-card.tsx
// module: precise-acquisition | layer: ui | role: component
// summary: 精准获客步骤卡片，基于统一步骤卡片实现业务特化功能

import React, { useMemo } from "react";
import { Tag, Space, Button, Tooltip } from "antd";
import { 
  UnifiedStepCard
} from "../../universal-ui/components/unified-step-card";
import type { IntelligentStepCard } from "../../universal-ui/types/intelligent-analysis-types";
import {
  BarChartOutlined,
  ExportOutlined,
  SettingOutlined,
} from "@ant-design/icons";

/**
 * 精准获客步骤卡片属性
 */
export interface ProspectingStepCardProps {
  /** 步骤数据 */
  stepCard: IntelligentStepCard;
  /** 步骤索引 */
  stepIndex: number;
  /** 获客阶段 */
  prospectingStage?: "discovery" | "analysis" | "contact" | "follow-up";
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
    label: "发现阶段",
    color: "blue",
    icon: "🔍",
  },
  analysis: {
    label: "分析阶段",
    color: "orange",
    icon: "📊",
  },
  contact: {
    label: "联系阶段",
    color: "green",
    icon: "📞",
  },
  "follow-up": {
    label: "跟进阶段",
    color: "purple",
    icon: "📬",
  },
} as const;

/**
 * 精准获客步骤卡片
 *
 * 🎯 设计理念：
 * - 基于 UnifiedStepCard 扩展获客特有功能
 * - 显示获客阶段和成功率指标
 * - 提供获客数据操作入口
 * - 遵循DDD架构，避免重复实现
 */
export const ProspectingStepCard: React.FC<ProspectingStepCardProps> = ({
  stepCard,
  stepIndex,
  prospectingStage = "discovery",
  showMetrics = true,
  successRate,
  className = "",
  onViewProspectingData,
  onExportContacts,
  onAdjustStrategy,
  onUpgradeStrategy,
  onRetryAnalysis,
  onSwitchStrategy,
}) => {
  const stageConfig = PROSPECTING_STAGE_CONFIG[prospectingStage];

  // 组合类名
  const combinedClassName = [
    "prospecting-step-card",
    `stage-${prospectingStage}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // 增强步骤卡片数据，添加获客特有信息
  const enhancedStepCard = useMemo(() => {
    return {
      ...stepCard,
      stepName: `${stageConfig.icon} ${stepCard.stepName}`,
    };
  }, [stepCard, stageConfig]);

  // 生成获客特有的额外标签
  const prospectingTags = useMemo(() => {
    const tags = [
      <Tag key="stage" color={stageConfig.color}>
        {stageConfig.label}
      </Tag>
    ];

    if (showMetrics && successRate !== undefined) {
      tags.push(
        <Tag
          key="success-rate"
          color={
            successRate > 70
              ? "success"
              : successRate > 40
              ? "warning"
              : "error"
          }
        >
          成功率: {successRate}%
        </Tag>
      );
    }

    return tags;
  }, [stageConfig, showMetrics, successRate]);

  return (
    <div className={combinedClassName}>
      <UnifiedStepCard
        stepCard={enhancedStepCard}
        stepIndex={stepIndex}
        className="prospecting-unified light-theme-force"
        showDebugInfo={false}
        showModeSwitch={true}
        onUpgradeStrategy={onUpgradeStrategy}
        onRetryAnalysis={onRetryAnalysis}
        onSwitchStrategy={onSwitchStrategy}
        onViewDetails={onViewProspectingData}
        onEdit={onAdjustStrategy}
      />

      {/* 获客特有操作区 */}
      <div className="prospecting-actions light-theme-force">
        <Space wrap>
          {/* 阶段和成功率标签 */}
          {prospectingTags}
          
          {/* 获客特有操作按钮 */}
          {onViewProspectingData && (
            <Tooltip title="查看获客数据分析">
              <Button
                size="small"
                icon={<BarChartOutlined />}
                onClick={onViewProspectingData}
              >
                获客数据
              </Button>
            </Tooltip>
          )}
          
          {onExportContacts && (
            <Tooltip title="导出联系人信息">
              <Button
                size="small"
                icon={<ExportOutlined />}
                onClick={onExportContacts}
              >
                导出联系人
              </Button>
            </Tooltip>
          )}
          
          {onAdjustStrategy && (
            <Tooltip title="调整获客策略">
              <Button
                size="small"
                icon={<SettingOutlined />}
                onClick={onAdjustStrategy}
              >
                调整策略
              </Button>
            </Tooltip>
          )}
        </Space>
      </div>

      {/* 内联样式使用CSS modules或styled-components替代jsx样式 */}
      <style>{`
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
          background: var(--bg-light-base, #ffffff);
          border-top: 1px solid var(--border-light, #e8e8e8);
        }

        .prospecting-actions.light-theme-force {
          color: var(--text-inverse, #1e293b);
        }
      `}</style>
    </div>
  );
};

export default ProspectingStepCard;
