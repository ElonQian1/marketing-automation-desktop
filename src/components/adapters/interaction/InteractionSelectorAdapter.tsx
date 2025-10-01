/**
 * 交互选择器适配器 - Employee D 架构
 * 
 * 目的：替换所有.ant-*直接选择器，提供语义化的交互元素检测
 * 原则：零覆盖、适配器统一、Employee D "单任务单文件"
 */

import React from 'react';

/**
 * 交互元素选择器配置
 */
export interface InteractionSelectorConfig {
  /** 包含基础表单元素 */
  includeFormElements?: boolean;
  /** 包含AntD组件容器 */
  includeAntdComponents?: boolean;
  /** 包含自定义无交互标记 */
  includeCustomMarkers?: boolean;
  /** 自定义选择器 */
  customSelectors?: string[];
}

/**
 * 默认交互元素选择器配置
 */
const DEFAULT_CONFIG: InteractionSelectorConfig = {
  includeFormElements: true,
  includeAntdComponents: true,
  includeCustomMarkers: true,
  customSelectors: []
};

/**
 * 构建交互元素选择器字符串
 */
export function buildInteractionSelector(config: InteractionSelectorConfig = {}): string {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const selectors: string[] = [];

  // 基础表单元素
  if (finalConfig.includeFormElements) {
    selectors.push(
      'input',
      'button', 
      'select',
      'textarea',
      '[role="spinbutton"]'
    );
  }

  // AntD组件容器 - 通过语义化data属性替代.ant-*选择器
  if (finalConfig.includeAntdComponents) {
    selectors.push(
      '[data-antd-component="select"]',
      '[data-antd-component="input-number"]',
      '[data-antd-component="button"]',
      '[data-antd-component="dropdown"]',
      '[data-antd-component="upload-drag"]'
    );
  }

  // 自定义无交互标记
  if (finalConfig.includeCustomMarkers) {
    selectors.push('[data-no-card-toggle]');
  }

  // 自定义选择器
  if (finalConfig.customSelectors?.length) {
    selectors.push(...finalConfig.customSelectors);
  }

  return selectors.join(', ');
}

/**
 * 检查元素是否为交互元素
 */
export function isInteractionElement(
  element: HTMLElement | null,
  config?: InteractionSelectorConfig
): boolean {
  if (!element) return false;
  
  const selector = buildInteractionSelector(config);
  return element.closest(selector) !== null;
}

/**
 * React Hook：使用交互选择器
 */
export function useInteractionSelector(config?: InteractionSelectorConfig) {
  return React.useMemo(() => ({
    selector: buildInteractionSelector(config),
    isInteractionElement: (element: HTMLElement | null) => 
      isInteractionElement(element, config)
  }), [config]);
}

/**
 * 交互选择器适配器组件
 * 提供子组件访问交互检测逻辑
 */
export interface InteractionSelectorAdapterProps {
  config?: InteractionSelectorConfig;
  children: (utils: {
    selector: string;
    isInteractionElement: (element: HTMLElement | null) => boolean;
  }) => React.ReactNode;
}

export const InteractionSelectorAdapter: React.FC<InteractionSelectorAdapterProps> = ({
  config,
  children
}) => {
  const utils = useInteractionSelector(config);
  return <>{children(utils)}</>;
};

export default InteractionSelectorAdapter;