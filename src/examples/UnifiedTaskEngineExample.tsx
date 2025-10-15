// src/examples/UnifiedTaskEngineExample.tsx
// module: examples | layer: examples | role: 统一任务引擎示例
// summary: 统一任务引擎的功能演示和使用示例（已禁用）

// @ts-nocheck

/**
 * 统一任务引擎使用示例
 * 
 * 🎯 目标：展示如何使用新的统一任务引擎接口
 * 📅 创建：任务引擎架构整合阶段
 * 
 * ✅ 包含内容：
 * - 基础使用示例
 * - 高级功能演示
 * - 迁移对比
 * - 最佳实践
 */

import React, { useEffect, useState } from 'react';
import { Button, Card, Table, message, Space, Tag } from 'antd';

// 🎯 导入统一接口 (推荐方式)
import { 
  useUnifiedTaskEngine,
  enhancedTaskEngineManager,
  type UnifiedTaskGenerationParams,
  type UnifiedTaskExecutionParams,
  ExecutionStrategy
} from '@/application/task-engine';

// 🔄 兼容性导入 (现有代码无需修改)
import {
  TaskExecutionEngine,
  useTaskEngine
} from '@/application/task-engine';

import { Task, WatchTarget } from '@/modules/precise-acquisition/shared/types/core';
import { TaskStatus, TaskType } from '@/constants/precise-acquisition-enums';

// ==================== 新接口使用示例 ====================

/**
 * 🚀 统一任务引擎完整示例
 * 
 * 展示如何使用新的统一接口进行任务管理
 */
