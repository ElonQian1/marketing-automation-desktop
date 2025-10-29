// src/components/text-matching/hooks/useTextMatchingConfig.ts
// module: text-matching | layer: hooks | role: hook
// summary: 文本匹配配置状态管理Hook

import { useState, useCallback } from 'react';
import type { TextMatchingConfig } from '../types';

const defaultConfig: TextMatchingConfig = {
  mode: 'exact',
  enableAntonymDetection: false,
  enableSemanticAnalysis: false,
  confidenceThreshold: 0.8,
  description: '绝对匹配模式：精确匹配文本，不使用智能算法'
};

export const useTextMatchingConfig = () => {
  const [config, setConfig] = useState<TextMatchingConfig>(defaultConfig);

  const updateConfig = useCallback((newConfig: TextMatchingConfig) => {
    setConfig(newConfig);
  }, []);

  const resetConfig = useCallback(() => {
    setConfig(defaultConfig);
  }, []);

  return {
    config,
    updateConfig,
    resetConfig
  };
};