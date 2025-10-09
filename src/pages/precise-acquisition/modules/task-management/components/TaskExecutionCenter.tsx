import React from 'react';import React from 'react';/**/**/**

import { Card, Empty, Typography } from 'antd';

import type { Device } from '../../../../../domain/adb/entities/Device';import { Card, Empty, Typography } from 'antd';



const { Text } = Typography;import type { Device } from '../../../../../domain/adb/entities/Device'; * 任务执行中心 - 简化版



interface TaskExecutionCenterProps {

  onlineDevices: Device[];

  onRefresh: () => void;const { Text } = Typography; * 负责任务的创建、执行、监控和管理 * 任务执行中心 - 简化版 * 任务执行中心组件

}



export const TaskExecutionCenter: React.FC<TaskExecutionCenterProps> = ({

  onlineDevices,interface TaskExecutionCenterProps { */

  onRefresh

}) => {  onlineDevices: Device[];

  return (

    <Card title="任务执行中心" className="light-theme-force">  onRefresh: () => void; * 负责任务的创建、执行、监控和管理 * 统一管理所有关注和回复任务的执行

      <Empty 

        description={}

          <div>

            <Text>任务执行中心正在开发中</Text>import React, { useState, useCallback } from 'react';

            <br />

            <Text type="secondary">连接设备: {onlineDevices.length} 台</Text>export const TaskExecutionCenter: React.FC<TaskExecutionCenterProps> = ({

          </div>

        }  onlineDevices,import { */ */

      />

    </Card>  onRefresh

  );

};}) => {  Card,

  return (

    <Card title="任务执行中心" className="light-theme-force">  Typography,

      <Empty 

        description={  Button,

          <div>

            <Text>任务执行中心正在开发中</Text>  Space,import React, { useState, useCallback } from 'react';import React, { useState, useCallback, useMemo } from 'react';

            <br />

            <Text type="secondary">连接设备: {onlineDevices.length} 台</Text>  Tabs,

          </div>

        }  Table,import {import {

      />

    </Card>  Progress,

  );

};  Tag,  Card,  Card,

  message,

  Modal,  Typography,  Table,

  Form,

  Input,  Button,  Button,

  Select,

  Row,  Space,  Space,

  Col,

  Statistic,  Tabs,  Typography,

  Empty

} from 'antd';  Table,  Tag,

import type { ColumnsType } from 'antd/es/table';

import {  Progress,  Modal,

  PlayCircleOutlined,

  PauseCircleOutlined,  Tag,  Form,

  EditOutlined,

  DeleteOutlined,  message,  Input,

  ReloadOutlined,

  ThunderboltOutlined,  Modal,  Select,

  CheckCircleOutlined,

  ClockCircleOutlined  Form,  message,

} from '@ant-design/icons';

import type { Device } from '../../../../../domain/adb/entities/Device';  Input,  Tabs,

import { useSemiAutoTasks } from '../semi-auto/useSemiAutoTasks';

import type { SemiAutoTask, SemiAutoTaskCreate } from '../semi-auto/types';  Select,  Badge,

import { SemiAutoExecutionDrawer } from '../semi-auto/SemiAutoExecutionDrawer';

  Row,  Tooltip,

const { Text } = Typography;

  Col,  Drawer,

interface TaskExecutionCenterProps {

  onlineDevices: Device[];  Statistic,} from 'antd';

  onRefresh: () => void;

}  Alert,// import ConfirmPopover from '@/components/universal-ui/common-popover/ConfirmPopover';



export const TaskExecutionCenter: React.FC<TaskExecutionCenterProps> = ({  Badge,import type { ColumnsType } from 'antd/es/table';

  onlineDevices,

  onRefresh  Emptyimport type { Key } from 'antd/es/table/interface';

}) => {

  const [activeTab, setActiveTab] = useState('pending');} from 'antd';import type { CommentEntity } from '../../../../../domain/precise-acquisition/entities';

  const [editModalVisible, setEditModalVisible] = useState(false);

  const [editingTask, setEditingTask] = useState<SemiAutoTask | null>(null);import type { ColumnsType } from 'antd/es/table';import {

  const [form] = Form.useForm();

  const [drawerVisible, setDrawerVisible] = useState(false);import {  ThunderboltOutlined,



  const {  PlayCircleOutlined,  PlayCircleOutlined,

    tasks,

    loading,  PauseCircleOutlined,  UserAddOutlined,

    loadTasks,

    createTask,  EditOutlined,  MessageOutlined,

    executeTask,

    pauseTask,  DeleteOutlined,  ClockCircleOutlined,

    resumeTask,

    deleteTask,  ReloadOutlined,  CheckCircleOutlined,

    getStats

  } = useSemiAutoTasks();  ThunderboltOutlined,  ExclamationCircleOutlined,



  const stats = getStats();  CheckCircleOutlined,  DeleteOutlined,



  // 刷新任务列表  ClockCircleOutlined  EyeOutlined,

  const handleRefresh = useCallback(async () => {

    try {} from '@ant-design/icons';  SendOutlined,

      await loadTasks();

      onRefresh();import type { Device } from '../../../../../domain/adb/entities/Device';} from '@ant-design/icons';

      message.success('任务列表已刷新');

    } catch (error) {import { useSemiAutoTasks } from '../semi-auto/useSemiAutoTasks';import type { Device } from '../../../../../domain/adb/entities/Device';

      message.error('刷新失败');

    }import type { SemiAutoTask, SemiAutoTaskCreate } from '../semi-auto/types';import { useSemiAutoTasks } from '../semi-auto/useSemiAutoTasks';

  }, [loadTasks, onRefresh]);

