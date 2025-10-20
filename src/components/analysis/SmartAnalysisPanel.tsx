// src/components/analysis/SmartAnalysisPanel.tsx
// module: ui | layer: ui | role: 智能分析面板
// summary: 展示"逐步评分表 + 智能自动链"两个视图的分析结果面板

import React from 'react';
import { Card, Progress, Tag, Badge, Collapse, Space, Divider, Button, Tooltip } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, LoadingOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useAnalysisState } from '../../stores/analysis-state-store';
import { toPercentInt01, isValidScore } from '../../utils/score-utils';
import { ConfidenceLegend } from './ConfidenceLegend';

/**
 * 根据置信度返回对应的颜色和样式
 */
function getConfidenceStyle(confidence: number) {
  const percent = confidence * 100;
  
  if (percent >= 85) {
    return {
      color: 'green',
      bgColor: 'border-green-200 bg-green-50',
      level: 'high' as const
    };
  }
  if (percent >= 70) {
    return {
      color: 'blue', 
      bgColor: 'border-blue-200 bg-blue-50',
      level: 'medium-high' as const
    };
  }
  if (percent >= 55) {
    return {
      color: 'orange',
      bgColor: 'border-orange-200 bg-orange-50', 
      level: 'medium' as const
    };
  }
  if (percent >= 40) {
    return {
      color: 'volcano',
      bgColor: 'border-red-200 bg-red-50',
      level: 'medium-low' as const
    };
  }
  return {
    color: 'red',
    bgColor: 'border-red-300 bg-red-100',
    level: 'low' as const
  };
}

const { Panel } = Collapse;

interface SmartAnalysisPanelProps {
  /** 当前步骤ID */
  stepId?: string;
  /** 是否显示详细信息 */
  showDetails?: boolean;
  /** 回调：选择智能自动链 */
  onSelectChain?: () => void;
  /** 回调：选择单步策略 */
  onSelectStep?: (stepId: string) => void;
}

/**
 * 智能分析面板 - 展示两类产物和两个视图
 */
