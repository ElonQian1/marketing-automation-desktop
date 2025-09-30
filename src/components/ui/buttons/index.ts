/**
 * 按钮组件库统一导出
 * 提供所有按钮组件的便捷导入方式
 */

export { PrimaryButton, type PrimaryButtonProps } from './PrimaryButton';
export { SecondaryButton, type SecondaryButtonProps } from './SecondaryButton';
export { 
  IconButton, 
  CircularIconButton, 
  SquareIconButton, 
  type IconButtonProps 
} from './IconButton';

// 重新导出常用的 Ant Design 按钮类型
export type { ButtonProps } from 'antd';

// 按钮组件使用指南
export const ButtonUsageGuide = {
  primary: {
    description: '用于最重要的操作，如提交、确认、开始等',
    examples: ['提交表单', '开始执行', '确认操作', '保存更改'],
  },
  secondary: {
    description: '用于次要操作，如取消、重置、后退等',
    examples: ['取消操作', '重置表单', '返回上级', '查看详情'],
  },
  usage: {
    recommendation: '一个界面中通常只有一个主要按钮，可以有多个次要按钮',
    accessibility: '确保按钮有清晰的文本标签，支持键盘导航',
    responsive: '在移动端确保按钮足够大（最小44px高度）',
  },
} as const;