import { SemiAutoExecutionDrawer } from '../semi-auto/SemiAutoExecutionDrawer';import type { SemiAutoTask } from '../semi-auto/types';

  // 执行任务

  const handleExecuteTask = useCallback(async (taskId: string) => {import { SemiAutoExecutionDrawer } from '../semi-auto/SemiAutoExecutionDrawer';

    try {

      await executeTask(taskId);const { Title, Text, Paragraph } = Typography;

      message.success('任务开始执行');

    } catch (error) {const { TabPane } = Tabs;const { Title, Text } = Typography;

      message.error('执行任务失败');

    }const { TextArea } = Input;

  }, [executeTask]);

interface TaskExecutionCenterProps {const { Option } = Select;

  // 暂停任务

  const handlePauseTask = useCallback(async (taskId: string) => {  onlineDevices: Device[];

    try {

      await pauseTask(taskId);  onRefresh: () => void;interface TaskExecutionCenterProps {

      message.success('任务已暂停');

    } catch (error) {}  onlineDevices: Device[];

      message.error('暂停任务失败');

    }  onRefresh: () => void;

  }, [pauseTask]);

export const TaskExecutionCenter: React.FC<TaskExecutionCenterProps> = ({}

  // 恢复任务

  const handleResumeTask = useCallback(async (taskId: string) => {  onlineDevices,

    try {

      await resumeTask(taskId);  onRefresh// 任务类型定义

      message.success('任务已恢复');

    } catch (error) {}) => {interface TaskExecutionItem {

      message.error('恢复任务失败');

    }  const [activeTab, setActiveTab] = useState('pending');  id: string;

  }, [resumeTask]);

  const [editModalVisible, setEditModalVisible] = useState(false);  type: 'follow' | 'reply';

  // 删除任务

  const handleDeleteTask = useCallback(async (taskId: string) => {  const [editingTask, setEditingTask] = useState<SemiAutoTask | null>(null);  status: 'pending' | 'executing' | 'completed' | 'failed';

    try {

      await deleteTask(taskId);  const [form] = Form.useForm();  priority: 'high' | 'medium' | 'low';

      message.success('任务已删除');

    } catch (error) {  const [drawerVisible, setDrawerVisible] = useState(false);  targetId: string;

      message.error('删除任务失败');

    }  targetName: string;

  }, [deleteTask]);

  const {  content?: string; // 回复内容

  // 创建任务

  const handleCreateTask = useCallback(async (taskData: SemiAutoTaskCreate, deviceId?: string) => {    tasks,  assignedDevice?: string;

    try {

      await createTask(taskData);    loading,  assignAccountId?: string;

      message.success('任务创建成功');

      setDrawerVisible(false);    loadTasks,  executorMode: ExecutorMode;

    } catch (error) {

      message.error('创建任务失败');    createTask,  dedupKey?: string;

    }

  }, [createTask]);    executeTask,  createdAt: string;



  // 编辑任务    pauseTask,  scheduledAt?: string;

  const handleEditTask = useCallback((task: SemiAutoTask) => {

    setEditingTask(task);    resumeTask,  completedAt?: string;

    form.setFieldsValue({

      title: task.title,    deleteTask,  error?: string;

      description: task.description,

      priority: task.priority    getStats  

    });

    setEditModalVisible(true);  } = useSemiAutoTasks();  // 关联数据

  }, [form]);

  comment?: CommentEntity;

  // 保存编辑

  const handleSaveEdit = useCallback(async () => {  const stats = getStats();  videoUrl?: string;

    try {

      const values = await form.validateFields();  videoTitle?: string;

      // 这里应该调用更新任务的API

      message.success('任务更新成功');  // 刷新任务列表}

      setEditModalVisible(false);

      setEditingTask(null);  const handleRefresh = useCallback(async () => {

    } catch (error) {

      message.error('更新任务失败');    try {export const TaskExecutionCenter: React.FC<TaskExecutionCenterProps> = ({

    }

  }, [form]);      await loadTasks();  onlineDevices,



  // 根据状态过滤任务      onRefresh();  onRefresh

  const getFilteredTasks = useCallback((status: string) => {

    if (status === 'all') return tasks;      message.success('任务列表已刷新');}) => {

    return tasks.filter(task => task.status === status);

  }, [tasks]);    } catch (error) {  const [activeTab, setActiveTab] = useState('pending');



  // 获取状态标签      message.error('刷新失败');  const [selectedTasks, setSelectedTasks] = useState<Key[]>([]);

  const getStatusTag = (status: SemiAutoTask['status']) => {

    const statusConfig = {    }  const [editModalVisible, setEditModalVisible] = useState(false);

      pending: { color: 'default', text: '待执行', icon: <ClockCircleOutlined /> },

      executing: { color: 'processing', text: '执行中', icon: <PlayCircleOutlined /> },  }, [loadTasks, onRefresh]);  const [editingTask, setEditingTask] = useState<SemiAutoTask | null>(null);

      completed: { color: 'success', text: '已完成', icon: <CheckCircleOutlined /> },

      failed: { color: 'error', text: '失败', icon: <EditOutlined /> },  const [form] = Form.useForm();

      paused: { color: 'warning', text: '已暂停', icon: <PauseCircleOutlined /> }

    };  // 执行任务  const [consoleVisible, setConsoleVisible] = useState(false);

    

    const config = statusConfig[status];  const handleExecuteTask = useCallback(async (taskId: string) => {  const [consoleTask, setConsoleTask] = useState<SemiAutoTask | null>(null);

    return (

      <Tag color={config.color} icon={config.icon}>    try {  const [batchExecuting, setBatchExecuting] = useState(false);

        {config.text}

      </Tag>      await executeTask(taskId);

    );

  };      message.success('任务开始执行');  const {



  // 获取优先级标签    } catch (error) {    tasks,

  const getPriorityTag = (priority: SemiAutoTask['priority']) => {

    const priorityConfig = {      message.error('执行任务失败');    loading,

      high: { color: 'red', text: '高' },

      medium: { color: 'orange', text: '中' },    }    loadTasks,

      low: { color: 'blue', text: '低' }

    };  }, [executeTask]);    executeTask: runTask,

    

    const config = priorityConfig[priority];    updateTask,

    return <Tag color={config.color}>{config.text}</Tag>;

  };  // 暂停任务    deleteTask: removeTask,



  // 表格列定义  const handlePauseTask = useCallback(async (taskId: string) => {  } = useSemiAutoTasks();

  const columns: ColumnsType<SemiAutoTask> = [

    {    try {

      title: '任务',

      dataIndex: 'title',      await pauseTask(taskId);  const tableLoading = loading || batchExecuting;

      key: 'title',

      render: (title: string, record: SemiAutoTask) => (      message.success('任务已暂停');

        <div>

          <Text strong>{title}</Text>    } catch (error) {  const openConsole = useCallback((task: SemiAutoTask) => {

          <br />

          <Text type="secondary" style={{ fontSize: '12px' }}>      message.error('暂停任务失败');    setConsoleTask(task);

            {record.description}

          </Text>    }    setConsoleVisible(true);

        </div>

      )  }, [pauseTask]);  }, []);

    },

    {

      title: '类型',

      dataIndex: 'type',  // 恢复任务  const closeConsole = useCallback(() => {

      key: 'type',

      width: 80,  const handleResumeTask = useCallback(async (taskId: string) => {    setConsoleVisible(false);

      render: (type: string) => {

        const typeConfig = {    try {    setConsoleTask(null);

          follow: { color: 'blue', text: '关注' },

          reply: { color: 'green', text: '回复' },      await resumeTask(taskId);  }, []);

          comment: { color: 'orange', text: '评论' },

          like: { color: 'red', text: '点赞' }      message.success('任务已恢复');

        };

        const config = typeConfig[type as keyof typeof typeConfig];    } catch (error) {  // 执行单个任务

        return <Tag color={config.color}>{config.text}</Tag>;

      }      message.error('恢复任务失败');  const executeTask = useCallback(

    },

    {    }    async (taskId: string) => {

      title: '状态',

      dataIndex: 'status',  }, [resumeTask]);      await runTask(taskId);

      key: 'status',

      width: 100,    },

      render: (status: SemiAutoTask['status']) => getStatusTag(status)

    },  // 删除任务    [runTask],

    {

      title: '优先级',  const handleDeleteTask = useCallback(async (taskId: string) => {  );

      dataIndex: 'priority',

      key: 'priority',    try {

      width: 80,

      render: (priority: SemiAutoTask['priority']) => getPriorityTag(priority)      await deleteTask(taskId);  // 批量执行任务

    },

    {      message.success('任务已删除');  const executeBatchTasks = useCallback(async () => {

      title: '进度',

      dataIndex: 'progress',    } catch (error) {    if (selectedTasks.length === 0) {

      key: 'progress',

      width: 120,      message.error('删除任务失败');      message.warning('请选择要执行的任务');

      render: (progress: number, record: SemiAutoTask) => (

        <Progress     }      return;

          percent={progress} 

          size="small"   }, [deleteTask]);    }

          status={record.status === 'failed' ? 'exception' : 'active'}

        />

      )

    },  // 创建任务    setLoading(true);

    {

      title: '设备',  const handleCreateTask = useCallback(async (taskData: SemiAutoTaskCreate, deviceId?: string) => {    try {

      dataIndex: 'deviceName',

      key: 'deviceName',    try {      for (const taskId of selectedTasks) {

      width: 100,

      render: (deviceName: string | undefined) => deviceName || '未分配'      await createTask(taskData);        await executeTask(taskId as string);

    },

    {      message.success('任务创建成功');        // 添加间隔避免过快执行

      title: '操作',

      key: 'actions',      setDrawerVisible(false);        await new Promise(resolve => setTimeout(resolve, 1000));

      width: 180,

      render: (_, record: SemiAutoTask) => (    } catch (error) {      }

        <Space size="small">

          {record.status === 'pending' && (      message.error('创建任务失败');      setSelectedTasks([]);

            <Button

              type="primary"    }    } finally {

              size="small"

              icon={<PlayCircleOutlined />}  }, [createTask]);      setLoading(false);

              onClick={() => handleExecuteTask(record.id)}

            >    }

              执行

            </Button>  // 编辑任务  }, [selectedTasks, executeTask]);

          )}

          {record.status === 'executing' && (  const handleEditTask = useCallback((task: SemiAutoTask) => {

            <Button

              size="small"    setEditingTask(task);  // 删除任务

              icon={<PauseCircleOutlined />}

              onClick={() => handlePauseTask(record.id)}    form.setFieldsValue({  const deleteTask = useCallback(async (taskId: string) => {

            >

              暂停      title: task.title,    try {

            </Button>

          )}      description: task.description,      setTasks(prev => prev.filter(t => t.id !== taskId));

          {record.status === 'paused' && (

            <Button      priority: task.priority      message.success('任务删除成功');

              type="primary"

              size="small"    });    } catch (error) {

              icon={<PlayCircleOutlined />}

              onClick={() => handleResumeTask(record.id)}    setEditModalVisible(true);      message.error('删除任务失败');

            >

              继续  }, [form]);    }

            </Button>

          )}  }, []);

          <Button

            size="small"  // 保存编辑

            icon={<EditOutlined />}

            onClick={() => handleEditTask(record)}  const handleSaveEdit = useCallback(async () => {  // 编辑任务

          >

            编辑    try {  const handleEditTask = useCallback((task: TaskExecutionItem) => {

          </Button>

          <Button      const values = await form.validateFields();    setEditingTask(task);

            size="small"

            danger      // 这里应该调用更新任务的API    form.setFieldsValue({

            icon={<DeleteOutlined />}

            onClick={() => handleDeleteTask(record.id)}      message.success('任务更新成功');      content: task.content,

          >

            删除      setEditModalVisible(false);      assignedDevice: task.assignedDevice,

          </Button>

        </Space>      setEditingTask(null);      priority: task.priority

      )

    }    } catch (error) {    });

  ];

      message.error('更新任务失败');    setEditModalVisible(true);

  return (

    <div className="task-execution-center">    }  }, [form]);

      <Space direction="vertical" size="large" style={{ width: '100%' }}>

        {/* 统计卡片 */}  }, [form]);

