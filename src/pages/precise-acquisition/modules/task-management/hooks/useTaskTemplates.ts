/**
 * 任务模板管理Hook
 * 
 * 管理预定义的任务模板，快速创建常用任务
 */
import { useState, useCallback } from 'react';
import { TaskItem } from '../components/TaskStatusCard';

export interface TaskTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  category: string;
  defaultParams: Record<string, any>;
  estimatedDuration: number; // 预计执行时间（分钟）
  requiredDeviceType?: string;
  tags: string[];
}

const DEFAULT_TEMPLATES: TaskTemplate[] = [
  {
    id: 'follow_users',
    name: '批量关注用户',
    type: 'follow',
    description: '根据筛选条件批量关注目标用户',
    category: '用户操作',
    defaultParams: {
      maxCount: 50,
      delayRange: [2, 5],
      skipExisting: true
    },
    estimatedDuration: 30,
    tags: ['关注', '用户管理']
  },
  {
    id: 'collect_user_info',
    name: '收集用户信息',
    type: 'data_collection',
    description: '从用户主页收集详细信息并保存',
    category: '数据收集',
    defaultParams: {
      includeFollowers: true,
      includeFollowing: false,
      maxDepth: 1
    },
    estimatedDuration: 45,
    tags: ['数据收集', '用户分析']
  },
  {
    id: 'comment_posts',
    name: '智能评论',
    type: 'engagement',
    description: '对目标帖子进行智能评论互动',
    category: '内容互动',
    defaultParams: {
      commentTemplates: ['不错哦！', '很有用的分享', '学到了'],
      maxPerPost: 1,
      randomDelay: true
    },
    estimatedDuration: 20,
    tags: ['评论', '互动']
  },
  {
    id: 'like_posts',
    name: '批量点赞',
    type: 'engagement',
    description: '对筛选出的帖子进行批量点赞',
    category: '内容互动',
    defaultParams: {
      maxCount: 100,
      scrollDelay: 1000,
      skipLiked: true
    },
    estimatedDuration: 15,
    tags: ['点赞', '互动']
  }
];

interface UseTaskTemplatesReturn {
  templates: TaskTemplate[];
  filteredTemplates: TaskTemplate[];
  addTemplate: (template: Omit<TaskTemplate, 'id'>) => void;
  updateTemplate: (id: string, updates: Partial<TaskTemplate>) => void;
  deleteTemplate: (id: string) => void;
  getTemplate: (id: string) => TaskTemplate | undefined;
  createTaskFromTemplate: (templateId: string, customParams?: Record<string, any>) => Omit<TaskItem, 'id' | 'status' | 'progress'> | null;
  filterByCategory: (category: string | null) => void;
  filterByTag: (tag: string | null) => void;
  searchTemplates: (query: string) => void;
  selectedCategory: string | null;
  selectedTag: string | null;
  searchQuery: string;
  categories: string[];
  allTags: string[];
}

export const useTaskTemplates = (): UseTaskTemplatesReturn => {
  const [templates, setTemplates] = useState<TaskTemplate[]>(DEFAULT_TEMPLATES);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 计算分类和标签
  const categories = Array.from(new Set(templates.map(t => t.category)));
  const allTags = Array.from(new Set(templates.flatMap(t => t.tags)));

  // 过滤模板
  const filteredTemplates = templates.filter(template => {
    // 分类过滤
    if (selectedCategory && template.category !== selectedCategory) {
      return false;
    }

    // 标签过滤
    if (selectedTag && !template.tags.includes(selectedTag)) {
      return false;
    }

    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return true;
  });

  // 添加模板
  const addTemplate = useCallback((templateData: Omit<TaskTemplate, 'id'>) => {
    const newTemplate: TaskTemplate = {
      ...templateData,
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    setTemplates(prev => [...prev, newTemplate]);
  }, []);

  // 更新模板
  const updateTemplate = useCallback((id: string, updates: Partial<TaskTemplate>) => {
    setTemplates(prev => prev.map(template =>
      template.id === id ? { ...template, ...updates } : template
    ));
  }, []);

  // 删除模板
  const deleteTemplate = useCallback((id: string) => {
    setTemplates(prev => prev.filter(template => template.id !== id));
  }, []);

  // 获取模板
  const getTemplate = useCallback((id: string) => {
    return templates.find(template => template.id === id);
  }, [templates]);

  // 从模板创建任务
  const createTaskFromTemplate = useCallback((
    templateId: string,
    customParams: Record<string, any> = {}
  ): Omit<TaskItem, 'id' | 'status' | 'progress'> | null => {
    const template = getTemplate(templateId);
    if (!template) return null;

    return {
      name: template.name,
      type: template.type,
      estimatedTime: `约 ${template.estimatedDuration} 分钟`,
      // 合并默认参数和自定义参数
      // 这里可以根据实际需求扩展参数处理逻辑
    };
  }, [getTemplate]);

  // 过滤方法
  const filterByCategory = useCallback((category: string | null) => {
    setSelectedCategory(category);
  }, []);

  const filterByTag = useCallback((tag: string | null) => {
    setSelectedTag(tag);
  }, []);

  const searchTemplates = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  return {
    templates,
    filteredTemplates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplate,
    createTaskFromTemplate,
    filterByCategory,
    filterByTag,
    searchTemplates,
    selectedCategory,
    selectedTag,
    searchQuery,
    categories,
    allTags
  };
};