// src/components/adapters/layout/LayoutAdapter.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * Layout 适配器 - Employee D 架构
 * 
 * 目的：为页面层提供布局组件，避免直连AntD重组件
 * 原则：适配器统一、单任务单文件、零覆盖
 */

import React from 'react';
import { Row as AntRow, Col as AntCol, Space as AntSpace, Divider as AntDivider } from 'antd';
import type { RowProps, ColProps, SpaceProps, DividerProps } from 'antd';

/**
 * Row 布局适配器
 * 封装 AntD Row 组件，提供统一的行布局接口
 */
export const Row: React.FC<RowProps> = (props) => {
  return <AntRow {...props} />;
};

/**
 * Col 布局适配器  
 * 封装 AntD Col 组件，提供统一的列布局接口
 */
export const Col: React.FC<ColProps> = (props) => {
  return <AntCol {...props} />;
};

/**
 * Space 间距适配器
 * 封装 AntD Space 组件，提供统一的间距布局接口
 */
export const Space: React.FC<SpaceProps> = (props) => {
  return <AntSpace {...props} />;
};

/**
 * Divider 分割线适配器
 * 封装 AntD Divider 组件，提供统一的分割线接口
 */
export const Divider: React.FC<DividerProps> = (props) => {
  return <AntDivider {...props} />;
};

/**
 * 布局适配器组合导出
 */
export const LayoutAdapter = {
  Row,
  Col, 
  Space,
  Divider
};

export default LayoutAdapter;