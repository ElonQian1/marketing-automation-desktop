/**
 * 主题工具 Hook
 * 提供主题相关的实用工具函数
 */

import { useMemo, useCallback } from 'react';
import { theme as antdTheme } from 'antd';
import type { ThemeMode, AppThemeConfig, ThemeTokens } from '../types';
import { getThemeTokens, generateAntdThemeConfig } from '../tokens';

/**
 * 主题工具结果
 */
export interface ThemeUtilsResult {
  /** 获取指定模式的颜色 token */
  getColorToken: (mode: ThemeMode, tokenName: string) => string;
  /** 获取指定模式的完整 token */
  getTokens: (mode: ThemeMode) => ThemeTokens;
  /** 生成 Ant Design 主题配置 */
  generateAntdConfig: (mode: ThemeMode) => AppThemeConfig;
  /** 检查是否为暗色主题 */
  isDark: (mode: ThemeMode) => boolean;
  /** 检查是否为亮色主题 */
  isLight: (mode: ThemeMode) => boolean;
  /** 获取相反的主题模式 */
  getOppositeMode: (mode: ThemeMode) => ThemeMode;
  /** 格式化颜色值 */
  formatColor: (color: string) => string;
  /** 计算颜色的明暗度 */
  getColorLuminance: (color: string) => number;
  /** 判断颜色是否为深色 */
  isColorDark: (color: string) => boolean;
  /** 生成颜色的不透明度变体 */
  withOpacity: (color: string, opacity: number) => string;
  /** 混合两个颜色 */
  mixColors: (color1: string, color2: string, ratio: number) => string;
}

/**
 * 主题工具 Hook
 */
export const useThemeUtils = (): ThemeUtilsResult => {
  // 获取 Ant Design 主题算法
  const { getDesignToken } = antdTheme;

  // 获取指定模式的颜色 token
  const getColorToken = useCallback((mode: ThemeMode, tokenName: string): string => {
    const tokens = getThemeTokens(mode);
    return tokens[tokenName] || tokens.colorPrimary || '#1677ff';
  }, []);

  // 获取指定模式的完整 token
  const getTokens = useCallback((mode: ThemeMode) => {
    return getThemeTokens(mode);
  }, []);

  // 生成 Ant Design 主题配置
  const generateAntdConfig = useCallback((mode: ThemeMode): AppThemeConfig => {
    return {
      mode,
      ...generateAntdThemeConfig(mode),
    };
  }, []);

  // 主题模式检查函数
  const isDark = useCallback((mode: ThemeMode): boolean => mode === 'dark', []);
  const isLight = useCallback((mode: ThemeMode): boolean => mode === 'light', []);
  const getOppositeMode = useCallback((mode: ThemeMode): ThemeMode => {
    return mode === 'dark' ? 'light' : 'dark';
  }, []);

  // 颜色格式化
  const formatColor = useCallback((color: string): string => {
    // 移除多余的空格并转换为小写
    const cleaned = color.trim().toLowerCase();
    
    // 处理十六进制颜色
    if (cleaned.startsWith('#')) {
      // 将短格式转换为长格式 (#abc -> #aabbcc)
      if (cleaned.length === 4) {
        return `#${cleaned[1]}${cleaned[1]}${cleaned[2]}${cleaned[2]}${cleaned[3]}${cleaned[3]}`;
      }
      return cleaned;
    }
    
    // 处理 rgb/rgba 颜色
    if (cleaned.startsWith('rgb')) {
      return cleaned;
    }
    
    // 处理命名颜色
    return cleaned;
  }, []);

  // 计算颜色的相对亮度（0-1）
  const getColorLuminance = useCallback((color: string): number => {
    const formatted = formatColor(color);
    
    // 解析十六进制颜色
    if (formatted.startsWith('#')) {
      const hex = formatted.slice(1);
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;
      
      // 使用 sRGB 亮度公式
      const rs = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
      const gs = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
      const bs = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
      
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }
    
    // 对于非十六进制颜色，返回默认值
    return 0.5;
  }, [formatColor]);

  // 判断颜色是否为深色
  const isColorDark = useCallback((color: string): boolean => {
    return getColorLuminance(color) < 0.5;
  }, [getColorLuminance]);

  // 为颜色添加不透明度
  const withOpacity = useCallback((color: string, opacity: number): string => {
    const formatted = formatColor(color);
    const clampedOpacity = Math.max(0, Math.min(1, opacity));
    
    if (formatted.startsWith('#')) {
      const hex = formatted.slice(1);
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      
      return `rgba(${r}, ${g}, ${b}, ${clampedOpacity})`;
    }
    
    // 如果已经是 rgba 格式，替换 alpha 值
    if (formatted.startsWith('rgba')) {
      return formatted.replace(/[\d.]+\)$/, `${clampedOpacity})`);
    }
    
    // 如果是 rgb 格式，转换为 rgba
    if (formatted.startsWith('rgb')) {
      return formatted.replace('rgb', 'rgba').replace(')', `, ${clampedOpacity})`);
    }
    
    return formatted;
  }, [formatColor]);

  // 混合两个颜色
  const mixColors = useCallback((color1: string, color2: string, ratio: number): string => {
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    
    const parseHex = (hex: string) => {
      const cleaned = hex.startsWith('#') ? hex.slice(1) : hex;
      return {
        r: parseInt(cleaned.substring(0, 2), 16),
        g: parseInt(cleaned.substring(2, 4), 16),
        b: parseInt(cleaned.substring(4, 6), 16),
      };
    };
    
    const formatHex = (r: number, g: number, b: number) => {
      const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    };
    
    try {
      const c1 = parseHex(formatColor(color1));
      const c2 = parseHex(formatColor(color2));
      
      const r = c1.r + (c2.r - c1.r) * clampedRatio;
      const g = c1.g + (c2.g - c1.g) * clampedRatio;
      const b = c1.b + (c2.b - c1.b) * clampedRatio;
      
      return formatHex(r, g, b);
    } catch {
      // 混合失败时返回第一个颜色
      return formatColor(color1);
    }
  }, [formatColor]);

  // 返回所有工具函数
  return useMemo(() => ({
    getColorToken,
    getTokens,
    generateAntdConfig,
    isDark,
    isLight,
    getOppositeMode,
    formatColor,
    getColorLuminance,
    isColorDark,
    withOpacity,
    mixColors,
  }), [
    getColorToken,
    getTokens,
    generateAntdConfig,
    isDark,
    isLight,
    getOppositeMode,
    formatColor,
    getColorLuminance,
    isColorDark,
    withOpacity,
    mixColors,
  ]);
};

/**
 * 主题调试 Hook
 * 提供主题调试相关的工具
 */
export const useThemeDebug = (mode: ThemeMode) => {
  const utils = useThemeUtils();
  
  return useMemo(() => ({
    // 当前主题信息
    currentMode: mode,
    tokens: utils.getTokens(mode),
    antdConfig: utils.generateAntdConfig(mode),
    
    // 调试方法
    logTokens: () => console.table(utils.getTokens(mode)),
    logAntdConfig: () => console.log('Ant Design Config:', utils.generateAntdConfig(mode)),
    
    // 颜色测试
    testColor: (color: string) => ({
      original: color,
      formatted: utils.formatColor(color),
      luminance: utils.getColorLuminance(color),
      isDark: utils.isColorDark(color),
      withOpacity50: utils.withOpacity(color, 0.5),
    }),
  }), [mode, utils]);
};