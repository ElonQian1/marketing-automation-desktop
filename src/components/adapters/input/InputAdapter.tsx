/**
 * Input 输入框适配器 - Employee D 架构
 * 
 * 目的：为页面层提供输入框组件，避免直连AntD Input
 * 原则：适配器统一、品牌化一致、零覆盖
 */

import React from 'react';
import { Input as AntInput } from 'antd';
import type { InputProps } from 'antd';

/**
 * Input 输入框适配器
 * 封装 AntD Input 组件，提供统一的输入框接口
 */
export const Input: React.FC<InputProps> = (props) => {
  return <AntInput {...props} />;
};

/**
 * TextArea 文本域适配器
 * 封装 AntD Input.TextArea 组件，提供统一的文本域接口
 */
export const TextArea: React.FC<React.ComponentProps<typeof AntInput.TextArea>> = (props) => {
  return <AntInput.TextArea {...props} />;
};

/**
 * Search 搜索框适配器
 * 封装 AntD Input.Search 组件，提供统一的搜索框接口
 */
export const Search: React.FC<React.ComponentProps<typeof AntInput.Search>> = (props) => {
  return <AntInput.Search {...props} />;
};

/**
 * Password 密码框适配器
 * 封装 AntD Input.Password 组件，提供统一的密码框接口
 */
export const Password: React.FC<React.ComponentProps<typeof AntInput.Password>> = (props) => {
  return <AntInput.Password {...props} />;
};

/**
 * Input 适配器组合导出
 */
export const InputAdapter = {
  Input,
  TextArea,
  Search,
  Password
};

export default InputAdapter;