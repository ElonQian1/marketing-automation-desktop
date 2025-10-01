/**
 * ButtonAdapter - 兼容 AntD 风格属性的按钮适配器
 *
 * 目的：
 * - 为存量页面（如 contact-import）提供向后兼容的 Button 接口
 * - 将 AntD 风格的 props（type/size/icon/danger/ghost/htmlType）映射到 UI 层的品牌化 Button
 */

import * as React from 'react';
import { Button as UIButton, type ButtonProps as UIButtonProps, type ButtonTone } from '@/components/ui';

type AntdLegacyType = 'primary' | 'dashed' | 'link' | 'text' | 'default';
type AntdLegacySize = 'small' | 'middle' | 'large';

export interface ButtonAdapterProps
  extends Omit<UIButtonProps, 'variant' | 'tone' | 'size' | 'leftIcon' | 'rightIcon' | 'type'> {
  /** AntD 风格：按钮语义类型 */
  type?: AntdLegacyType;
  /** AntD 风格：尺寸 */
  size?: AntdLegacySize | 'sm' | 'md' | 'lg' | 'icon';
  /** AntD 风格：危险态（红色语义） */
  danger?: boolean;
  /** AntD 风格：幽灵按钮（弱化背景） */
  ghost?: boolean;
  /** AntD 风格：图标（放在左侧） */
  icon?: React.ReactNode;
  /** AntD 风格：原生 type（submit/reset/button） */
  htmlType?: React.ButtonHTMLAttributes<HTMLButtonElement>['type'];
}

const mapSize = (size?: ButtonAdapterProps['size']): UIButtonProps['size'] => {
  if (!size) return 'md';
  if (size === 'icon' || size === 'sm' || size === 'md' || size === 'lg') return size;
  switch (size) {
    case 'small':
      return 'sm';
    case 'middle':
      return 'md';
    case 'large':
      return 'lg';
    default:
      return 'md';
  }
};

const mapVariantAndTone = (
  antdType?: AntdLegacyType,
  danger?: boolean,
  ghost?: boolean
): { variant: UIButtonProps['variant']; tone: ButtonTone } => {
  // danger 最高优先级
  if (danger) {
    return { variant: ghost ? 'ghost' : 'solid', tone: 'danger' };
  }

  switch (antdType) {
    case 'primary':
      return { variant: 'solid', tone: 'brand' };
    case 'link':
      return { variant: 'link', tone: 'brand' };
    case 'text':
      return { variant: 'ghost', tone: 'neutral' };
    case 'dashed':
      return { variant: 'outline', tone: 'neutral' };
    case 'default':
    default:
      return { variant: ghost ? 'ghost' : 'soft', tone: 'neutral' };
  }
};

export const Button: React.FC<ButtonAdapterProps> = (props) => {
  const { type: antdType, size, icon, danger, ghost, htmlType, children, ...rest } = props;

  const { variant, tone } = mapVariantAndTone(antdType, danger, ghost);
  const mappedSize = mapSize(size);

  // 将 AntD 的 icon 映射到左侧图标
  const leftIcon = icon;

  // 注意：避免把 antdType 透传到原生 button 的 type 属性
  return (
    <UIButton
      variant={variant}
      tone={tone}
      size={mappedSize}
      leftIcon={leftIcon}
      type={htmlType}
      {...rest}
    >
      {children}
    </UIButton>
  );
};

export default Button;
