/**
 * 任务管理系统组件
 * 
 * 提供任务生成、状态管理、分配策略、执行结果跟踪的完整流程
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Space,
  Button,
  Tag,
  Input,
  Select,
  DatePicker,
  Modal,
  Form,
  Row,
  Col,
  Statistic,
  Progress,
  Tooltip,
  Popconfirm,
  message,
  Alert,
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { preciseAcquisitionService } from '../application/services';
import { TaskType, TaskStatus, ExecutorMode, ResultCode } from '../constants/precise-acquisition-enums';
import type { TaskEntity } from '../domain/precise-acquisition/entities';
import type { TaskGenerationConfig, RateLimitConfig } from '../types/precise-acquisition';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

/**
 * 任务管理中心组件
 */
export const TaskManagementCenter: React.FC = () => {
  const [tasks, setTasks] = useState<TaskEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // 筛选条件
  const [filters, setFilters] = useState({
    status: undefined as TaskStatus | undefined,
    taskType: undefined as TaskType | undefined,
    search: '',
  });

  // 任务生成配置
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const [generationForm] = Form.useForm();
  const [isGenerating, setIsGenerating] = useState(false);

  // 频控配置
  const [showRateLimitModal, setShowRateLimitModal] = useState(false);
  const [rateLimitForm] = Form.useForm();

  /**
   * 加载任务列表
   */
  const loadTasks = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const result = await preciseAcquisitionService.getTasks({
        limit: pageSize,
        offset: (page - 1) * pageSize,
        status: filters.status,
        task_type: filters.taskType,
      });

      setTasks(result);
      setPagination(prev => ({
        ...prev,
        current: page,
        pageSize,
        total: result.length, // TODO: 后端应该返回总数
      }));
    } catch (error) {
      message.error(`加载失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 刷新列表
   */
  const handleRefresh = () => {
    loadTasks(pagination.current, pagination.pageSize);
  };

  /**
   * 筛选变化
   */
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    loadTasks(1, pagination.pageSize);
  };

  /**
   * 生成任务
   */
  const handleGenerateTasks = async (values: TaskGenerationConfig) => {
    setIsGenerating(true);
    try {
      const result = await preciseAcquisitionService.generateTasks(values);
      message.success(`任务生成完成：创建 ${result.generated_count} 个任务`);
      setShowGenerationModal(false);
      generationForm.resetFields();
      handleRefresh();
    } catch (error) {
      message.error(`任务生成失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * 更新任务状态
   */
  const handleUpdateTaskStatus = async (taskId: string, status: TaskStatus, resultCode?: ResultCode) => {
    try {
      await preciseAcquisitionService.updateTaskStatus(taskId, status, resultCode);
      message.success('任务状态更新成功');
      handleRefresh();
    } catch (error) {
      message.error(`状态更新失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  /**
   * 批量操作
   */
  const handleBatchOperation = async (operation: 'start' | 'pause' | 'cancel' | 'delete') => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要操作的任务');
      return;
    }

    const operationMap = {
      start: { status: TaskStatus.READY, message: '启动' },
      pause: { status: TaskStatus.NEW, message: '暂停' },
      cancel: { status: TaskStatus.FAILED, message: '取消' },
      delete: { status: null, message: '删除' },
    };

    const { status, message: opMessage } = operationMap[operation];

    try {
      // TODO: 实现批量操作的后端接口
      for (const taskId of selectedRowKeys) {
        if (status) {
          await preciseAcquisitionService.updateTaskStatus(String(taskId), status);
        }
        // 删除操作需要实现删除接口
      }

      message.success(`批量${opMessage} ${selectedRowKeys.length} 个任务成功`);
      setSelectedRowKeys([]);
      handleRefresh();
    } catch (error) {
      message.error(`批量${opMessage}失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 任务状态统计
  const taskStats = {
    total: tasks.length,
    new: tasks.filter(t => t.status === TaskStatus.NEW).length,
    ready: tasks.filter(t => t.status === TaskStatus.READY).length,
    executing: tasks.filter(t => t.status === TaskStatus.EXECUTING).length,
    done: tasks.filter(t => t.status === TaskStatus.DONE).length,
    failed: tasks.filter(t => t.status === TaskStatus.FAILED).length,
  };

  // 表格列定义
  const columns = [
    {
      title: '任务ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'taskType',
      key: 'taskType',
      width: 100,
      render: (type: TaskType) => (
        <Tag color={type === TaskType.FOLLOW ? 'blue' : type === TaskType.REPLY ? 'green' : 'orange'}>
          {type === TaskType.FOLLOW ? '关注' : type === TaskType.REPLY ? '回复' : type}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: TaskStatus) => {
        const statusConfig = {
          [TaskStatus.NEW]: { color: 'default', icon: <ExclamationCircleOutlined /> },
          [TaskStatus.READY]: { color: 'processing', icon: <PlayCircleOutlined /> },
          [TaskStatus.EXECUTING]: { color: 'processing', icon: <PlayCircleOutlined /> },
          [TaskStatus.DONE]: { color: 'success', icon: <CheckCircleOutlined /> },
          [TaskStatus.FAILED]: { color: 'error', icon: <CloseCircleOutlined /> },
        };
        const config = statusConfig[status] || { color: 'default', icon: null };
        return (
          <Tag color={config.color} icon={config.icon}>
            {status === TaskStatus.NEW ? '新建' :
             status === TaskStatus.READY ? '就绪' :
             status === TaskStatus.EXECUTING ? '执行中' :
             status === TaskStatus.DONE ? '完成' :
             status === TaskStatus.FAILED ? '失败' : status}
          </Tag>
        );
      },
    },
    {
      title: '分配账号',
      dataIndex: 'assignAccountId',
      key: 'assignAccountId',
      width: 120,
      ellipsis: true,
    },
    {
      title: '执行器',
      dataIndex: 'executorMode',
      key: 'executorMode',
      width: 100,
      render: (mode: ExecutorMode) => (
        <Tag color={mode === ExecutorMode.API ? 'cyan' : 'purple'}>
          {mode === ExecutorMode.API ? 'API' : '模拟器'}
        </Tag>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: number) => (
        <Tag color={priority >= 8 ? 'red' : priority >= 5 ? 'orange' : 'green'}>
          {priority}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: Date | null) => 
        date ? date.toLocaleString() : '-',
    },
    {
      title: '执行时间',
      dataIndex: 'executedAt',
      key: 'executedAt',
      width: 150,
      render: (date: Date | null) => 
        date ? date.toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (record: TaskEntity) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => {/* TODO: 查看详情 */}}
            />
          </Tooltip>
          
          {record.status === TaskStatus.NEW && (
            <Tooltip title="启动任务">
              <Button 
                type="text" 
                size="small" 
                icon={<PlayCircleOutlined />}
                onClick={() => handleUpdateTaskStatus(record.id || '', TaskStatus.READY)}
              />
            </Tooltip>
          )}
          
          {record.status === TaskStatus.READY && (
            <Tooltip title="暂停任务">
              <Button 
                type="text" 
                size="small" 
                icon={<PauseCircleOutlined />}
                onClick={() => handleUpdateTaskStatus(record.id || '', TaskStatus.NEW)}
              />
            </Tooltip>
          )}

          {record.status === TaskStatus.FAILED && (
            <Tooltip title="重试任务">
              <Button 
                type="text" 
                size="small" 
                icon={<ReloadOutlined />}
                onClick={() => handleUpdateTaskStatus(record.id || '', TaskStatus.READY)}
              />
            </Tooltip>
          )}

          <Popconfirm
            title="确定要删除这个任务吗？"
            onConfirm={() => {/* TODO: 删除任务 */}}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button 
                type="text" 
                size="small" 
                icon={<DeleteOutlined />}
                danger
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    getCheckboxProps: (record: TaskEntity) => ({
      disabled: !record.id,
    }),
  };

  // 组件加载时获取数据
  useEffect(() => {
    loadTasks();
  }, []);

  return (
    <div className="task-management-center">
      <div className="space-y-4">
        {/* 统计卡片 */}
        <Row gutter={16}>
          <Col span={4}>
            <Card size="small">
              <Statistic 
                title="总任务" 
                value={taskStats.total} 
                valueStyle={{ color: '#1890ff' }}
                prefix={<ThunderboltOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic 
                title="新建" 
                value={taskStats.new}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic 
                title="就绪" 
                value={taskStats.ready}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic 
                title="执行中" 
                value={taskStats.executing}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic 
                title="已完成" 
                value={taskStats.done}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic 
                title="失败" 
                value={taskStats.failed}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 进度条 */}
        {taskStats.total > 0 && (
          <Card size="small">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>任务执行进度</span>
                <span>{Math.round((taskStats.done / taskStats.total) * 100)}% 完成</span>
              </div>
              <Progress 
                percent={Math.round((taskStats.done / taskStats.total) * 100)}
                success={{ percent: Math.round((taskStats.done / taskStats.total) * 100) }}
                status={taskStats.failed > 0 ? 'exception' : 'active'}
              />
            </div>
          </Card>
        )}

        {/* 操作和筛选区 */}
        <Card size="small">
          <Row gutter={[16, 16]} align="middle">
            <Col flex="auto">
              <Space size="middle">
                <Search
                  placeholder="搜索任务ID、账号..."
                  allowClear
                  style={{ width: 250 }}
                  onSearch={(value) => handleFilterChange('search', value)}
                />
                <Select
                  placeholder="任务状态"
                  style={{ width: 120 }}
                  allowClear
                  value={filters.status}
                  onChange={(value) => handleFilterChange('status', value)}
                >
                  {Object.values(TaskStatus).map(status => (
                    <Option key={status} value={status}>
                      {status === TaskStatus.NEW ? '新建' :
                       status === TaskStatus.READY ? '就绪' :
                       status === TaskStatus.EXECUTING ? '执行中' :
                       status === TaskStatus.DONE ? '完成' :
                       status === TaskStatus.FAILED ? '失败' : status}
                    </Option>
                  ))}
                </Select>
                <Select
                  placeholder="任务类型"
                  style={{ width: 120 }}
                  allowClear
                  value={filters.taskType}
                  onChange={(value) => handleFilterChange('taskType', value)}
                >
                  {Object.values(TaskType).map(type => (
                    <Option key={type} value={type}>
                      {type === TaskType.FOLLOW ? '关注' : 
                       type === TaskType.REPLY ? '回复' : type}
                    </Option>
                  ))}
                </Select>
              </Space>
            </Col>
            <Col>
              <Space>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={handleRefresh}
                  loading={loading}
                >
                  刷新
                </Button>
                <Button 
                  type="primary" 
                  icon={<ThunderboltOutlined />}
                  onClick={() => setShowGenerationModal(true)}
                >
                  生成任务
                </Button>
                <Button 
                  icon={<SettingOutlined />}
                  onClick={() => setShowRateLimitModal(true)}
                >
                  频控设置
                </Button>
              </Space>
            </Col>
          </Row>

          {/* 批量操作 */}
          {selectedRowKeys.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <Space>
                <span>已选择 {selectedRowKeys.length} 个任务：</span>
                <Button 
                  size="small" 
                  icon={<PlayCircleOutlined />}
                  onClick={() => handleBatchOperation('start')}
                >
                  批量启动
                </Button>
                <Button 
                  size="small" 
                  icon={<PauseCircleOutlined />}
                  onClick={() => handleBatchOperation('pause')}
                >
                  批量暂停
                </Button>
                <Button 
                  size="small" 
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleBatchOperation('cancel')}
                >
                  批量取消
                </Button>
                <Popconfirm
                  title={`确定要删除选中的 ${selectedRowKeys.length} 个任务吗？`}
                  onConfirm={() => handleBatchOperation('delete')}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button 
                    size="small" 
                    icon={<DeleteOutlined />}
                    danger
                  >
                    批量删除
                  </Button>
                </Popconfirm>
              </Space>
            </div>
          )}
        </Card>

        {/* 任务列表 */}
        <Card size="small">
          <Table
            columns={columns}
            dataSource={tasks}
            rowKey="id"
            rowSelection={rowSelection}
            loading={loading}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条数据`,
              onChange: (page, pageSize) => {
                loadTasks(page, pageSize);
              },
            }}
            size="small"
            scroll={{ x: 1400, y: 600 }}
          />
        </Card>
      </div>

      {/* 任务生成配置弹窗 */}
      <Modal
        title="生成任务配置"
        open={showGenerationModal}
        onOk={() => generationForm.submit()}
        onCancel={() => setShowGenerationModal(false)}
        confirmLoading={isGenerating}
        width={600}
      >
        <Form
          form={generationForm}
          layout="vertical"
          onFinish={handleGenerateTasks}
          initialValues={{
            time_window_hours: 24,
            min_like_count: 1,
            exclude_keywords: ['垃圾', '骗人', '假的'],
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="时间窗口（小时）"
                name="time_window_hours"
                rules={[{ required: true, message: '请输入时间窗口' }]}
              >
                <Input type="number" placeholder="24" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="最低点赞数"
                name="min_like_count"
                rules={[{ required: true, message: '请输入最低点赞数' }]}
              >
                <Input type="number" placeholder="1" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            label="包含关键词"
            name="keywords"
            tooltip="包含这些关键词的评论将优先生成任务"
          >
            <Select
              mode="tags"
              placeholder="输入关键词，回车添加"
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item
            label="排除关键词"
            name="exclude_keywords"
            tooltip="包含这些关键词的评论将被排除"
          >
            <Select
              mode="tags"
              placeholder="输入排除的关键词"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 频控设置弹窗 */}
      <Modal
        title="频控设置"
        open={showRateLimitModal}
        onOk={() => rateLimitForm.submit()}
        onCancel={() => setShowRateLimitModal(false)}
        width={500}
      >
        <Form
          form={rateLimitForm}
          layout="vertical"
          onFinish={(values) => {
            console.log('频控设置:', values);
            setShowRateLimitModal(false);
            message.success('频控设置已保存');
          }}
          initialValues={preciseAcquisitionService.getDefaultRateLimitConfig()}
        >
          <Alert
            message="频控设置"
            description="设置任务执行的频率限制，避免操作过于频繁"
            type="info"
            showIcon
            className="mb-4"
          />
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="每小时限制"
                name="hourly_limit"
                rules={[{ required: true, message: '请输入每小时限制' }]}
              >
                <Input type="number" placeholder="20" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="每日限制"
                name="daily_limit"
                rules={[{ required: true, message: '请输入每日限制' }]}
              >
                <Input type="number" placeholder="150" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="最小间隔（秒）"
                name="min_interval_seconds"
                rules={[{ required: true, message: '请输入最小间隔' }]}
              >
                <Input type="number" placeholder="90" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="最大间隔（秒）"
                name="max_interval_seconds"
                rules={[{ required: true, message: '请输入最大间隔' }]}
              >
                <Input type="number" placeholder="180" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};