        <Row gutter={16}>

          <Col span={6}>  // 保存编辑

            <Card>

              <Statistic  // 根据状态过滤任务  const handleSaveEdit = useCallback(async (values: any) => {

                title="总任务数"

                value={stats.total}  const getFilteredTasks = useCallback((status: string) => {    if (!editingTask) return;

                prefix={<ThunderboltOutlined />}

              />    if (status === 'all') return tasks;

            </Card>

          </Col>    return tasks.filter(task => task.status === status);    try {

          <Col span={6}>

            <Card>  }, [tasks]);      setTasks(prev => prev.map(t => 

              <Statistic

                title="执行中"        t.id === editingTask.id ? {

                value={stats.executing}

                valueStyle={{ color: '#1890ff' }}  // 获取状态标签          ...t,

                prefix={<PlayCircleOutlined />}

              />  const getStatusTag = (status: SemiAutoTask['status']) => {          content: values.content,

            </Card>

          </Col>    const statusConfig = {          assignedDevice: values.assignedDevice,

          <Col span={6}>

            <Card>      pending: { color: 'default', text: '待执行', icon: <ClockCircleOutlined /> },          priority: values.priority

              <Statistic

                title="已完成"      executing: { color: 'processing', text: '执行中', icon: <PlayCircleOutlined /> },        } : t

                value={stats.completed}

                valueStyle={{ color: '#52c41a' }}      completed: { color: 'success', text: '已完成', icon: <CheckCircleOutlined /> },      ));

                prefix={<CheckCircleOutlined />}

              />      failed: { color: 'error', text: '失败', icon: <EditOutlined /> },      

            </Card>

          </Col>      paused: { color: 'warning', text: '已暂停', icon: <PauseCircleOutlined /> }      setEditModalVisible(false);

          <Col span={6}>

            <Card>    };      setEditingTask(null);

              <Statistic

                title="成功率"          message.success('任务更新成功');

                value={stats.successRate}

                precision={1}    const config = statusConfig[status];    } catch (error) {

                suffix="%"

                valueStyle={{ color: '#52c41a' }}    return (      message.error('更新任务失败');

              />

            </Card>      <Tag color={config.color} icon={config.icon}>    }

          </Col>

        </Row>        {config.text}  }, [editingTask]);