export function UnifiedTaskEngineExample() {
  // 🎯 使用统一Hook，获取所有功能
  const {
    // 状态
    tasks,
    currentTask,
    isGenerating,
    isExecuting,
    isQuerying,
    stats,
    pagination,
    
    // 错误状态
    generationError,
    executionError,
    queryError,
    
    // 功能方法
    generateTasks,
    executeTask,
    executeTasks,
    queryTasks,
    refreshTasks,
    loadMoreTasks,
    assignTasksToDevice,
    updateTaskStatus,
    retryTask,
    loadStats,
    
    // 状态管理
    clearErrors,
    setCurrentTask
  } = useUnifiedTaskEngine({
    // 🔄 配置选项
    autoLoad: true,
    autoLoadParams: { 
      page: 1, 
      page_size: 20,
      status: [TaskStatus.PENDING, TaskStatus.EXECUTING]
    },
    enableRealTimeUpdates: true,
    updateInterval: 30000, // 30秒自动刷新
    enableAutoRetry: true,
    maxRetries: 3,
    enableCaching: true
  });

  // ==================== 任务生成示例 ====================
  
  const handleGenerateTasks = async () => {
    try {
      const targetUser: WatchTarget = {
        id: 'target-123',
        platform: 'xiaohongshu' as any,
        user_id: 'user-456',
        nickname: '目标用户',
        avatar_url: 'https://example.com/avatar.jpg'
      };

      const params: UnifiedTaskGenerationParams = {
        target: targetUser,
        max_tasks_per_target: 5,
        task_types: [TaskType.FOLLOW, TaskType.LIKE, TaskType.COMMENT],
        priority: 'high',
        execution_strategy: ExecutionStrategy.API_FIRST,
        assignment_strategy: 'round_robin',
        schedule_delay_hours: 1,
        required_device_count: 2
      };

      const result = await generateTasks(params);
      
      message.success(`成功生成 ${result.total_count} 个任务`);
      console.log('生成结果:', result);
      
    } catch (error) {
      message.error(`任务生成失败: ${error.message}`);
    }
  };

  // ==================== 任务执行示例 ====================
  
  const handleExecuteTask = async (task: Task) => {
    try {
      const params: UnifiedTaskExecutionParams = {
        task,
        execution_strategy: ExecutionStrategy.API_FIRST,
        custom_message: '这是自定义消息',
        template_id: 'template-001',
        target_info: {
          nickname: '目标昵称',
          topic: '美食分享',
          industry: '餐饮',
          region: '上海'
        }
      };

      const result = await executeTask(params);
      
      if (result.status === TaskStatus.COMPLETED) {
        message.success(`任务执行成功，耗时 ${result.execution_time_ms}ms`);
      } else {
        message.error(`任务执行失败: ${result.error_message}`);
      }
      
    } catch (error) {
      message.error(`执行失败: ${error.message}`);
    }
  };

  // ==================== 批量执行示例 ====================
  
  const handleBatchExecute = async () => {
    try {
      const pendingTasks = tasks.filter(t => t.status === TaskStatus.PENDING);
      
      if (pendingTasks.length === 0) {
        message.warning('没有待执行的任务');
        return;
      }

      const results = await executeTasks(pendingTasks);
      const successCount = results.filter(r => r.status === TaskStatus.COMPLETED).length;
      
      message.success(`批量执行完成，成功: ${successCount}/${results.length}`);
      
    } catch (error) {
      message.error(`批量执行失败: ${error.message}`);
    }
  };

  // ==================== 任务分配示例 ====================
  
  const handleAssignTasks = async () => {
    try {
      const unassignedTasks = tasks.filter(t => !t.assigned_device_id);
      const taskIds = unassignedTasks.map(t => t.id);
      
      if (taskIds.length === 0) {
        message.warning('没有可分配的任务');
        return;
      }

      const result = await assignTasksToDevice('device-001', taskIds);
      
      message.success(`成功分配 ${result.total_assigned} 个任务给设备`);
      
    } catch (error) {
      message.error(`任务分配失败: ${error.message}`);
    }
  };

  // ==================== 任务查询示例 ====================
  
  const handleAdvancedQuery = async () => {
    try {
      const result = await queryTasks({
        status: [TaskStatus.COMPLETED, TaskStatus.FAILED],
        task_type: [TaskType.FOLLOW, TaskType.LIKE],
        created_since: new Date(Date.now() - 24 * 60 * 60 * 1000), // 最近24小时
        order_by: 'created_at',
        order_direction: 'desc',
        limit: 10
      });
      
      console.log('查询结果:', result);
      message.info(`查询到 ${result.total} 个匹配任务`);
      
    } catch (error) {
      message.error(`查询失败: ${error.message}`);
    }
  };

  // ==================== 统计功能示例 ====================
  
  useEffect(() => {
    // 自动加载统计数据
    loadStats();
  }, [loadStats]);

  // ==================== 表格配置 ====================
  
  const columns = [
    {
      title: '任务ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (id: string) => (
        <Button 
          type="link" 
          size="small"
          onClick={() => setCurrentTask(tasks.find(t => t.id === id) || null)}
        >
          {id.slice(0, 8)}...
        </Button>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: TaskType) => (
        <Tag color="blue">{type}</Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: TaskStatus) => {
        const colorMap = {
          [TaskStatus.PENDING]: 'orange',
          [TaskStatus.EXECUTING]: 'blue',
          [TaskStatus.COMPLETED]: 'green',
          [TaskStatus.FAILED]: 'red',
          [TaskStatus.CANCELLED]: 'gray'
        };
        return <Tag color={colorMap[status]}>{status}</Tag>;
      }
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={priority === 'high' ? 'red' : priority === 'normal' ? 'blue' : 'gray'}>
          {priority}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, task: Task) => (
        <Space>
          {task.status === TaskStatus.PENDING && (
            <Button 
              size="small" 
              type="primary"
              loading={isExecuting}
              onClick={() => handleExecuteTask(task)}
            >
              执行
            </Button>
          )}
          {task.status === TaskStatus.FAILED && (
            <Button 
              size="small"
              onClick={() => retryTask(task.id)}
            >
              重试
            </Button>
          )}
          <Button 
            size="small" 
            danger
            onClick={() => updateTaskStatus(task.id, TaskStatus.CANCELLED)}
          >
            取消
          </Button>
        </Space>
      )
    }
  ];

  // ==================== 渲染UI ====================
  
  return (
    <div style={{ padding: 24 }}>
      <h2>📋 统一任务引擎示例</h2>
      
      {/* 错误提示 */}
      {(generationError || executionError || queryError) && (
        <Card style={{ marginBottom: 16, borderColor: '#ff4d4f' }}>
          <p style={{ color: '#ff4d4f', margin: 0 }}>
            错误: {generationError || executionError || queryError}
            <Button type="link" onClick={clearErrors}>清除</Button>
          </p>
        </Card>
      )}

      {/* 操作按钮 */}
      <Card title="🚀 操作面板" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Button 
            type="primary" 
            loading={isGenerating}
            onClick={handleGenerateTasks}
          >
            生成任务
          </Button>
          
          <Button 
            loading={isExecuting}
            onClick={handleBatchExecute}
          >
            批量执行
          </Button>
          
          <Button onClick={handleAssignTasks}>
            分配任务
          </Button>
          
          <Button onClick={handleAdvancedQuery}>
            高级查询
          </Button>
          
          <Button onClick={refreshTasks}>
            刷新列表
          </Button>
          
          <Button onClick={() => loadStats()}>
            更新统计
          </Button>
        </Space>
      </Card>

      {/* 统计信息 */}
      {stats && (
        <Card title="📊 执行统计" style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                {stats.total_tasks}
              </div>
              <div style={{ color: '#666' }}>总任务数</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                {stats.completed_tasks}
              </div>
              <div style={{ color: '#666' }}>已完成</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>
                {stats.pending_tasks}
              </div>
              <div style={{ color: '#666' }}>待处理</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f5222d' }}>
                {stats.failed_tasks}
              </div>
              <div style={{ color: '#666' }}>失败</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#722ed1' }}>
                {stats.success_rate.toFixed(1)}%
              </div>
              <div style={{ color: '#666' }}>成功率</div>
            </div>
          </div>
        </Card>
      )}

      {/* 任务列表 */}
      <Card title="📝 任务列表">
        <Table
          dataSource={tasks}
          columns={columns}
          rowKey="id"
          loading={isQuerying}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
          scroll={{ x: 800 }}
        />
        
        {/* 加载更多 */}
        {pagination.hasMore && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button onClick={loadMoreTasks}>
              加载更多
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

// ==================== 兼容性对比示例 ====================

/**
 * 🔄 现有代码兼容性示例
 * 
 * 展示现有代码如何无缝使用新架构
 */
export function CompatibilityExample() {
  // ✅ 原有代码保持不变，适配器自动处理
  const engine = new TaskExecutionEngine(); // 实际使用适配器
  const { executeTask, isLoading } = useTaskEngine(); // 实际使用适配器

  const handleLegacyExecution = async (task: Task) => {
    try {
      // 🔄 原有接口格式，完全兼容
      const result = await engine.executeTask(
        task,
        undefined, // device
        undefined, // account
        {
          strategy: ExecutionStrategy.API_FIRST,
          custom_message: '兼容性测试'
        }
      );
      
      console.log('兼容执行结果:', result);
    } catch (error) {
      console.error('兼容执行失败:', error);
    }
  };

  return (
    <Card title="🔄 兼容性示例">
      <p>现有代码无需修改，自动使用统一架构:</p>
      <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
{`// 原有代码保持不变
const engine = new TaskExecutionEngine();
const result = await engine.executeTask(task);

// Hook使用方式也完全兼容
const { executeTask } = useTaskEngine();
await executeTask(task);`}
      </pre>
    </Card>
  );
}

// ==================== 最佳实践示例 ====================

/**
 * 📚 最佳实践示例
 */
export function BestPracticesExample() {
  return (
    <Card title="📚 最佳实践指南">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        
        <div>
          <h4>🎯 新项目推荐用法:</h4>
          <pre style={{ background: '#f6ffed', padding: 12, borderRadius: 4 }}>
{`import { useUnifiedTaskEngine } from '@/application/task-engine';

const { generateTasks, executeTask, queryTasks } = useUnifiedTaskEngine({
  autoLoad: true,
  enableRealTimeUpdates: true,
  enableAutoRetry: true
});`}
          </pre>
        </div>

        <div>
          <h4>🔄 渐进式迁移路径:</h4>
          <pre style={{ background: '#fff7e6', padding: 12, borderRadius: 4 }}>
{`// 第一阶段：保持现有导入不变
import { TaskExecutionEngine } from '@/application/task-engine';

// 第二阶段：切换到统一Hook
import { useUnifiedTaskEngine } from '@/application/task-engine';

// 第三阶段：使用完整统一功能
const taskEngine = useUnifiedTaskEngine();`}
          </pre>
        </div>

        <div>
          <h4>⚡ 性能优化建议:</h4>
          <ul>
            <li>启用缓存: <code>enableCaching: true</code></li>
            <li>配置合理的刷新间隔: <code>updateInterval: 30000</code></li>
            <li>使用分页查询避免大量数据加载</li>
            <li>启用自动重试减少手动处理</li>
          </ul>
        </div>

        <div>
          <h4>🛡️ 错误处理最佳实践:</h4>
          <ul>
            <li>监听各种错误状态: <code>generationError, executionError, queryError</code></li>
            <li>提供错误清除机制: <code>clearErrors()</code></li>
            <li>使用try-catch包装关键操作</li>
            <li>配置合理的重试策略</li>
          </ul>
        </div>

      </div>
    </Card>
  );
}

// ==================== 默认导出 ====================

export default UnifiedTaskEngineExample;