export const SmartAnalysisPanel: React.FC<SmartAnalysisPanelProps> = ({
  showDetails = true,
  onSelectChain,
  onSelectStep
}) => {
  // 获取分析状态
  const analysisStatus = useAnalysisState.status();
  const smartChain = useAnalysisState.smartChain();
  const validSteps = useAnalysisState.validSteps();
  const summary = useAnalysisState.summary();

  // 状态样式映射
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'running':
        return { icon: <LoadingOutlined />, color: 'blue', text: '分析中' };
      case 'completed':
        return { icon: <CheckCircleOutlined />, color: 'green', text: '完成' };
      case 'error':
        return { icon: <ExclamationCircleOutlined />, color: 'red', text: '错误' };
      default:
        return { icon: <ClockCircleOutlined />, color: 'default', text: '等待' };
    }
  };

  const statusConfig = getStatusConfig(analysisStatus);

  return (
    <div className="smart-analysis-panel">
      {/* 状态概览 */}
      <Card size="small" className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag icon={statusConfig.icon} color={statusConfig.color}>
              {statusConfig.text}
            </Tag>
            <span className="text-sm text-gray-600">
              {summary.completedSteps}/{summary.totalSteps} 步骤完成
            </span>
          </div>
          {analysisStatus === 'running' && (
            <Progress 
              percent={Math.round((summary.completedSteps / Math.max(summary.totalSteps, 1)) * 100)} 
              size="small" 
              showInfo={false}
              className="w-20"
            />
          )}
        </div>
      </Card>

      {/* 🔗 A. 智能自动链视图 */}
      <Card 
        size="small" 
        title={
          <div className="flex items-center gap-2">
            <span>🧠 智能自动链</span>
            {smartChain && (
              <Badge 
                count={smartChain.orderedSteps.length} 
                style={{ backgroundColor: '#52c41a' }} 
              />
            )}
          </div>
        }
        className="mb-4"
        extra={
          smartChain && onSelectChain && (
            <Button size="small" type="primary" onClick={onSelectChain}>
              采用链式策略
            </Button>
          )
        }
      >
        {smartChain ? (
          <div>
            <div className="mb-2">
              <span className="text-sm text-gray-600">推荐策略：</span>
              <Tag color="blue" className="ml-1">
                {smartChain.recommended}
              </Tag>
              {smartChain.totalConfidence && (
                <Tag color="green" className="ml-1">
                  总体置信度 {toPercentInt01(smartChain.totalConfidence)}%
                </Tag>
              )}
            </div>
            
            <div className="text-sm">
              <span className="text-gray-600">执行顺序：</span>
              <div className="mt-1 space-x-1">
                {smartChain.orderedSteps.map((stepId, index) => (
                  <Tag 
                    key={stepId} 
                    color={index === 0 ? "blue" : "default"}
                    className="text-xs"
                  >
                    {index + 1}. {stepId}
                  </Tag>
                ))}
              </div>
            </div>
            
            {smartChain.reasons && smartChain.reasons.length > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                <details>
                  <summary className="cursor-pointer">排序原因</summary>
                  <ul className="mt-1 space-y-1">
                    {smartChain.reasons.map((reason, index) => (
                      <li key={index}>• {reason}</li>
                    ))}
                  </ul>
                </details>
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-500 text-sm">
            {analysisStatus === 'running' ? '正在生成智能链...' : '暂无智能链数据'}
          </div>
        )}
      </Card>

      {/* 🎯 B. 逐步评分表视图 */}
      <Card 
        size="small" 
        title={
          <div className="flex items-center gap-2">
            <span>🎯 逐步评分表</span>
            <Badge count={validSteps.length} style={{ backgroundColor: '#1890ff' }} />
          </div>
        }
      >
        {validSteps.length > 0 ? (
          <div className="space-y-2">
            {validSteps.map((step, index) => {
              const confidencePercent = toPercentInt01(step.confidence);
              const confidenceStyle = getConfidenceStyle(step.confidence);
              
              return (
                <div 
                  key={step.stepId}
                  className={`
                    flex items-center justify-between p-2 rounded border
                    ${confidenceStyle.bgColor}
                    ${onSelectStep ? 'cursor-pointer hover:shadow-sm' : ''}
                  `}
                  onClick={() => onSelectStep?.(step.stepId)}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">#{index + 1}</span>
                      <Tag 
                        color={step.status === 'final' ? 'green' : 'orange'}
                      >
                        {step.strategy}
                      </Tag>
                    </div>
                    
                    <div className="text-sm">
                      {step.stepId.slice(-8)}
                    </div>
                    
                    {step.status === 'final' && (
                      <CheckCircleOutlined className="text-green-500 text-xs" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Tag 
                      color={confidenceStyle.color}
                      style={{ fontWeight: 'bold' }}
                    >
                      {confidencePercent}%
                    </Tag>
                    
                    {showDetails && step.metrics && (
                      <Tooltip 
                        title={
                          <div>
                            {Object.entries(step.metrics).map(([key, value]) => (
                              <div key={key}>
                                {key}: {value}
                              </div>
                            ))}
                          </div>
                        }
                      >
                        <Tag className="cursor-help text-xs">
                          详情
                        </Tag>
                      </Tooltip>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-gray-500 text-sm text-center py-4">
            {analysisStatus === 'running' ? (
              <div className="flex items-center justify-center gap-2">
                <LoadingOutlined />
                <span>正在分析各步骤...</span>
              </div>
            ) : (
              '暂无步骤评分数据'
            )}
          </div>
        )}
      </Card>

      {/* 🎨 置信度颜色图例 */}
      {validSteps.length > 0 && (
        <ConfidenceLegend size="small" showDetails={false} />
      )}

      {/* 调试信息（开发模式） */}
      {process.env.NODE_ENV === 'development' && showDetails && (
        <Card size="small" title="🔍 调试信息" className="mt-4">
          <Collapse size="small">
            <Panel header="状态摘要" key="summary">
              <pre className="text-xs bg-gray-100 p-2 rounded">
                {JSON.stringify(summary, null, 2)}
              </pre>
            </Panel>
            
            {smartChain && (
              <Panel header="智能链详情" key="chain">
                <pre className="text-xs bg-gray-100 p-2 rounded">
                  {JSON.stringify(smartChain, null, 2)}
                </pre>
              </Panel>
            )}
            
            <Panel header="步骤详情" key="steps">
              <pre className="text-xs bg-gray-100 p-2 rounded">
                {JSON.stringify(validSteps, null, 2)}
              </pre>
            </Panel>
          </Collapse>
        </Card>
      )}
    </div>
  );
};

export default SmartAnalysisPanel;