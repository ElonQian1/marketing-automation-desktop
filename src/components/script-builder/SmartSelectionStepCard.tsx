// src/components/script-builder/SmartSelectionStepCard.tsx
// module: script-builder | layer: ui | role: 智能选择步骤卡片组件
// summary: 在脚本构建器中集成智能选择功能的步骤卡片

import React, { useState, useCallback } from 'react';
import { Card, Select, InputNumber, Switch, Input, Space, Button, Tooltip, Alert, Tag } from 'antd';
import { BulbOutlined, TargetOutlined, SettingOutlined, PlayCircleOutlined } from '@ant-design/icons';
import type { SmartSelectionProtocol } from '../../types/smartSelection';
import { SmartSelectionService } from '../../services/smartSelectionService';
import type { CandidatePreviewResult } from '../../services/smartSelectionService';

export interface SmartSelectionStepCardProps {
  /**
   * 步骤ID
   */
  stepId: string;
  
  /**
   * 当前设备ID
   */
  deviceId?: string;
  
  /**
   * 智能选择协议配置
   */
  protocol?: SmartSelectionProtocol;
  
  /**
   * 配置变更回调
   */
  onChange?: (protocol: SmartSelectionProtocol) => void;
  
  /**
   * 是否处于编辑模式
   */
  isEditing?: boolean;
  
  /**
   * 是否显示高级选项
   */
  showAdvanced?: boolean;
}

/**
 * 智能选择步骤卡片组件
 */
