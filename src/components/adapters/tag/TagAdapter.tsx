/**
 * Tag 标签适配器 - Employee D 架构
 * 
 * 目的：为页面层提供标签组件，避免直连AntD Tag
 * 原则：适配器统一、品牌化一致、零覆盖
 */

import React from 'react';
import { Tag as AntTag } from 'antd';
import type { TagProps } from 'antd';

/**
 * Tag 标签适配器
 * 封装 AntD Tag 组件，提供统一的标签接口
 */
export const Tag: React.FC<TagProps> = (props) => {
  return <AntTag {...props} />;
};

/**
 * CheckableTag 可选中标签适配器
 * 封装 AntD Tag.CheckableTag 组件
 */
export const CheckableTag: React.FC<React.ComponentProps<typeof AntTag.CheckableTag>> = (props) => {
  return <AntTag.CheckableTag {...props} />;
};

/**
 * Tag 适配器组合导出
 */
export const TagAdapter = {
  Tag,
  CheckableTag
};

export default TagAdapter;