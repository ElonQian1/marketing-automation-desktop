// src/modules/ai/domain/tools-schema.ts
// module: ai | layer: domain | role: AI 工具函数 Schema 定义
// summary: 定义 AI 可以调用的工具函数 Schema

import type { ToolSpec } from './ai-types';

/**
 * 获取 XML 工具
 */
export const ToolFetchXml: ToolSpec = {
  name: 'fetch_xml',
  description: '获取当前页面的 XML 布局结构，用于分析页面元素',
  parameters: {
    type: 'object',
    properties: {
      regionHint: {
        type: 'string',
        description: '可选的区域提示，用于限制获取的 XML 范围',
      },
      includeInvisible: {
        type: 'boolean',
        description: '是否包含不可见元素',
        default: false,
      },
    },
  },
};

/**
 * 查询索引工具
 */
export const ToolQueryIndex: ToolSpec = {
  name: 'query_index',
  description: '查询全局或局部索引，返回匹配的候选元素',
  parameters: {
    type: 'object',
    required: ['query', 'scope'],
    properties: {
      query: {
        type: 'string',
        description: '查询关键词或描述',
      },
      scope: {
        type: 'string',
        enum: ['local', 'global'],
        description: '查询范围：local（当前页面）或 global（全局索引）',
      },
      maxResults: {
        type: 'number',
        description: '返回的最大结果数',
        default: 10,
      },
    },
  },
};

/**
 * 点击元素工具
 */
export const ToolTapElement: ToolSpec = {
  name: 'tap_element',
  description: '在设备上执行点击操作',
  parameters: {
    type: 'object',
    required: ['x', 'y'],
    properties: {
      x: {
        type: 'number',
        description: '点击的 X 坐标',
      },
      y: {
        type: 'number',
        description: '点击的 Y 坐标',
      },
      duration: {
        type: 'number',
        description: '长按持续时间（毫秒），0 表示普通点击',
        default: 0,
      },
    },
  },
};

/**
 * 分析元素工具
 */
export const ToolAnalyzeElement: ToolSpec = {
  name: 'analyze_element',
  description: '深度分析特定元素的属性和上下文',
  parameters: {
    type: 'object',
    required: ['elementId'],
    properties: {
      elementId: {
        type: 'string',
        description: '要分析的元素 ID 或 XPath',
      },
      includeParent: {
        type: 'boolean',
        description: '是否包含父元素信息',
        default: true,
      },
      includeChildren: {
        type: 'boolean',
        description: '是否包含子元素信息',
        default: false,
      },
    },
  },
};

/**
 * 截图工具
 */
export const ToolCaptureScreen: ToolSpec = {
  name: 'capture_screen',
  description: '捕获设备屏幕截图',
  parameters: {
    type: 'object',
    properties: {
      region: {
        type: 'object',
        description: '可选的截图区域',
        properties: {
          x: { type: 'number' },
          y: { type: 'number' },
          width: { type: 'number' },
          height: { type: 'number' },
        },
      },
    },
  },
};

/**
 * 所有可用的工具列表
 */
export const ALL_TOOLS: ToolSpec[] = [
  ToolFetchXml,
  ToolQueryIndex,
  ToolTapElement,
  ToolAnalyzeElement,
  ToolCaptureScreen,
];

/**
 * 按名称获取工具
 */
export function getToolByName(name: string): ToolSpec | undefined {
  return ALL_TOOLS.find(tool => tool.name === name);
}
