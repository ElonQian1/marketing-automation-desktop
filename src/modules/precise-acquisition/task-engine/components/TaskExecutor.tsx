// src/modules/precise-acquisition/task-engine/components/TaskExecutor.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 任务执行器React组件
 * 
 * 提供任务执行控制面板，支持单个任务执行和批量执行
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Select,
  Input,
  message,
  Popconfirm,
  Progress,
  Typography,
  Divider,
  Alert
} from 'antd';
import {
  PlayCircleOutlined,
  RedoOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  EditOutlined
} from '@ant-design/icons';

import { Task, TaskStatus, TaskType, ExecutorMode, ResultCode } from '../../shared/types/core';
import { ProspectingTaskExecutorService, TaskExecutionContext, TaskExecutionResult } from '../services/prospecting-task-executor-service';
import { TemplateManagementService } from '../../template-management';
import { ReplyTemplate } from '../../shared/types/core';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface TaskExecutorProps {
  tasks: Task[];
  onTasksUpdated?: () => void;
}

/**
 * 任务状态颜色映射
 */
const getStatusColor = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.PENDING: return 'default';
    case TaskStatus.EXECUTING: return 'processing';
    case TaskStatus.DONE: return 'success';
    case TaskStatus.FAILED: return 'error';
    default: return 'default';
  }
};

/**
 * 执行模式标签
 */
const ExecutorModeTag: React.FC<{ mode: ExecutorMode }> = ({ mode }) => {
  const config = {
    [ExecutorMode.API]: { color: 'blue', text: 'API自动' },
    [ExecutorMode.MANUAL]: { color: 'orange', text: '半自动' }
  };
  
  return <Tag color={config[mode].color}>{config[mode].text}</Tag>;
};

