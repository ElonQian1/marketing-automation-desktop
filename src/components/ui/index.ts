/**
 * UI 组件库统一导出 - 品牌化重构后
 * 
 * 基于设计令牌的现代化轻组件库
 * 使用方式：import { Button, CardShell, TagPill } from '@/components/ui'
 */

// 工具函数
export { cn, focusRing, modernTransition, fastTransition, commonStyles } from './utils';

// 按钮组件
export {
  Button,
  buttonVariants,
  type ButtonProps,
  type ButtonTone,
} from './button/Button';

// 卡片组件
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
} from './card/Card';

export {
  CardShell,
  CardShellHeader,
  CardShellContent,
  CardShellFooter,
  CardShellTitle,
  CardShellDescription,
  CardShellBadges,
  cardShellVariants,
  type CardShellProps,
  type CardShellTone,
} from './card/CardShell';

// 标签组件
export {
  TagPill,
  tagPillVariants,
  type TagPillProps,
} from './tag-pill/TagPill';

// 提示组件
export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  TooltipArrow,
  SimpleTooltip,
  InfoTooltip,
  useTooltip,
} from './tooltip/Tooltip';

// 下拉菜单组件
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuArrow,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSubContentWithArrow,
} from './dropdown/DropdownMenu';

// 对话框组件
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  type DialogContentProps,
} from './dialog/Dialog';

// Motion 预设与包装组件
export * from './motion';

// 反馈组件适配器 - Employee D
export {
  AlertCard,
  LoadingSpinner,
} from './feedback/FeedbackAdapter';

// Typography 适配器 - Employee D  
export {
  Text,
  Title,
} from './typography/TypographyAdapter';

// 类型导出
export type { VariantProps } from 'class-variance-authority';

// 组件库指南（更新后的版本）
export const UIComponentGuide = {
  architecture: {
    lightComponents: '基于 Radix + shadcn + Tailwind 的轻组件（Button, Card, Dialog等）',
    heavyComponents: 'Ant Design 重组件通过适配层统一（Table, Form, Upload等）',  
    tokens: '所有视觉属性从 tokens.css 读取，确保品牌一致性',
  },
  usage: {
    lightComponents: 'import { Button, Card } from "@/components/ui"',
    adapters: 'import { TableAdapter } from "@/components/adapters"',
    patterns: 'import { FilterBar } from "@/components/patterns"',
  },
  principles: {
    noOverrides: '绝对禁止使用 .ant-* 覆盖或强制优先级',
    tokenDriven: '所有颜色、圆角、阴影等从设计令牌读取',
    accessibility: '完整的 A11y 支持和键盘导航',
    modular: '单文件 ≤500 行，高内聚低耦合',
  },
} as const;