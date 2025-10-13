// src/components/feature-modules/script-builder/components/StepList.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 脚本步骤列表组件
 * 显示和管理脚本中的所有步骤
 */

import React, { useState, useCallback } from 'react';
import {
  Empty,
  Spin,
  Button,
  Space,
  Dropdown,
  Input,
  Tooltip,
  Modal,
  message,
  MenuProps,
} from 'antd';
import {
  PlusOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { 
  ScriptStep, 
  StepType, 
  StepStatus, 
  StepValidation,
  DragOperation,
} from '../types';
import { ScriptStepCard as StepCard } from './StepCard';

const { Search } = Input;

/**
 * 步骤过滤选项
 */
interface StepFilter {
  type?: StepType;
  status?: StepStatus;
  enabled?: boolean;
  hasErrors?: boolean;
  searchText?: string;
}

/**
 * 步骤排序选项
 */
type StepSortBy = 'order' | 'name' | 'type' | 'status' | 'created' | 'updated';

/**
 * StepList 组件属性
 */
interface StepListProps {
  /** 步骤列表 */
  steps: ScriptStep[];
  /** 当前选中的步骤 */
  selectedStep?: ScriptStep | null;
  /** 正在执行的步骤ID */
  executingStepId?: string;
  /** 执行进度映射 */
  executionProgress?: Map<string, number>;
  /** 验证结果映射 */
  validationResults?: Map<string, StepValidation>;
  /** 是否正在加载 */
  loading?: boolean;
  /** 是否允许拖拽排序 */
  allowDragSort?: boolean;
  /** 是否显示详细信息 */
  showDetails?: boolean;
  /** 是否紧凑模式 */
  compact?: boolean;
  /** 选择步骤 */
  onStepSelect?: (step: ScriptStep | null) => void;
  /** 编辑步骤 */
  onStepEdit?: (step: ScriptStep) => void;
  /** 删除步骤 */
  onStepDelete?: (stepId: string) => void;
  /** 复制步骤 */
  onStepDuplicate?: (stepId: string) => void;
  /** 切换步骤启用状态 */
  onStepToggleEnabled?: (stepId: string, enabled: boolean) => void;
  /** 移动步骤 */
  onStepMove?: (fromIndex: number, toIndex: number) => void;
  /** 添加新步骤 */
  onAddStep?: (type: StepType, insertIndex?: number) => void;
  /** 运行单个步骤 */
  onRunSingleStep?: (stepId: string) => void;
  /** 查看步骤详情 */
  onViewStepDetails?: (step: ScriptStep) => void;
  /** 批量删除步骤 */
  onBatchDelete?: (stepIds: string[]) => void;
}

/**
 * 步骤列表组件
 */
export const StepList: React.FC<StepListProps> = ({
  steps,
  selectedStep,
  executingStepId,
  executionProgress,
  validationResults,
  loading = false,
  allowDragSort = true,
  showDetails = false,
  compact = false,
  onStepSelect,
  onStepEdit,
  onStepDelete,
  onStepDuplicate,
  onStepToggleEnabled,
  onStepMove,
  onAddStep,
  onRunSingleStep,
  onViewStepDetails,
  onBatchDelete,
}) => {
  // 过滤和排序状态
  const [filter, setFilter] = useState<StepFilter>({});
  const [sortBy, setSortBy] = useState<StepSortBy>('order');
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedStepIds, setSelectedStepIds] = useState<string[]>([]);
  const [dragOperation, setDragOperation] = useState<DragOperation | null>(null);

  // 快速添加步骤菜单
  const quickAddMenuItems: MenuProps['items'] = [
    {
      key: 'tap',
      label: '点击步骤',
      onClick: () => onAddStep?.('tap'),
    },
    {
      key: 'input',
      label: '输入步骤',
      onClick: () => onAddStep?.('input'),
    },
    {
      key: 'swipe',
      label: '滑动步骤',
      onClick: () => onAddStep?.('swipe'),
    },
    {
      key: 'wait',
      label: '等待步骤',
      onClick: () => onAddStep?.('wait'),
    },
    {
      type: 'divider',
    },
    {
      key: 'screenshot',
      label: '截图步骤',
      onClick: () => onAddStep?.('screenshot'),
    },
    {
      key: 'loop',
      label: '循环步骤',
      onClick: () => onAddStep?.('loop'),
    },
    {
      key: 'custom',
      label: '自定义步骤',
      onClick: () => onAddStep?.('custom'),
    },
  ];

  // 过滤菜单
  const filterMenuItems: MenuProps['items'] = [
    {
      key: 'all',
      label: '显示全部',
      onClick: () => setFilter({}),
    },
    {
      key: 'enabled',
      label: '仅显示启用',
      onClick: () => setFilter({ enabled: true }),
    },
    {
      key: 'disabled',
      label: '仅显示禁用',
      onClick: () => setFilter({ enabled: false }),
    },
    {
      key: 'errors',
      label: '仅显示错误',
      onClick: () => setFilter({ hasErrors: true }),
    },
    {
      type: 'divider',
    },
    {
      key: 'tap',
      label: '点击步骤',
      onClick: () => setFilter({ type: 'tap' }),
    },
    {
      key: 'input',
      label: '输入步骤',
      onClick: () => setFilter({ type: 'input' }),
    },
    {
      key: 'swipe',
      label: '滑动步骤',
      onClick: () => setFilter({ type: 'swipe' }),
    },
    {
      key: 'wait',
      label: '等待步骤',
      onClick: () => setFilter({ type: 'wait' }),
    },
  ];

  // 排序菜单
  const sortMenuItems: MenuProps['items'] = [
    {
      key: 'order',
      label: '按顺序排序',
      onClick: () => setSortBy('order'),
    },
    {
      key: 'name',
      label: '按名称排序',
      onClick: () => setSortBy('name'),
    },
    {
      key: 'type',
      label: '按类型排序',
      onClick: () => setSortBy('type'),
    },
    {
      key: 'status',
      label: '按状态排序',
      onClick: () => setSortBy('status'),
    },
    {
      key: 'created',
      label: '按创建时间排序',
      onClick: () => setSortBy('created'),
    },
  ];

  // 过滤步骤
  const filteredSteps = steps.filter(step => {
    if (filter.type && step.type !== filter.type) return false;
    if (filter.status && step.status !== filter.status) return false;
    if (filter.enabled !== undefined && step.enabled !== filter.enabled) return false;
    if (filter.hasErrors) {
      const validation = validationResults?.get(step.id);
      if (!validation || validation.isValid) return false;
    }
    if (filter.searchText) {
      const searchText = filter.searchText.toLowerCase();
      return (
        step.name.toLowerCase().includes(searchText) ||
        step.description?.toLowerCase().includes(searchText) ||
        step.type.toLowerCase().includes(searchText)
      );
    }
    return true;
  });

  // 排序步骤
  const sortedSteps = [...filteredSteps].sort((a, b) => {
    let result = 0;
    
    switch (sortBy) {
      case 'order':
        result = a.order - b.order;
        break;
      case 'name':
        result = a.name.localeCompare(b.name);
        break;
      case 'type':
        result = a.type.localeCompare(b.type);
        break;
      case 'status':
        result = a.status.localeCompare(b.status);
        break;
      case 'created':
        result = a.createdAt - b.createdAt;
        break;
      case 'updated':
        result = a.updatedAt - b.updatedAt;
        break;
    }
    
    return sortAsc ? result : -result;
  });

  // 处理步骤点击
  const handleStepClick = useCallback((step: ScriptStep) => {
    onStepSelect?.(selectedStep?.id === step.id ? null : step);
  }, [selectedStep, onStepSelect]);

  // 处理拖拽开始
  const handleDragStart = useCallback((
    e: React.DragEvent, 
    step: ScriptStep, 
    index: number
  ) => {
    if (!allowDragSort) return;
    
    e.dataTransfer.effectAllowed = 'move';
    setDragOperation({
      type: 'step',
      data: step,
      sourceIndex: index,
      isDragging: true,
    });
  }, [allowDragSort]);

  // 处理拖拽结束
  const handleDragEnd = useCallback(() => {
    setDragOperation(null);
  }, []);

  // 处理拖放
  const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (!dragOperation || dragOperation.type !== 'step') return;
    
    const sourceIndex = dragOperation.sourceIndex;
    if (sourceIndex !== targetIndex) {
      onStepMove?.(sourceIndex, targetIndex);
    }
    
    setDragOperation(null);
  }, [dragOperation, onStepMove]);

  // 处理拖拽悬停
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // 处理搜索
  const handleSearch = useCallback((value: string) => {
    setFilter(prev => ({ ...prev, searchText: value }));
  }, []);

  // 批量删除确认
  const handleBatchDelete = useCallback(() => {
    if (selectedStepIds.length === 0) {
      message.warning('请先选择要删除的步骤');
      return;
    }

    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除选中的 ${selectedStepIds.length} 个步骤吗？此操作不可撤销。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        onBatchDelete?.(selectedStepIds);
        setSelectedStepIds([]);
        message.success('已删除选中的步骤');
      },
    });
  }, [selectedStepIds, onBatchDelete]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="step-list">
      {/* 工具栏 */}
      <div style={{ 
        marginBottom: 16, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
      }}>
        <Space wrap>
          <Dropdown menu={{ items: quickAddMenuItems }} placement="bottomLeft">
            <Button type="primary" icon={<PlusOutlined />}>
              添加步骤
            </Button>
          </Dropdown>

          <Dropdown menu={{ items: filterMenuItems }}>
            <Button icon={<FilterOutlined />}>
              过滤
            </Button>
          </Dropdown>

          <Dropdown menu={{ items: sortMenuItems }}>
            <Button 
              icon={<SortAscendingOutlined />}
              onClick={() => setSortAsc(!sortAsc)}
            >
              排序 {sortAsc ? '↑' : '↓'}
            </Button>
          </Dropdown>

          {selectedStepIds.length > 0 && (
            <Button 
              danger 
              icon={<DeleteOutlined />}
              onClick={handleBatchDelete}
            >
              删除选中 ({selectedStepIds.length})
            </Button>
          )}
        </Space>

        <Search
          placeholder="搜索步骤..."
          style={{ width: 200 }}
          onSearch={handleSearch}
          allowClear
        />
      </div>

      {/* 步骤计数 */}
      {filteredSteps.length !== steps.length && (
        <div style={{ 
          marginBottom: 12, 
          fontSize: '14px', 
          color: '#666',
          textAlign: 'center',
        }}>
          显示 {filteredSteps.length} / {steps.length} 个步骤
          {Object.keys(filter).length > 0 && (
            <Button 
              type="link" 
              size="small" 
              onClick={() => setFilter({})}
              style={{ padding: 0, marginLeft: 8 }}
            >
              清除过滤
            </Button>
          )}
        </div>
      )}

      {/* 步骤列表 */}
      {sortedSteps.length === 0 ? (
        <Empty
          description={
            steps.length === 0 
              ? '暂无步骤，点击"添加步骤"开始构建脚本' 
              : '没有符合条件的步骤'
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          {steps.length === 0 && (
            <Dropdown menu={{ items: quickAddMenuItems }}>
              <Button type="primary" icon={<PlusOutlined />}>
                添加第一个步骤
              </Button>
            </Dropdown>
          )}
        </Empty>
      ) : (
        <div className="step-list-content">
          {sortedSteps.map((step, index) => (
            <div
              key={step.id}
              onDrop={(e) => handleDrop(e, index)}
              onDragOver={handleDragOver}
              style={{ position: 'relative' }}
            >
              <StepCard
                step={step}
                index={step.order}
                isSelected={selectedStep?.id === step.id}
                isExecuting={executingStepId === step.id}
                executionProgress={executionProgress?.get(step.id)}
                validation={validationResults?.get(step.id)}
                draggable={allowDragSort}
                showDetails={showDetails}
                onStepClick={handleStepClick}
                onEdit={onStepEdit}
                onDelete={onStepDelete}
                onDuplicate={onStepDuplicate}
                onToggleEnabled={onStepToggleEnabled}
                onRunSingle={onRunSingleStep}
                onViewDetails={onViewStepDetails}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              />
              
              {/* 拖拽插入指示器 */}
              {dragOperation?.isDragging && (
                <div
                  style={{
                    height: 2,
                    background: '#1890ff',
                    margin: '4px 0',
                    opacity: 0.8,
                    borderRadius: 1,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};