        {/* 工具栏 */}      </Tag>

        <Card>

          <Space>    );  // 获取设备名称

            <Button

              type="primary"  };  const getDeviceName = (deviceId?: string): string => {

              icon={<ThunderboltOutlined />}

              onClick={() => setDrawerVisible(true)}    if (!deviceId) return '未分配';

            >

              创建任务  // 获取优先级标签    const device = onlineDevices.find(d => d.id === deviceId);

            </Button>

            <Button  const getPriorityTag = (priority: SemiAutoTask['priority']) => {    return device ? (device.name || device.id) : deviceId;

              icon={<ReloadOutlined />}

              onClick={handleRefresh}    const priorityConfig = {  };

              loading={loading}

            >      high: { color: 'red', text: '高' },

              刷新

            </Button>      medium: { color: 'orange', text: '中' },  // 渲染状态标签

          </Space>

        </Card>      low: { color: 'blue', text: '低' }  const renderStatusTag = (status: TaskExecutionItem['status']) => {



        {/* 任务列表 */}    };    const statusConfig = {

        <Card title="任务列表">

          <Tabs activeKey={activeTab} onChange={setActiveTab}>          pending: { color: 'blue', icon: <ClockCircleOutlined />, text: '待执行' },

            <Tabs.TabPane tab={`全部 (${stats.total})`} key="all">

              <Table    const config = priorityConfig[priority];      executing: { color: 'orange', icon: <PlayCircleOutlined />, text: '执行中' },

                columns={columns}

                dataSource={getFilteredTasks('all')}    return <Tag color={config.color}>{config.text}</Tag>;      completed: { color: 'green', icon: <CheckCircleOutlined />, text: '已完成' },

                rowKey="id"

                loading={loading}  };      failed: { color: 'red', icon: <ExclamationCircleOutlined />, text: '失败' }

                locale={{

                  emptyText: <Empty description="暂无任务" />    };

                }}

                pagination={{  // 表格列定义    

                  showSizeChanger: true,

                  showQuickJumper: true,  const columns: ColumnsType<SemiAutoTask> = [    const config = statusConfig[status];

                  showTotal: (total) => `共 ${total} 个任务`

                }}    {    return (

              />

            </Tabs.TabPane>      title: '任务',      <Tag color={config.color} icon={config.icon}>

            <Tabs.TabPane tab={`待执行 (${stats.pending})`} key="pending">

              <Table      dataIndex: 'title',        {config.text}

                columns={columns}

                dataSource={getFilteredTasks('pending')}      key: 'title',      </Tag>

                rowKey="id"

                loading={loading}      render: (title: string, record: SemiAutoTask) => (    );

                locale={{

                  emptyText: <Empty description="暂无待执行任务" />        <div>  };

                }}

              />          <Text strong>{title}</Text>

            </Tabs.TabPane>

            <Tabs.TabPane tab={`执行中 (${stats.executing})`} key="executing">          <br />  // 渲染优先级标签

              <Table

                columns={columns}          <Text type="secondary" style={{ fontSize: '12px' }}>  const renderPriorityTag = (priority: TaskExecutionItem['priority']) => {

                dataSource={getFilteredTasks('executing')}

                rowKey="id"            {record.description}    const priorityConfig = {

                loading={loading}

                locale={{          </Text>      high: { color: 'red', text: '高' },

                  emptyText: <Empty description="暂无执行中任务" />

                }}        </div>      medium: { color: 'orange', text: '中' },

              />

            </Tabs.TabPane>      )      low: { color: 'blue', text: '低' }

            <Tabs.TabPane tab={`已完成 (${stats.completed})`} key="completed">

              <Table    },    };

                columns={columns}

                dataSource={getFilteredTasks('completed')}    {    

                rowKey="id"

                loading={loading}      title: '类型',    const config = priorityConfig[priority];

                locale={{

                  emptyText: <Empty description="暂无已完成任务" />      dataIndex: 'type',    return <Tag color={config.color}>{config.text}</Tag>;

                }}

              />      key: 'type',  };

            </Tabs.TabPane>

          </Tabs>      width: 80,

        </Card>

      </Space>      render: (type: string) => {  // 表格列配置



      {/* 任务创建抽屉 */}        const typeConfig = {  const columns: ColumnsType<TaskExecutionItem> = [

      <SemiAutoExecutionDrawer

        visible={drawerVisible}          follow: { color: 'blue', text: '关注' },    {

        onClose={() => setDrawerVisible(false)}

        devices={onlineDevices}          reply: { color: 'green', text: '回复' },      title: '任务信息',

        onExecute={handleCreateTask}

      />          comment: { color: 'orange', text: '评论' },      key: 'taskInfo',



      {/* 编辑任务模态框 */}          like: { color: 'red', text: '点赞' }      width: 250,

      <Modal

        title="编辑任务"        };      render: (_, record) => (

        open={editModalVisible}

        onOk={handleSaveEdit}        const config = typeConfig[type as keyof typeof typeConfig];        <div className="space-y-1">

        onCancel={() => {

          setEditModalVisible(false);        return <Tag color={config.color}>{config.text}</Tag>;          <div className="flex items-center space-x-2">

          setEditingTask(null);

        }}      }            {record.type === 'follow' ? 

        destroyOnClose

      >    },              <UserAddOutlined className="text-blue-500" /> : 

        <Form form={form} layout="vertical">

          <Form.Item    {              <MessageOutlined className="text-green-500" />

            name="title"

            label="任务标题"      title: '状态',            }

            rules={[{ required: true, message: '请输入任务标题' }]}

          >      dataIndex: 'status',            <Text strong>

            <Input placeholder="输入任务标题" />

          </Form.Item>      key: 'status',              {record.type === 'follow' ? '关注' : '回复'}: {record.targetName}

          <Form.Item

            name="description"      width: 100,            </Text>

            label="任务描述"

          >      render: (status: SemiAutoTask['status']) => getStatusTag(status)          </div>

            <Input.TextArea rows={3} placeholder="输入任务描述" />

          </Form.Item>    },          <div className="flex items-center space-x-2">

          <Form.Item

            name="priority"    {            {renderStatusTag(record.status)}

            label="优先级"

          >      title: '优先级',            {renderPriorityTag(record.priority)}

            <Select>

              <Select.Option value="high">高</Select.Option>      dataIndex: 'priority',          </div>

              <Select.Option value="medium">中</Select.Option>

              <Select.Option value="low">低</Select.Option>      key: 'priority',          {record.videoTitle && (

            </Select>

          </Form.Item>      width: 80,            <Tooltip title={record.videoTitle}>

        </Form>

      </Modal>      render: (priority: SemiAutoTask['priority']) => getPriorityTag(priority)              <Text type="secondary" className="text-xs block truncate">

    </div>

  );    },                视频: {record.videoTitle}

};
    {              </Text>

      title: '进度',            </Tooltip>

      dataIndex: 'progress',          )}

      key: 'progress',        </div>

      width: 120,      )

      render: (progress: number, record: SemiAutoTask) => (    },

        <Progress     {

          percent={progress}       title: '内容',

          size="small"       key: 'content',

          status={record.status === 'failed' ? 'exception' : 'active'}      ellipsis: true,

        />      render: (_, record) => {

      )        if (record.type === 'follow') {

    },          return <Text type="secondary">关注用户</Text>;

    {        }

      title: '设备',        return (

      dataIndex: 'deviceName',          <Tooltip title={record.content}>

      key: 'deviceName',            <Text className="text-sm">{record.content}</Text>

      width: 100,          </Tooltip>

      render: (deviceName: string | undefined) => deviceName || '未分配'        );

    },      }

    {    },

      title: '操作',    {

      key: 'actions',      title: '分配设备',

      width: 180,      dataIndex: 'assignedDevice',

      render: (_, record: SemiAutoTask) => (      key: 'assignedDevice',

        <Space size="small">      width: 120,

          {record.status === 'pending' && (      render: (deviceId) => getDeviceName(deviceId)

            <Button    },

              type="primary"    {

              size="small"      title: '创建时间',

              icon={<PlayCircleOutlined />}      dataIndex: 'createdAt',

              onClick={() => handleExecuteTask(record.id)}      key: 'createdAt',

            >      width: 120,

              执行      render: (time) => new Date(time).toLocaleString()

            </Button>    },

          )}    {

          {record.status === 'executing' && (      title: '操作',

            <Button      key: 'actions',

              size="small"      width: 240,

              icon={<PauseCircleOutlined />}      fixed: 'right',

              onClick={() => handlePauseTask(record.id)}      render: (_, record) => (

            >        <Space size="small">

              暂停          {record.status === 'pending' && (

            </Button>            <Button

          )}              type="primary"

          {record.status === 'paused' && (              size="small"

            <Button              icon={<PlayCircleOutlined />}

              type="primary"              onClick={() => executeTask(record.id)}

              size="small"              disabled={!record.assignedDevice || onlineDevices.length === 0}

              icon={<PlayCircleOutlined />}            >

              onClick={() => handleResumeTask(record.id)}              执行

            >            </Button>

              继续          )}

            </Button>          

          )}          {record.type === 'reply' && record.status === 'pending' && (

          <Button            <Button

            size="small"              size="small"

            icon={<EditOutlined />}              icon={<SendOutlined />}

            onClick={() => handleEditTask(record)}              onClick={() => handleEditTask(record)}

          >            >

            编辑              编辑

          </Button>            </Button>

          <Button          )}

            size="small"          

            danger          <Button

            icon={<DeleteOutlined />}            size="small"

            onClick={() => handleDeleteTask(record.id)}            icon={<ThunderboltOutlined />}

          >            onClick={() => openConsole(record)}

            删除          >

          </Button>            执行台

        </Space>          </Button>

      )

    }          {record.videoUrl && (

  ];            <Button

              size="small"

  return (              icon={<EyeOutlined />}

    <div className="task-execution-center">              onClick={() => window.open(record.videoUrl, '_blank')}

      <Space direction="vertical" size="large" style={{ width: '100%' }}>            >

        {/* 统计卡片 */}              查看

        <Row gutter={16}>            </Button>

          <Col span={6}>          )}

            <Card>          

              <Statistic          <ConfirmPopover

                title="总任务数"            mode="default"

                value={stats.total}            title="确认删除"

                prefix={<ThunderboltOutlined />}            description="删除后无法恢复，确认删除此任务？"

              />            onConfirm={() => deleteTask(record.id)}

            </Card>            okText="删除"

          </Col>            cancelText="取消"

          <Col span={6}>          >

            <Card>            <Button

              <Statistic              size="small"

                title="执行中"              icon={<DeleteOutlined />}

                value={stats.executing}              danger

                valueStyle={{ color: '#1890ff' }}            >

                prefix={<PlayCircleOutlined />}              删除

              />            </Button>

            </Card>          </ConfirmPopover>

          </Col>        </Space>

          <Col span={6}>      )

            <Card>    }

              <Statistic  ];

                title="已完成"

                value={stats.completed}  // 筛选任务

                valueStyle={{ color: '#52c41a' }}  const getFilteredTasks = (status?: string) => {

                prefix={<CheckCircleOutlined />}    if (!status || status === 'all') return tasks;

              />    return tasks.filter(task => task.status === status);

            </Card>  };

          </Col>

          <Col span={6}>  // 统计数据

            <Card>  const stats = {

              <Statistic    total: tasks.length,

                title="成功率"    pending: tasks.filter(t => t.status === 'pending').length,

                value={stats.successRate}    executing: tasks.filter(t => t.status === 'executing').length,

                precision={1}    completed: tasks.filter(t => t.status === 'completed').length,

                suffix="%"    failed: tasks.filter(t => t.status === 'failed').length

                valueStyle={{ color: '#52c41a' }}  };

              />

            </Card>  // 标签页配置

          </Col>  const tabItems = [

        </Row>    {

      key: 'pending',

        {/* 工具栏 */}      label: (

        <Card>        <span className="flex items-center space-x-1">

          <Space>          <ClockCircleOutlined />

            <Button          <span>待执行</span>

              type="primary"          <Badge count={stats.pending} showZero />

              icon={<ThunderboltOutlined />}        </span>

              onClick={() => setDrawerVisible(true)}      )

            >    },

              创建任务    {

            </Button>      key: 'executing',

            <Button      label: (

              icon={<ReloadOutlined />}        <span className="flex items-center space-x-1">

              onClick={handleRefresh}          <PlayCircleOutlined />

              loading={loading}          <span>执行中</span>

            >          <Badge count={stats.executing} showZero />

              刷新        </span>

            </Button>      )

          </Space>    },

        </Card>    {

      key: 'completed',

        {/* 任务列表 */}      label: (

        <Card title="任务列表">        <span className="flex items-center space-x-1">

          <Tabs activeKey={activeTab} onChange={setActiveTab}>          <CheckCircleOutlined />

            <Tabs.TabPane tab={`全部 (${stats.total})`} key="all">          <span>已完成</span>

              <Table          <Badge count={stats.completed} showZero />

                columns={columns}        </span>

                dataSource={getFilteredTasks('all')}      )

                rowKey="id"    },

                loading={loading}    {

                locale={{      key: 'failed',

                  emptyText: <Empty description="暂无任务" />      label: (

                }}        <span className="flex items-center space-x-1">

                pagination={{          <ExclamationCircleOutlined />

                  showSizeChanger: true,          <span>失败</span>

                  showQuickJumper: true,          <Badge count={stats.failed} showZero />

                  showTotal: (total) => `共 ${total} 个任务`        </span>

                }}      )

              />    },

            </Tabs.TabPane>    {

            <Tabs.TabPane tab={`待执行 (${stats.pending})`} key="pending">      key: 'all',

              <Table      label: (

                columns={columns}        <span className="flex items-center space-x-1">

                dataSource={getFilteredTasks('pending')}          <ThunderboltOutlined />

                rowKey="id"          <span>全部</span>

                loading={loading}          <Badge count={stats.total} showZero />

                locale={{        </span>

                  emptyText: <Empty description="暂无待执行任务" />      )

                }}    }

              />  ];

            </Tabs.TabPane>

            <Tabs.TabPane tab={`执行中 (${stats.executing})`} key="executing">  return (

              <Table    <>

                columns={columns}      <Card>

                dataSource={getFilteredTasks('executing')}        <div className="flex items-center justify-between mb-4">

                rowKey="id"          <div className="flex items-center space-x-2">

                loading={loading}            <ThunderboltOutlined className="text-orange-500" />

                locale={{            <Title level={4} className="m-0">任务执行中心</Title>

                  emptyText: <Empty description="暂无执行中任务" />          </div>

                }}          

              />          <Space>

            </Tabs.TabPane>            {selectedTasks.length > 0 && (

            <Tabs.TabPane tab={`已完成 (${stats.completed})`} key="completed">              <Button

              <Table                type="primary"

                columns={columns}                icon={<PlayCircleOutlined />}

                dataSource={getFilteredTasks('completed')}                onClick={executeBatchTasks}

                rowKey="id"                loading={loading}

                loading={loading}              >

                locale={{                批量执行 ({selectedTasks.length})

                  emptyText: <Empty description="暂无已完成任务" />              </Button>

                }}            )}

              />            <Button

            </Tabs.TabPane>              icon={<ThunderboltOutlined />}

          </Tabs>              onClick={loadTasks}

        </Card>              loading={loading}

      </Space>            >

              刷新

      {/* 任务创建抽屉 */}            </Button>

      <SemiAutoExecutionDrawer          </Space>

        visible={drawerVisible}        </div>

        onClose={() => setDrawerVisible(false)}

        devices={onlineDevices}        {/* 进度统计 */}

        onExecute={handleCreateTask}        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">

      />          <div className="text-center p-3 bg-blue-50 rounded">

            <div className="text-xl font-bold text-blue-600">{stats.pending}</div>

      {/* 编辑任务模态框 */}            <div className="text-sm text-gray-600">待执行</div>

      <Modal          </div>

        title="编辑任务"          <div className="text-center p-3 bg-orange-50 rounded">

        open={editModalVisible}            <div className="text-xl font-bold text-orange-600">{stats.executing}</div>

        onOk={handleSaveEdit}            <div className="text-sm text-gray-600">执行中</div>

        onCancel={() => {          </div>

          setEditModalVisible(false);          <div className="text-center p-3 bg-green-50 rounded">

          setEditingTask(null);            <div className="text-xl font-bold text-green-600">{stats.completed}</div>

        }}            <div className="text-sm text-gray-600">已完成</div>

        destroyOnClose          </div>

      >          <div className="text-center p-3 bg-red-50 rounded">

        <Form form={form} layout="vertical">            <div className="text-xl font-bold text-red-600">{stats.failed}</div>

          <Form.Item            <div className="text-sm text-gray-600">失败</div>

            name="title"          </div>

            label="任务标题"          <div className="text-center p-3 bg-gray-50 rounded">

            rules={[{ required: true, message: '请输入任务标题' }]}            <div className="text-xl font-bold text-gray-600">{stats.total}</div>

          >            <div className="text-sm text-gray-600">总计</div>

            <Input placeholder="输入任务标题" />          </div>

          </Form.Item>        </div>

          <Form.Item

            name="description"        {/* 任务列表 */}

            label="任务描述"        <Tabs

          >          activeKey={activeTab}

            <Input.TextArea rows={3} placeholder="输入任务描述" />          onChange={setActiveTab}

          </Form.Item>          items={tabItems}

          <Form.Item          className="mb-4"

            name="priority"        />

            label="优先级"

          >        <Table

            <Select>          columns={columns}

              <Select.Option value="high">高</Select.Option>          dataSource={getFilteredTasks(activeTab)}

              <Select.Option value="medium">中</Select.Option>          rowKey="id"

              <Select.Option value="low">低</Select.Option>          loading={loading}

            </Select>          rowSelection={{

          </Form.Item>            selectedRowKeys: selectedTasks,

        </Form>            onChange: setSelectedTasks,

      </Modal>            getCheckboxProps: (record) => ({

    </div>              disabled: record.status === 'executing' || record.status === 'completed'

  );            })

};          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
          scroll={{ x: 1000 }}
          size="small"
        />
      </Card>

      <Drawer
        title="半自动执行台"
        open={consoleVisible}
        onClose={closeConsole}
        width={520}
        destroyOnClose
      >
        {consoleTask ? (
          <Space direction="vertical" size="large" className="w-full">
            <PrecheckStatusBar
              loading={precheck.loading}
              checks={precheck.checks}
              onReload={precheck.refresh}
            />
            <Card title="话术准备" size="small">
              <Paragraph type="secondary">
                根据 Round 4 规范，这里将接入话术模板与变量渲染流程。
              </Paragraph>
              <Button type="primary" disabled={!precheck.allPassed}>
                复制草稿
              </Button>
            </Card>
            <Card title="人工回执" size="small">
              <Paragraph type="secondary">
                执行完毕后，勾选“已发送”并补充截图 / 备注。
              </Paragraph>
              <Space>
                <Button type="primary" disabled={!precheck.allPassed}>
                  标记已发送
                </Button>
                <Button>记录失败原因</Button>
              </Space>
            </Card>
          </Space>
        ) : (
          <Text type="secondary">请选择任务</Text>
        )}
      </Drawer>

      {/* 编辑任务弹框 */}
      <Modal
        title="编辑回复任务"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveEdit}
        >
          <Form.Item
            name="content"
            label="回复内容"
            rules={[{ required: true, message: '请输入回复内容' }]}
          >
            <TextArea
              rows={4}
              placeholder="输入回复内容"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            name="assignedDevice"
            label="执行设备"
            rules={[{ required: true, message: '请选择执行设备' }]}
          >
            <Select placeholder="选择执行设备">
              {onlineDevices.map(device => (
                <Option key={device.id} value={device.id}>
                  {device.name || device.id} ({device.model})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="priority"
            label="优先级"
          >
            <Select>
              <Option value="high">高</Option>
              <Option value="medium">中</Option>
              <Option value="low">低</Option>
            </Select>
          </Form.Item>

          <div className="flex justify-end space-x-2">
            <Button onClick={() => setEditModalVisible(false)}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
};