export const SmartSelectionStepCard: React.FC<SmartSelectionStepCardProps> = ({
  stepId,
  deviceId,
  protocol,
  onChange,
  isEditing = true,
  showAdvanced = false,
}) => {
  const [currentProtocol, setCurrentProtocol] = useState<SmartSelectionProtocol>(
    protocol || SmartSelectionService.createProtocol({})
  );
  const [preview, setPreview] = useState<CandidatePreviewResult | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string>('');

  // 更新协议配置
  const updateProtocol = useCallback((updates: Partial<SmartSelectionProtocol>) => {
    const newProtocol = { ...currentProtocol, ...updates };
    setCurrentProtocol(newProtocol);
    onChange?.(newProtocol);
  }, [currentProtocol, onChange]);

  // 预览候选元素
  const handlePreview = useCallback(async () => {
    if (!deviceId) {
      setValidationMessage('❌ 需要连接设备才能预览');
      return;
    }

    setIsPreviewLoading(true);
    setValidationMessage('');
    
    try {
      const result = await SmartSelectionService.previewCandidates(deviceId, currentProtocol);
      setPreview(result);
      
      if (result.total_found === 0) {
        setValidationMessage('⚠️ 未找到匹配的元素');
      } else {
        setValidationMessage(`✅ 找到 ${result.total_found} 个候选元素，将选择 ${result.selection_preview.would_select_count} 个`);
      }
    } catch (error) {
      setValidationMessage(`❌ 预览失败: ${error}`);
      setPreview(null);
    } finally {
      setIsPreviewLoading(false);
    }
  }, [deviceId, currentProtocol]);

  // 快速配置模板
  const applyTemplate = useCallback((template: 'batch-follow' | 'precise-match' | 'first-element') => {
    let newProtocol: SmartSelectionProtocol;
    
    switch (template) {
      case 'batch-follow':
        newProtocol = SmartSelectionService.createBatchFollowProtocol();
        break;
      case 'precise-match':
        newProtocol = SmartSelectionService.createPreciseMatchProtocol({
          targetText: currentProtocol.anchor.fingerprint.text_content || '关注',
        });
        break;
      case 'first-element':
        newProtocol = SmartSelectionService.createProtocol({
          text: currentProtocol.anchor.fingerprint.text_content || '关注',
          mode: 'first',
        });
        break;
      default:
        return;
    }
    
    setCurrentProtocol(newProtocol);
    onChange?.(newProtocol);
  }, [currentProtocol, onChange]);

  return (
    <Card
      className="light-theme-force smart-selection-step-card"
      title={
        <Space>
          <BulbOutlined style={{ color: '#1890ff' }} />
          <span>智能选择步骤</span>
          <Tag color="blue">AI增强</Tag>
        </Space>
      }
      extra={
        isEditing && (
          <Space>
            <Tooltip title="预览候选元素">
              <Button 
                icon={<TargetOutlined />}
                size="small"
                onClick={handlePreview}
                loading={isPreviewLoading}
                disabled={!deviceId}
              >
                预览
              </Button>
            </Tooltip>
            <Tooltip title="执行测试">
              <Button 
                icon={<PlayCircleOutlined />}
                type="primary"
                size="small"
                disabled={!deviceId}
              >
                测试
              </Button>
            </Tooltip>
          </Space>
        )
      }
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* 快速模板选择 */}
        {isEditing && (
          <div>
            <span className="config-label">快速配置模板:</span>
            <Space>
              <Button size="small" onClick={() => applyTemplate('batch-follow')}>
                批量关注
              </Button>
              <Button size="small" onClick={() => applyTemplate('precise-match')}>
                精确匹配
              </Button>
              <Button size="small" onClick={() => applyTemplate('first-element')}>
                选择第一个
              </Button>
            </Space>
          </div>
        )}

        {/* 基础配置 */}
        <div>
          <div className="config-item">
            <span className="config-label">目标文本:</span>
            <Input
              placeholder="例如: 关注"
              value={currentProtocol.anchor.fingerprint.text_content || ''}
              onChange={(e) => updateProtocol({
                anchor: {
                  ...currentProtocol.anchor,
                  fingerprint: {
                    ...currentProtocol.anchor.fingerprint,
                    text_content: e.target.value || undefined,
                  },
                },
              })}
              disabled={!isEditing}
            />
          </div>

          <div className="config-item">
            <span className="config-label">选择模式:</span>
            <Select
              value={currentProtocol.selection.mode}
              onChange={(mode) => updateProtocol({
                selection: { ...currentProtocol.selection, mode },
              })}
              disabled={!isEditing}
              style={{ width: 200 }}
            >
              <Select.Option value="match-original">精确匹配</Select.Option>
              <Select.Option value="first">选择第一个</Select.Option>
              <Select.Option value="last">选择最后一个</Select.Option>
              <Select.Option value="random">随机选择</Select.Option>
              <Select.Option value="all">批量操作</Select.Option>
            </Select>
          </div>

          {/* 批量模式配置 */}
          {currentProtocol.selection.mode === 'all' && (
            <div className="config-item">
              <span className="config-label">批量间隔 (毫秒):</span>
              <InputNumber
                min={500}
                max={10000}
                value={currentProtocol.selection.batch_config?.interval_ms || 2000}
                onChange={(value) => updateProtocol({
                  selection: {
                    ...currentProtocol.selection,
                    batch_config: {
                      ...currentProtocol.selection.batch_config,
                      interval_ms: value || 2000,
                      continue_on_error: true,
                      show_progress: true,
                    },
                  },
                })}
                disabled={!isEditing}
                style={{ width: 150 }}
              />
            </div>
          )}
        </div>

        {/* 高级配置 */}
        {showAdvanced && (
          <>
            <div className="config-item">
              <span className="config-label">资源ID:</span>
              <Input
                placeholder="例如: com.xingin.xhs:id/follow_btn"
                value={currentProtocol.anchor.fingerprint.resource_id || ''}
                onChange={(e) => updateProtocol({
                  anchor: {
                    ...currentProtocol.anchor,
                    fingerprint: {
                      ...currentProtocol.anchor.fingerprint,
                      resource_id: e.target.value || undefined,
                    },
                  },
                })}
                disabled={!isEditing}
              />
            </div>

            <div className="config-item">
              <span className="config-label">容器XPath:</span>
              <Input
                placeholder="限制搜索范围的容器XPath"
                value={currentProtocol.matching_context?.container_xpath || ''}
                onChange={(e) => updateProtocol({
                  matching_context: {
                    ...currentProtocol.matching_context,
                    container_xpath: e.target.value || undefined,
                  },
                })}
                disabled={!isEditing}
              />
            </div>

            <div className="config-item">
              <span className="config-label">最低置信度:</span>
              <InputNumber
                min={0}
                max={1}
                step={0.1}
                value={currentProtocol.selection.filters?.min_confidence || 0.7}
                onChange={(value) => updateProtocol({
                  selection: {
                    ...currentProtocol.selection,
                    filters: {
                      ...currentProtocol.selection.filters,
                      min_confidence: value || 0.7,
                    },
                  },
                })}
                disabled={!isEditing}
                style={{ width: 120 }}
              />
            </div>
          </>
        )}

        {/* 验证消息 */}
        {validationMessage && (
          <Alert
            message={validationMessage}
            type={validationMessage.startsWith('✅') ? 'success' : 
                  validationMessage.startsWith('⚠️') ? 'warning' : 'error'}
            showIcon
            closable
          />
        )}

        {/* 预览结果 */}
        {preview && (
          <Card size="small" title="候选元素预览" className="preview-card">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                总计找到: <Tag color="blue">{preview.total_found}</Tag>
                将选择: <Tag color="green">{preview.selection_preview.would_select_count}</Tag>
                预计用时: <Tag>{preview.selection_preview.estimated_execution_time_ms}ms</Tag>
              </div>
              
              {preview.candidates.slice(0, 3).map((candidate, index) => (
                <div key={index} className="candidate-item">
                  <Space>
                    <Tag color={candidate.would_be_selected ? 'green' : 'default'}>
                      #{candidate.index}
                    </Tag>
                    <span>{candidate.text || candidate.resource_id}</span>
                    <span className="confidence">置信度: {(candidate.confidence * 100).toFixed(0)}%</span>
                  </Space>
                </div>
              ))}
              
              {preview.candidates.length > 3 && (
                <div>... 还有 {preview.candidates.length - 3} 个候选元素</div>
              )}
            </Space>
          </Card>
        )}
      </Space>

      <style jsx>{`
        .smart-selection-step-card {
          border-left: 4px solid #1890ff;
        }
        
        .config-item {
          margin-bottom: 12px;
        }
        
        .config-label {
          display: inline-block;
          width: 120px;
          margin-right: 8px;
          font-weight: 500;
          color: #262626;
        }
        
        .preview-card {
          background-color: #f8f9fa;
        }
        
        .candidate-item {
          padding: 4px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .confidence {
          color: #666;
          font-size: 12px;
        }
      `}</style>
    </Card>
  );
};

export default SmartSelectionStepCard;