/**
 * 精准获客监控服务
 * 提供行业监控、账号监控、任务管理等核心业务逻辑
 */

import type { Device } from '../../../domain/adb/entities/Device';

// 类型定义
export interface MonitoringTask {
  id: string;
  type: 'industry' | 'account' | 'video';
  status: 'active' | 'paused' | 'completed' | 'error';
  createdAt: string;
  updatedAt: string;
  
  // 监控配置
  keywords?: string[];
  targetAccount?: string;
  targetVideo?: string;
  
  // 筛选条件
  filters: {
    region?: string[];
    commentTimeRange?: number; // 天数
    minLikes?: number;
    minComments?: number;
    minViews?: number;
  };
  
  // 执行设备
  assignedDevices: string[];
  
  // 统计数据
  stats: {
    followCount: number;
    replyCount: number;
    lastExecuted?: string;
  };
}

export interface CommentData {
  id: string;
  videoId: string;
  videoTitle: string;
  videoUrl: string;
  authorId: string;
  authorName: string;
  content: string;
  publishTime: string;
  likes: number;
  region?: string;
  
  // 任务相关
  taskId: string;
  status: 'pending' | 'followed' | 'replied' | 'ignored';
  assignedDevice?: string;
  
  // 回复信息
  replyContent?: string;
  replyTime?: string;
  replyDevice?: string;
}

export interface DuplicationRule {
  id: string;
  name: string;
  type: 'follow' | 'reply';
  devices: string[];
  timeWindow: number; // 小时
  maxActions: number; // 同一目标的最大操作次数
  enabled: boolean;
}

export interface ReplyTask {
  id: string;
  commentId: string;
  comment: CommentData;
  status: 'pending' | 'completed' | 'failed';
  assignedDevice?: string;
  replyContent?: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

// 监控服务类
export class MonitoringService {
  private tasks: Map<string, MonitoringTask> = new Map();
  private comments: Map<string, CommentData> = new Map();
  private duplicationRules: Map<string, DuplicationRule> = new Map();
  private replyTasks: Map<string, ReplyTask> = new Map();
  
  constructor() {
    this.loadMockData();
  }

  // 任务管理
  async createTask(config: Partial<MonitoringTask>): Promise<MonitoringTask> {
    const task: MonitoringTask = {
      id: `task_${Date.now()}`,
      type: config.type || 'industry',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      keywords: config.keywords || [],
      targetAccount: config.targetAccount,
      targetVideo: config.targetVideo,
      filters: {
        commentTimeRange: 7, // 默认7天
        ...config.filters
      },
      assignedDevices: config.assignedDevices || [],
      stats: {
        followCount: 0,
        replyCount: 0
      }
    };
    
    this.tasks.set(task.id, task);
    return task;
  }

  async getTasks(): Promise<MonitoringTask[]> {
    return Array.from(this.tasks.values());
  }

  async updateTask(taskId: string, updates: Partial<MonitoringTask>): Promise<void> {
    const task = this.tasks.get(taskId);
    if (task) {
      Object.assign(task, updates, {
        updatedAt: new Date().toISOString()
      });
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    this.tasks.delete(taskId);
    // 清理相关评论和回复任务
    for (const [id, comment] of this.comments.entries()) {
      if (comment.taskId === taskId) {
        this.comments.delete(id);
      }
    }
    for (const [id, replyTask] of this.replyTasks.entries()) {
      if (this.comments.get(replyTask.commentId)?.taskId === taskId) {
        this.replyTasks.delete(id);
      }
    }
  }

  // 评论数据管理
  async getCommentsByTask(taskId: string): Promise<CommentData[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.taskId === taskId);
  }

  async updateCommentStatus(commentId: string, status: CommentData['status'], device?: string): Promise<void> {
    const comment = this.comments.get(commentId);
    if (comment) {
      comment.status = status;
      if (device) {
        comment.assignedDevice = device;
      }
    }
  }

  // 查重功能
  async checkDuplication(action: 'follow' | 'reply', targetId: string, deviceId: string): Promise<boolean> {
    const rules = Array.from(this.duplicationRules.values())
      .filter(rule => rule.type === action && rule.enabled && rule.devices.includes(deviceId));

    for (const rule of rules) {
      const windowStart = new Date(Date.now() - rule.timeWindow * 60 * 60 * 1000);
      let actionCount = 0;

      if (action === 'follow') {
        // 检查关注操作重复
        actionCount = Array.from(this.comments.values())
          .filter(comment => 
            comment.authorId === targetId &&
            comment.status === 'followed' &&
            comment.assignedDevice === deviceId &&
            new Date(comment.replyTime || comment.publishTime) > windowStart
          ).length;
      } else {
        // 检查回复操作重复
        actionCount = Array.from(this.comments.values())
          .filter(comment => 
            comment.id === targetId &&
            comment.status === 'replied' &&
            comment.replyDevice === deviceId &&
            new Date(comment.replyTime || '') > windowStart
          ).length;
      }

      if (actionCount >= rule.maxActions) {
        return true; // 检测到重复
      }
    }

    return false; // 未检测到重复
  }

  // 回复任务管理
  async createReplyTask(commentId: string, replyContent: string, deviceId: string): Promise<ReplyTask> {
    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new Error('评论不存在');
    }

