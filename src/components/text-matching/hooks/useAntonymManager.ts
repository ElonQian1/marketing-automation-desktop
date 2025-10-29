// src/components/text-matching/hooks/useAntonymManager.ts
// module: text-matching | layer: hooks | role: 反义词管理Hook
// summary: 管理反义词对的增删改查和持久化

import { useState, useCallback, useEffect } from 'react';
import type { AntonymPair } from '../types';

const defaultAntonymPairs: AntonymPair[] = [
  {
    id: '1',
    positive: '关注',
    negative: '取消关注',
    category: '社交操作',
    confidence: 0.95,
    enabled: true,
    description: '社交媒体关注操作的反义词对'
  },
  {
    id: '2',
    positive: '同意',
    negative: '拒绝',
    category: '确认操作',
    confidence: 0.90,
    enabled: true,
    description: '确认/拒绝操作的反义词对'
  },
  {
    id: '3',
    positive: '开启',
    negative: '关闭',
    category: '开关操作',
    confidence: 0.95,
    enabled: true,
    description: '开关控制的反义词对'
  },
  {
    id: '4',
    positive: '登录',
    negative: '退出',
    category: '身份验证',
    confidence: 0.85,
    enabled: true,
    description: '登录/登出操作的反义词对'
  },
  {
    id: '5',
    positive: '购买',
    negative: '取消订单',
    category: '电商操作',
    confidence: 0.80,
    enabled: true,
    description: '购买相关操作的反义词对'
  }
];

export const useAntonymManager = () => {
  const [antonymPairs, setAntonymPairs] = useState<AntonymPair[]>(defaultAntonymPairs);
  const [loading, setLoading] = useState(false);

  // 添加反义词对
  const addAntonymPair = useCallback((pair: Omit<AntonymPair, 'id'>) => {
    const newPair: AntonymPair = {
      ...pair,
      id: Date.now().toString()
    };
    setAntonymPairs(prev => [...prev, newPair]);
  }, []);

  // 更新反义词对
  const updateAntonymPair = useCallback((id: string, updates: Partial<AntonymPair>) => {
    setAntonymPairs(prev => 
      prev.map(pair => 
        pair.id === id ? { ...pair, ...updates } : pair
      )
    );
  }, []);

  // 删除反义词对
  const deleteAntonymPair = useCallback((id: string) => {
    setAntonymPairs(prev => prev.filter(pair => pair.id !== id));
  }, []);

  // 切换启用状态
  const toggleAntonymPair = useCallback((id: string) => {
    setAntonymPairs(prev => 
      prev.map(pair => 
        pair.id === id ? { ...pair, enabled: !pair.enabled } : pair
      )
    );
  }, []);

  // 批量导入
  const importAntonymPairs = useCallback((pairs: AntonymPair[]) => {
    setAntonymPairs(pairs);
  }, []);

  // 导出为JSON
  const exportAntonymPairs = useCallback(() => {
    return JSON.stringify(antonymPairs, null, 2);
  }, [antonymPairs]);

  // 重置为默认
  const resetToDefault = useCallback(() => {
    setAntonymPairs(defaultAntonymPairs);
  }, []);

  // 获取启用的反义词对
  const getEnabledPairs = useCallback(() => {
    return antonymPairs.filter(pair => pair.enabled);
  }, [antonymPairs]);

  // 检查文本是否有反义关系
  const checkAntonymRelation = useCallback((text1: string, text2: string) => {
    const enabledPairs = getEnabledPairs();
    for (const pair of enabledPairs) {
      if (
        (text1.includes(pair.positive) && text2.includes(pair.negative)) ||
        (text1.includes(pair.negative) && text2.includes(pair.positive))
      ) {
        return {
          isAntonym: true,
          pair,
          confidence: pair.confidence || 0.8
        };
      }
    }
    return { isAntonym: false, pair: null, confidence: 0 };
  }, [getEnabledPairs]);

  // 从后端加载配置（模拟）
  const loadFromBackend = useCallback(async () => {
    setLoading(true);
    try {
      // 这里将来可以调用后端API
      // const response = await fetch('/api/antonym-pairs');
      // const data = await response.json();
      // setAntonymPairs(data);
      
      // 模拟异步加载
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('加载反义词配置失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 保存到后端（模拟）
  const saveToBackend = useCallback(async () => {
    setLoading(true);
    try {
      // 这里将来可以调用后端API
      // await fetch('/api/antonym-pairs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(antonymPairs)
      // });
      
      // 模拟异步保存
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('反义词配置已保存:', antonymPairs);
    } catch (error) {
      console.error('保存反义词配置失败:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [antonymPairs]);

  // 组件挂载时加载配置
  useEffect(() => {
    loadFromBackend();
  }, [loadFromBackend]);

  return {
    // 数据
    antonymPairs,
    loading,
    
    // 操作方法
    addAntonymPair,
    updateAntonymPair,
    deleteAntonymPair,
    toggleAntonymPair,
    importAntonymPairs,
    exportAntonymPairs,
    resetToDefault,
    
    // 查询方法
    getEnabledPairs,
    checkAntonymRelation,
    
    // 持久化方法
    loadFromBackend,
    saveToBackend
  };
};