/**
 * Typography 适配器 - Employee D 架构
 * 
 * 目的：为页面层提供文字排版组件，避免直连AntD Typography
 * 原则：适配器统一、品牌化一致、零覆盖
 */

import React from 'react';
import { Typography } from 'antd';

const { Text: AntText, Title: AntTitle } = Typography;

/**
 * Text 文本适配器
 * 封装 AntD Text 组件，提供统一的文本接口
 */
export const Text = AntText;

/**
 * Title 标题适配器
 * 封装 AntD Title 组件，提供统一的标题接口
 */
export const Title = AntTitle;

/**
 * Typography 适配器组合导出
 */
export const TypographyAdapter = {
  Text,
  Title
};

export default TypographyAdapter;