    // 检查查重
    const isDuplicate = await this.checkDuplication('reply', commentId, deviceId);
    if (isDuplicate) {
      throw new Error('检测到重复操作，根据查重规则阻止此次回复');
    }

    const replyTask: ReplyTask = {
      id: `reply_${Date.now()}`,
      commentId,
      comment,
      status: 'pending',
      assignedDevice: deviceId,
      replyContent,
      createdAt: new Date().toISOString()
    };

    this.replyTasks.set(replyTask.id, replyTask);
    return replyTask;
  }

  async getReplyTasks(status?: ReplyTask['status']): Promise<ReplyTask[]> {
    const tasks = Array.from(this.replyTasks.values());
    return status ? tasks.filter(task => task.status === status) : tasks;
  }

  async completeReplyTask(taskId: string, success: boolean, error?: string): Promise<void> {
    const task = this.replyTasks.get(taskId);
    if (task) {
      task.status = success ? 'completed' : 'failed';
      task.completedAt = new Date().toISOString();
      if (error) {
        task.error = error;
      }

      // 更新评论状态
      if (success) {
        const comment = this.comments.get(task.commentId);
        if (comment) {
          comment.status = 'replied';
          comment.replyContent = task.replyContent;
          comment.replyTime = new Date().toISOString();
          comment.replyDevice = task.assignedDevice;
        }
      }
    }
  }

  // 统计数据
  async getDailyStats(date: string): Promise<{
    follows: Array<{ date: string; accountId: string; deviceId: string }>;
    replies: Array<{ 
      date: string; 
      videoUrl: string; 
      commentAuthorId: string; 
      commentContent: string; 
      replyAccountId: string; 
      replyContent: string; 
    }>;
  }> {
    const targetDate = new Date(date);
    const follows: any[] = [];
    const replies: any[] = [];

    for (const comment of this.comments.values()) {
      const actionDate = new Date(comment.replyTime || comment.publishTime);
      
      if (actionDate.toDateString() === targetDate.toDateString()) {
        if (comment.status === 'followed') {
          follows.push({
            date: actionDate.toISOString().split('T')[0],
            accountId: comment.authorId,
            deviceId: comment.assignedDevice || ''
          });
        }
        
        if (comment.status === 'replied') {
          replies.push({
            date: actionDate.toISOString().split('T')[0],
            videoUrl: comment.videoUrl,
            commentAuthorId: comment.authorId,
            commentContent: comment.content,
            replyAccountId: comment.replyDevice || '',
            replyContent: comment.replyContent || ''
          });
        }
      }
    }

    return { follows, replies };
  }

  // 地域筛选选项
  getRegionOptions(): Array<{ value: string; label: string }> {
    return [
      { value: 'beijing', label: '北京' },
      { value: 'shanghai', label: '上海' },
      { value: 'guangzhou', label: '广州' },
      { value: 'shenzhen', label: '深圳' },
      { value: 'hangzhou', label: '杭州' },
      { value: 'chengdu', label: '成都' },
      { value: 'wuhan', label: '武汉' },
      { value: 'xian', label: '西安' },
      { value: 'nanjing', label: '南京' },
      { value: 'chongqing', label: '重庆' },
      { value: 'tianjin', label: '天津' },
      { value: 'qingdao', label: '青岛' },
      { value: 'dalian', label: '大连' },
      { value: 'ningbo', label: '宁波' },
      { value: 'xiamen', label: '厦门' }
    ];
  }

  // 加载模拟数据
  private loadMockData(): void {
    // 创建默认查重规则
    const defaultFollowRule: DuplicationRule = {
      id: 'default_follow',
      name: '默认关注查重规则',
      type: 'follow',
      devices: [], // 空数组表示应用于所有设备
      timeWindow: 24, // 24小时内
      maxActions: 1, // 同一用户最多关注1次
      enabled: true
    };

    const defaultReplyRule: DuplicationRule = {
      id: 'default_reply',
      name: '默认回复查重规则',
      type: 'reply',
      devices: [], // 空数组表示应用于所有设备
      timeWindow: 24, // 24小时内
      maxActions: 1, // 同一评论最多回复1次
      enabled: true
    };

    this.duplicationRules.set(defaultFollowRule.id, defaultFollowRule);
    this.duplicationRules.set(defaultReplyRule.id, defaultReplyRule);

    // 创建一些示例评论数据
    const sampleComments: CommentData[] = [
      {
        id: 'comment_1',
        videoId: 'video_1',
        videoTitle: '如何提升产品转化率',
        videoUrl: 'https://example.com/video/1',
        authorId: 'user_001',
        authorName: '产品经理小王',
        content: '这个方法很实用，我们公司正在寻找这样的解决方案',
        publishTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        likes: 15,
        region: 'beijing',
        taskId: 'task_demo_1',
        status: 'pending'
      },
      {
        id: 'comment_2',
        videoId: 'video_2',
        videoTitle: 'B2B营销策略分享',
        videoUrl: 'https://example.com/video/2',
        authorId: 'user_002',
        authorName: '营销总监李总',
        content: '我们正好需要这样的营销工具，有具体的解决方案吗？',
        publishTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        likes: 23,
        region: 'shanghai',
        taskId: 'task_demo_1',
        status: 'pending'
      }
    ];

    sampleComments.forEach(comment => {
      this.comments.set(comment.id, comment);
    });
  }
}

// 单例实例
export const monitoringService = new MonitoringService();