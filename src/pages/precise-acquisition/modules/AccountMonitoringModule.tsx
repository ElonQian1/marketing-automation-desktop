import React, { useState, useCallback, useEffect } from 'react';
import {
  Card,
  Typography,
  Tabs,
  Button,
  Badge,
  message
} from 'antd';
import {
  UserOutlined,
  PlusOutlined,
  BarChartOutlined,
  MessageOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import type { Device } from '../../../domain/adb/entities/Device';
import { monitoringService } from '../services/monitoringService';
import type { MonitoringTask, CommentData } from '../services/monitoringService';
import { AccountMonitoringConfig } from './account-monitoring';
import { TaskList, ReplyTaskManager } from './industry-monitoring';

const { Title } = Typography;

interface AccountMonitoringModuleProps {
  onlineDevices: Device[];
  selectedDevice?: Device | null;
  refreshDevices: () => void;
}

/**
 * 账号监控模块
 * 监控指定账号或视频的评论区，根据数据推送监控提醒，支持自动关注和回复
 */
export const AccountMonitoringModule: React.FC<AccountMonitoringModuleProps> = ({
  onlineDevices,
  selectedDevice,
  refreshDevices
}) => {
  const [activeTab, setActiveTab] = useState('config');
  const [tasks, setTasks] = useState<MonitoringTask[]>([]);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(false);

  // 初始化数据
  useEffect(() => {
    loadTasks();
  }, []);

  // 加载任务列表（只显示账号和视频监控任务）
  const loadTasks = useCallback(async () => {
    try {
      const allTasks = await monitoringService.getTasks();
      const accountTasks = allTasks.filter(task => 
        task.type === 'account' || task.type === 'video'
      );
      setTasks(accountTasks);
    } catch (error) {
      console.error('加载任务失败:', error);
    }
  }, []);

  // 加载评论数据
  const loadComments = useCallback(async () => {
    try {
      const allComments: CommentData[] = [];
      for (const task of tasks) {
        const taskComments = await monitoringService.getCommentsByTask(task.id);
        allComments.push(...taskComments);
      }
      setComments(allComments);
    } catch (error) {
      console.error('加载评论失败:', error);
    }
  }, [tasks]);

  // 创建任务
  const handleTaskCreate = useCallback(async (task: MonitoringTask) => {
    setTasks(prev => [...prev, task]);
    message.success('账号监控任务创建成功！');
    setActiveTab('tasks');
  }, []);

  // 删除任务
  const handleTaskDelete = useCallback(async (taskId: string) => {
    try {
      await monitoringService.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      message.success('任务删除成功！');
    } catch (error) {
      message.error('删除任务失败');
    }
  }, []);

  // 切换任务状态
  const handleToggleTaskStatus = useCallback(async (taskId: string, status: 'active' | 'paused') => {
    try {
      await monitoringService.updateTask(taskId, { status });
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, status } : t
      ));
      message.success(`任务已${status === 'active' ? '启动' : '暂停'}`);
    } catch (error) {
      message.error('操作失败');
    }
  }, []);

  // 查看任务详情
  const handleViewTaskDetails = useCallback((task: MonitoringTask) => {
    setActiveTab('replies');
  }, []);

  // 编辑任务
  const handleEditTask = useCallback((task: MonitoringTask) => {
    setActiveTab('config');
  }, []);

  // 更新评论状态
  const handleCommentUpdate = useCallback(async (commentId: string, status: CommentData['status']) => {
    try {
      await monitoringService.updateCommentStatus(commentId, status);
      loadComments();
    } catch (error) {
      message.error('更新评论状态失败');
    }
  }, [loadComments]);

  // 刷新数据
  const handleRefresh = useCallback(() => {
    loadTasks();
    loadComments();
    refreshDevices();
  }, [loadTasks, loadComments, refreshDevices]);

  // 计算统计数据
  const stats = {
    totalTasks: tasks.length,
    activeTasks: tasks.filter(t => t.status === 'active').length,
    pendingComments: comments.filter(c => c.status === 'pending').length,
    totalReplies: comments.filter(c => c.status === 'replied').length
  };

  // 标签页配置
  const tabItems = [
    {
      key: 'config',
      label: (
        <span className="flex items-center space-x-1">
          <PlusOutlined />
          <span>添加监控</span>
        </span>
      ),
      children: (
        <AccountMonitoringConfig
          onlineDevices={onlineDevices}
          onTaskCreate={handleTaskCreate}
        />
      )
    },
    {
      key: 'tasks',
      label: (
        <span className="flex items-center space-x-1">
          <BarChartOutlined />
          <span>监控列表</span>
          <Badge count={stats.totalTasks} showZero />
        </span>
      ),
      children: (
        <TaskList
          tasks={tasks}
          onlineDevices={onlineDevices}
          onEditTask={handleEditTask}
          onDeleteTask={handleTaskDelete}
          onToggleTaskStatus={handleToggleTaskStatus}
          onViewTaskDetails={handleViewTaskDetails}
        />
      )
    },
    {
      key: 'replies',
      label: (
        <span className="flex items-center space-x-1">
          <MessageOutlined />
          <span>回复管理</span>
          <Badge count={stats.pendingComments} showZero />
        </span>
      ),
      children: (
        <ReplyTaskManager
          comments={comments}
          onlineDevices={onlineDevices}
          onCommentUpdate={handleCommentUpdate}
          onRefresh={handleRefresh}
        />
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* 模块标题和统计 */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <UserOutlined style={{ fontSize: '24px', color: '#722ed1' }} />
            <div>
              <Title level={3} className="m-0">账号监控</Title>
              <span className="text-gray-600">
                监控指定账号或视频的评论区，根据数据推送监控提醒
              </span>
            </div>
          </div>
          
          {/* 统计信息 */}
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.activeTasks}</div>
              <div className="text-sm text-gray-500">监控中</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.pendingComments}</div>
              <div className="text-sm text-gray-500">待处理</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.totalReplies}</div>
              <div className="text-sm text-gray-500">已回复</div>
            </div>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleRefresh}
              loading={loading}
            >
              刷新
            </Button>
          </div>
        </div>
      </Card>

      {/* 功能标签页 */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          type="card"
        />
      </Card>
    </div>
  );
};