export const TaskExecutor: React.FC<TaskExecutorProps> = ({ tasks, onTasksUpdated }) => {
  const [executorService] = useState(() => new ProspectingTaskExecutorService());
  const [templateService] = useState(() => new TemplateManagementService());
  
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [executionResults, setExecutionResults] = useState<Map<string, TaskExecutionResult>>(new Map());
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);
  
  // 执行配置弹窗
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [executionForm] = Form.useForm();
  
  // 模板数据
  const [templates, setTemplates] = useState<ReplyTemplate[]>([]);
  
  // 结果查看弹窗
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [currentResult, setCurrentResult] = useState<TaskExecutionResult | null>(null);

  /**
   * 加载模板数据
   */
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templateList = await templateService.getTemplates();
        setTemplates(templateList);
      } catch (error) {
        console.error('加载模板失败:', error);
      }
    };
    
    loadTemplates();
  }, [templateService]);

  /**
   * 表格列定义
   */
  const columns = [
    {
      title: '任务ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (id: string) => (
        <Text code copyable={{ text: id }}>
          {id.slice(-8)}
        </Text>
      )
    },
    {
      title: '任务类型',
      dataIndex: 'task_type',
      key: 'task_type',
      width: 100,
      render: (type: TaskType) => (
        <Tag color={type === TaskType.REPLY ? 'blue' : 'green'}>
          {type === TaskType.REPLY ? '回复' : '关注'}
        </Tag>
      )
    },
    {
      title: '目标用户',
      dataIndex: 'target_user_id',
      key: 'target_user',
      width: 150,
      render: (_: string, record: Task) => (
        <div>
          <div>{record.target_nickname || '未知用户'}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.target_user_id?.slice(-8)}
          </Text>
        </div>
      )
    },
    {
      title: '执行模式',
      dataIndex: 'executor_mode',
      key: 'executor_mode',
      width: 100,
      render: (mode: ExecutorMode) => <ExecutorModeTag mode={mode} />
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: TaskStatus) => (
        <Tag color={getStatusColor(status)}>
          {status === TaskStatus.PENDING && '待执行'}
          {status === TaskStatus.EXECUTING && '执行中'}
          {status === TaskStatus.DONE && '已完成'}
          {status === TaskStatus.FAILED && '失败'}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date: Date) => new Date(date).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: unknown, record: Task) => {
        const result = executionResults.get(record.id);
        
        return (
          <Space size="small">
            {record.status === TaskStatus.PENDING && (
              <Button
                type="primary"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => handleSingleTaskExecution(record)}
                disabled={isExecuting}
              >
                执行
              </Button>
            )}
            
            {record.status === TaskStatus.EXECUTING && record.executor_mode === ExecutorMode.MANUAL && (
              <Popconfirm
                title="确认任务已手动完成？"
                onConfirm={() => handleManualTaskConfirmation(record.id, true)}
                okText="完成"
                cancelText="失败"
                onCancel={() => handleManualTaskConfirmation(record.id, false)}
              >
                <Button
                  type="default"
                  size="small"
                  icon={<CheckCircleOutlined />}
                >
                  确认完成
                </Button>
              </Popconfirm>
            )}
            
            {record.status === TaskStatus.FAILED && (
              <Button
                type="default"
                size="small"
                icon={<RedoOutlined />}
                onClick={() => handleSingleTaskExecution(record)}
                disabled={isExecuting}
              >
                重试
              </Button>
            )}
            
            {result && (
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleViewResult(result)}
              >
                查看结果
              </Button>
            )}
            
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleConfigureTask(record)}
            >
              配置
            </Button>
          </Space>
        );
      }
    }
  ];

  /**
   * 处理单个任务执行
   */
  const handleSingleTaskExecution = (task: Task) => {
    setCurrentTask(task);
    setConfigModalVisible(true);
    
    // 预填充表单
    executionForm.setFieldsValue({
      template_id: '',
      custom_message: '',
      target_nickname: task.target_nickname || '',
      target_topic: '',
      target_industry: '',
      target_region: ''
    });
  };

  /**
   * 处理批量任务执行
   */
  const handleBatchTaskExecution = async () => {
    if (selectedTasks.length === 0) {
      message.warning('请选择要执行的任务');
      return;
    }
    
    setIsExecuting(true);
    setExecutionProgress(0);
    
    try {
      const tasksToExecute = tasks.filter(task => 
        selectedTasks.includes(task.id) && task.status === TaskStatus.PENDING
      );
      
      const contexts: TaskExecutionContext[] = tasksToExecute.map(task => ({
        task,
        // 批量执行使用默认配置
      }));
      
      const results = await executorService.executeBatchTasks(contexts);
      
      // 更新结果
      const newResults = new Map(executionResults);
      results.forEach(result => {
        newResults.set(result.task_id, result);
      });
      setExecutionResults(newResults);
      
      // 通知父组件更新
      onTasksUpdated?.();
      
      message.success(`批量执行完成，成功执行 ${results.filter(r => r.result_code === ResultCode.OK).length} 个任务`);
      
    } catch (error) {
      message.error(`批量执行失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsExecuting(false);
      setExecutionProgress(0);
      setSelectedTasks([]);
    }
  };

  /**
   * 执行单个任务（配置后）
   */
  const handleExecuteWithConfig = async (values: Record<string, unknown>) => {
    if (!currentTask) return;
    
    setConfigModalVisible(false);
    setIsExecuting(true);
    
    try {
      const context: TaskExecutionContext = {
        task: currentTask,
        template_id: values.template_id || undefined,
        custom_message: values.custom_message || undefined,
        target_info: {
          nickname: values.target_nickname || undefined,
          topic: values.target_topic || undefined,
          industry: values.target_industry || undefined,
          region: values.target_region || undefined
        }
      };
      
      const result = await executorService.executeTask(context);
      
      // 更新结果
      const newResults = new Map(executionResults);
      newResults.set(result.task_id, result);
      setExecutionResults(newResults);
      
      // 通知父组件更新
      onTasksUpdated?.();
      
      if (result.result_code === ResultCode.OK) {
        message.success('任务执行成功');
      } else {
        message.error(`任务执行失败: ${result.error_message}`);
      }
      
    } catch (error) {
      message.error(`任务执行失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsExecuting(false);
    }
  };

  /**
   * 手动任务确认
   */
  const handleManualTaskConfirmation = async (taskId: string, successful: boolean) => {
    try {
      await executorService.confirmManualTaskCompletion(taskId, successful);
      
      // 通知父组件更新
      onTasksUpdated?.();
      
      message.success(successful ? '任务标记为完成' : '任务标记为失败');
      
    } catch (error) {
      message.error(`操作失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  /**
   * 查看执行结果
   */
  const handleViewResult = (result: TaskExecutionResult) => {
    setCurrentResult(result);
    setResultModalVisible(true);
  };

  /**
   * 配置任务
   */
  const handleConfigureTask = (task: Task) => {
    setCurrentTask(task);
    setConfigModalVisible(true);
    
    // 预填充表单
    executionForm.setFieldsValue({
      template_id: '',
      custom_message: '',
      target_nickname: task.target_nickname || '',
      target_topic: '',
      target_industry: '',
      target_region: ''
    });
  };

  // 统计数据
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === TaskStatus.PENDING).length,
    executing: tasks.filter(t => t.status === TaskStatus.EXECUTING).length,
    done: tasks.filter(t => t.status === TaskStatus.DONE).length,
    failed: tasks.filter(t => t.status === TaskStatus.FAILED).length
  };

  return (
    <div className="light-theme-force" style={{ background: 'var(--bg-light-base)' }}>
      <Card title="任务执行器" style={{ background: 'var(--bg-light-base)' }}>
        {/* 统计信息 */}
        <div style={{ marginBottom: 16 }}>
          <Space size="large">
            <div>
              <Text strong>总计:</Text>
              <Text style={{ marginLeft: 8, fontSize: '18px', color: 'var(--text-inverse)' }}>{stats.total}</Text>
            </div>
            <div>
              <Text strong>待执行:</Text>
              <Text style={{ marginLeft: 8, fontSize: '18px', color: '#fa8c16' }}>{stats.pending}</Text>
            </div>
            <div>
              <Text strong>执行中:</Text>
              <Text style={{ marginLeft: 8, fontSize: '18px', color: '#1890ff' }}>{stats.executing}</Text>
            </div>
            <div>
              <Text strong>已完成:</Text>
              <Text style={{ marginLeft: 8, fontSize: '18px', color: '#52c41a' }}>{stats.done}</Text>
            </div>
            <div>
              <Text strong>失败:</Text>
              <Text style={{ marginLeft: 8, fontSize: '18px', color: '#ff4d4f' }}>{stats.failed}</Text>
            </div>
          </Space>
        </div>

        <Divider />

        {/* 批量操作 */}
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={handleBatchTaskExecution}
              disabled={isExecuting || selectedTasks.length === 0}
              loading={isExecuting}
            >
              批量执行 ({selectedTasks.length})
            </Button>
            
            <Button
              icon={<RedoOutlined />}
              disabled={isExecuting}
              onClick={() => onTasksUpdated?.()}
            >
              刷新
            </Button>
            
            {isExecuting && (
              <div style={{ marginLeft: 16 }}>
                <Progress
                  percent={executionProgress}
                  size="small"
                  style={{ width: 200 }}
                />
              </div>
            )}
          </Space>
        </div>

        {/* 任务表格 */}
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          size="small"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个任务`
          }}
          rowSelection={{
            selectedRowKeys: selectedTasks,
            onChange: (selectedRowKeys) => setSelectedTasks(selectedRowKeys as string[]),
            getCheckboxProps: (record: Task) => ({
              disabled: record.status !== TaskStatus.PENDING || isExecuting
            })
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* 任务配置弹窗 */}
      <Modal
        title={`配置任务执行`}
        open={configModalVisible}
        onCancel={() => setConfigModalVisible(false)}
        onOk={() => executionForm.submit()}
        width={600}
        okText="执行"
        cancelText="取消"
        confirmLoading={isExecuting}
      >
        <Form
          form={executionForm}
          layout="vertical"
          onFinish={handleExecuteWithConfig}
        >
          <Alert
            message="执行模式说明"
            description="API优先：优先使用官方API执行，失败时自动降级为半自动模式。半自动模式：系统打开页面，用户手动完成操作。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Form.Item
            label="回复模板"
            name="template_id"
            help="选择预设模板，留空表示使用自定义内容"
          >
            <Select
              placeholder="请选择模板"
              allowClear
              options={templates.map(template => ({
                label: template.template_name,
                value: template.id
              }))}
            />
          </Form.Item>
          
          <Form.Item
            label="自定义内容"
            name="custom_message"
            help="自定义回复内容，优先级高于模板"
          >
            <TextArea
              rows={3}
              placeholder="输入自定义回复内容"
              maxLength={500}
              showCount
            />
          </Form.Item>
          
          <Divider orientation="left">目标用户信息</Divider>
          
          <Form.Item
            label="用户昵称"
            name="target_nickname"
          >
            <Input placeholder="目标用户昵称" />
          </Form.Item>
          
          <Form.Item
            label="关注话题"
            name="target_topic"
          >
            <Input placeholder="用户关注的话题" />
          </Form.Item>
          
          <Form.Item
            label="所属行业"
            name="target_industry"
          >
            <Select
              placeholder="请选择行业"
              options={[
                { label: '科技', value: 'tech' },
                { label: '金融', value: 'finance' },
                { label: '教育', value: 'education' },
                { label: '医疗', value: 'healthcare' },
                { label: '零售', value: 'retail' },
                { label: '娱乐', value: 'entertainment' },
                { label: '其他', value: 'other' }
              ]}
            />
          </Form.Item>
          
          <Form.Item
            label="所在地区"
            name="target_region"
          >
            <Input placeholder="用户所在地区" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 执行结果查看弹窗 */}
      <Modal
        title="执行结果详情"
        open={resultModalVisible}
        onCancel={() => setResultModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setResultModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {currentResult && (
          <div>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Title level={5}>基本信息</Title>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <Text strong>任务ID:</Text>
                    <Text style={{ marginLeft: 8, color: 'var(--text-inverse)' }} code>
                      {currentResult.task_id}
                    </Text>
                  </div>
                  <div>
                    <Text strong>执行状态:</Text>
                    <Tag color={getStatusColor(currentResult.status)} style={{ marginLeft: 8 }}>
                      {currentResult.status}
                    </Tag>
                  </div>
                  <div>
                    <Text strong>执行模式:</Text>
                    <ExecutorModeTag mode={currentResult.execution_mode} />
                  </div>
                  <div>
                    <Text strong>执行时间:</Text>
                    <Text style={{ marginLeft: 8, color: 'var(--text-inverse)' }}>
                      {new Date(currentResult.executed_at).toLocaleString()}
                    </Text>
                  </div>
                </div>
              </div>
              
              {currentResult.execution_details && (
                <div>
                  <Title level={5}>执行详情</Title>
                  
                  {currentResult.execution_details.template_used && (
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>使用模板:</Text>
                      <Text style={{ marginLeft: 8, color: 'var(--text-inverse)' }}>
                        {currentResult.execution_details.template_used}
                      </Text>
                    </div>
                  )}
                  
                  {currentResult.execution_details.rendered_content && (
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>执行内容:</Text>
                      <div 
                        style={{ 
                          marginTop: 8, 
                          padding: 12, 
                          background: 'var(--bg-light-secondary)', 
                          borderRadius: 6,
                          color: 'var(--text-inverse)'
                        }}
                      >
                        {currentResult.execution_details.rendered_content}
                      </div>
                    </div>
                  )}
                  
                  {currentResult.execution_details.manual_action_url && (
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>操作链接:</Text>
                      <div style={{ marginTop: 8 }}>
                        <Button
                          type="link"
                          href={currentResult.execution_details.manual_action_url}
                          target="_blank"
                          style={{ padding: 0 }}
                        >
                          {currentResult.execution_details.manual_action_url}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {currentResult.error_message && (
                <div>
                  <Title level={5}>错误信息</Title>
                  <Alert
                    message={currentResult.error_message}
                    type="error"
                    showIcon
                  />
                </div>
              )}
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
};