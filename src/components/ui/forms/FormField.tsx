/**
 * 表单字段包装器组件
 * 统一的表单字段布局和样式
 * 文件大小控制：< 200行
 */

import React from 'react';
import { Form, FormItemProps } from 'antd';
import classNames from 'classnames';

export interface FormFieldProps extends Omit<FormItemProps, 'children'> {
  /** 字段标签 */
  label?: string;
  /** 是否必填 */
  required?: boolean;
  /** 帮助文本 */
  helpText?: string;
  /** 错误信息 */
  error?: string;
  /** 字段大小 */
  size?: 'small' | 'medium' | 'large';
  /** 自定义类名 */
  className?: string;
  /** 子组件 */
  children: React.ReactNode;
}

/**
 * 表单字段包装器组件
 * 提供统一的表单字段布局和样式
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  helpText,
  error,
  size = 'medium',
  className,
  children,
  ...props
}) => {
  // 构建CSS类名
  const fieldClasses = classNames(
    'form-field',
    `form-field--${size}`,
    {
      'form-field--required': required,
      'form-field--error': error,
    },
    className
  );

  // 处理验证状态
  const validateStatus = error ? 'error' : undefined;
  const help = error || helpText;

  return (
    <Form.Item
      label={label}
      required={required}
      validateStatus={validateStatus}
      help={help}
      className={fieldClasses}
      {...props}
    >
      {children}
    </Form.Item>
  );
};

export default FormField;