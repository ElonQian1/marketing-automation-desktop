// src/modules/contact-import/components/contact-import-step-card.tsx
// module: contact-import | layer: ui | role: component
// summary: 联系人导入步骤卡片，专门处理联系人导入流程中的步骤展示

import React from 'react';
import { Tag, Space, Progress, Badge } from 'antd';
import { ContactsOutlined, ImportOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { UnifiedStepCard } from '../../universal-ui/components/unified-step-card';
import type { IntelligentStepCard } from '../../universal-ui/types/intelligent-analysis-types';

/**
 * 联系人导入步骤卡片属性
 */
export interface ContactImportStepCardProps {
  /** 步骤数据 */
  stepCard: IntelligentStepCard;
  /** 步骤索引 */
  stepIndex: number;
  /** 导入状态 */
  importStatus?: 'pending' | 'importing' | 'completed' | 'failed' | 'partial';
  /** 导入进度 */
  importProgress?: number;
  /** 总联系人数 */
  totalContacts?: number;
  /** 已导入数量 */
  importedCount?: number;
  /** 失败数量 */
  failedCount?: number;
  /** 是否显示统计信息 */
  showStats?: boolean;
  /** 自定义类名 */
  className?: string;
  
  // 联系人导入特有回调
  /** 开始导入 */
  onStartImport?: () => void;
  /** 暂停导入 */
  onPauseImport?: () => void;
  /** 重试失败项 */
  onRetryFailed?: () => void;
  /** 查看导入详情 */
  onViewImportDetails?: () => void;
  /** 导出结果 */
  onExportResults?: () => void;
  
  // 智能分析回调
  /** 升级策略 */
  onUpgradeStrategy?: () => void;
  /** 重试分析 */
  onRetryAnalysis?: () => void;
  /** 切换策略 */
  onSwitchStrategy?: (strategyKey: string, followSmart: boolean) => void;
}

/**
 * 导入状态配置
 */
const IMPORT_STATUS_CONFIG = {
  pending: {
    label: '待导入',
    color: 'default',
    icon: <ImportOutlined />,
    badgeStatus: 'default' as const
  },
  importing: {
    label: '导入中',
    color: 'processing',
    icon: <ImportOutlined />,
    badgeStatus: 'processing' as const
  },
  completed: {
    label: '已完成',
    color: 'success',
    icon: <CheckCircleOutlined />,
    badgeStatus: 'success' as const
  },
  failed: {
    label: '导入失败',
    color: 'error',
    icon: <ExclamationCircleOutlined />,
    badgeStatus: 'error' as const
  },
  partial: {
    label: '部分成功',
    color: 'warning',
    icon: <ExclamationCircleOutlined />,
    badgeStatus: 'warning' as const
  }
} as const;

/**
 * 联系人导入步骤卡片
 * 
 * 🎯 设计理念：
 * - 基于 UnifiedStepCard 扩展联系人导入功能
 * - 显示导入进度和统计信息
 * - 提供导入控制和结果操作
 */
export const ContactImportStepCard: React.FC<ContactImportStepCardProps> = ({
  stepCard,
  stepIndex,
  importStatus = 'pending',
  importProgress = 0,
  totalContacts = 0,
  importedCount = 0,
  failedCount = 0,
  showStats = true,
  className = '',
  onStartImport,
  onPauseImport,
  onRetryFailed,
  onViewImportDetails,
  onExportResults,
  onUpgradeStrategy,
  onRetryAnalysis,
  onSwitchStrategy
}) => {
  
  const statusConfig = IMPORT_STATUS_CONFIG[importStatus];
  const successRate = totalContacts > 0 ? ((importedCount / totalContacts) * 100) : 0;
  
  // 组合类名
  const combinedClassName = [
    'contact-import-step-card',
    `import-${importStatus}`,
    className
  ].filter(Boolean).join(' ');
  
  // 自定义标题
  const customTitle = (
    <Space>
      <ContactsOutlined />
      <span>{stepCard.stepName}</span>
      <Badge 
        status={statusConfig.badgeStatus}
        text={
          <Tag color={statusConfig.color} icon={statusConfig.icon}>
            {statusConfig.label}
          </Tag>
        }
      />
      {showStats && totalContacts > 0 && (
        <Tag color="blue">
          {importedCount}/{totalContacts}
        </Tag>
      )}
    </Space>
  );
  
  return (
    <div className={combinedClassName} style={{
      margin: '12px 0',
      borderRadius: '8px',
      overflow: 'hidden',
      borderLeft: `4px solid ${
        importStatus === 'pending' ? '#d9d9d9' :
        importStatus === 'importing' ? '#1890ff' :
        importStatus === 'completed' ? '#52c41a' :
        importStatus === 'failed' ? '#ff4d4f' :
        '#faad14'
      }`
    }}>
      {/* 自定义标题区 */}
      <div style={{ padding: '12px 16px', background: '#fafafa', borderBottom: '1px solid #e8e8e8' }}>
        {customTitle}
      </div>
      
      <UnifiedStepCard
        stepCard={stepCard}
        stepIndex={stepIndex}
        className="contact-import-unified"
        onUpgradeStrategy={onUpgradeStrategy}
        onRetryAnalysis={onRetryAnalysis}
        onSwitchStrategy={onSwitchStrategy}
      />
      
      {/* 导入进度显示 */}
      {importStatus === 'importing' && (
        <div style={{
          padding: '8px 16px',
          background: '#f0f7ff',
          borderTop: '1px solid #d6e4ff'
        }}>
          <Progress
            percent={importProgress}
            status="active"
            format={() => `${importProgress}% (${importedCount}/${totalContacts})`}
          />
        </div>
      )}
      
      {/* 统计信息 */}
      {showStats && totalContacts > 0 && (
        <div style={{
          padding: '8px 16px',
          background: '#fafafa',
          fontSize: '12px'
        }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ color: '#666' }}>
              <Space>
                <span>📊 总数: {totalContacts}</span>
                <span>✅ 成功: {importedCount}</span>
                {failedCount > 0 && <span>❌ 失败: {failedCount}</span>}
                <span>📈 成功率: {successRate.toFixed(1)}%</span>
              </Space>
            </div>
            {successRate < 100 && successRate > 0 && (
              <Progress
                percent={successRate}
                size="small"
                strokeColor={successRate > 70 ? '#52c41a' : successRate > 40 ? '#faad14' : '#ff4d4f'}
              />
            )}
          </Space>
        </div>
      )}
      
      {/* 联系人导入操作区 */}
      <div style={{
        padding: '12px 16px',
        background: 'linear-gradient(135deg, #fff7e6 0%, #e6f7ff 100%)',
        borderTop: '1px solid #e8e8e8'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Space>
            {importStatus === 'pending' && onStartImport && (
              <button 
                style={{
                  background: 'white',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  transition: 'all 0.2s ease'
                }}
                onClick={onStartImport}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#52c41a';
                  e.currentTarget.style.color = '#52c41a';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#d9d9d9';
                  e.currentTarget.style.color = 'initial';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                ▶️ 开始导入
              </button>
            )}
            {importStatus === 'importing' && onPauseImport && (
              <button 
                style={{
                  background: 'white',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
                onClick={onPauseImport}
              >
                ⏸️ 暂停导入
              </button>
            )}
            {(importStatus === 'failed' || importStatus === 'partial') && onRetryFailed && failedCount > 0 && (
              <button 
                style={{
                  background: 'white',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
                onClick={onRetryFailed}
              >
                🔄 重试失败 ({failedCount})
              </button>
            )}
            {onViewImportDetails && (
              <button 
                style={{
                  background: 'white',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
                onClick={onViewImportDetails}
              >
                📋 查看详情
              </button>
            )}
            {(importStatus === 'completed' || importStatus === 'partial') && onExportResults && (
              <button 
                style={{
                  background: 'white',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
                onClick={onExportResults}
              >
                📤 导出结果
              </button>
            )}
          </Space>
        </div>
      </div>
    </div>
  );
};

export default ContactImportStepCard;