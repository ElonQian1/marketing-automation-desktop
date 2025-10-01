// 文件路径：src/components/ui/dropdown/DropdownMenu.tsx

/**
 * Dropdown 组件 - 基于 Radix DropdownMenu 的品牌化实现
 *
 * 特性：
 * - 统一设计令牌：背景、边框、阴影、圆角均来自 tokens.css
 * - 统一动效：使用 motionPresets 中的 pop 与 overlay 变体（入 200ms / 出 140ms）
 * - 完整 A11y：键盘导航、焦点环、屏幕阅读器提示
 * - 支持 Item / CheckboxItem / RadioGroup / SubMenu / 分隔线 / 快捷键提示
 */

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { motion } from "framer-motion";
import { Check, ChevronRight, Circle } from "lucide-react";

import { cn, focusRing, fastTransition } from "../utils";
import { motionPresets } from "../motion";

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const dropdownContentBase = cn(
  "min-w-[12rem] overflow-hidden rounded-[var(--radius-md)] border border-border-primary",
  "bg-background-elevated/98 text-text-primary shadow-lg backdrop-blur-[var(--backdrop-blur-sm,8px)]",
  "p-1"
);

const dropdownItemBase = cn(
  "relative flex cursor-pointer select-none items-center justify-between gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-sm",
  "text-text-secondary",
  "data-[highlighted]:bg-background-secondary data-[highlighted]:text-text-primary",
  "data-[state=open]:bg-background-secondary",
  "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
);

type DropdownMenuItemProps = React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean;
};

type DropdownMenuLabelProps = React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean;
};

type DropdownMenuSubTriggerProps = React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean;
};

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 8, alignOffset = -4, children, ...props }, ref) => (
  <DropdownMenuPortal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      alignOffset={alignOffset}
      className={cn("z-dropdown", className)}
      asChild
      {...props}
    >
      <motion.div
        className={cn(dropdownContentBase)}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={motionPresets.variants.pop}
      >
        {children}
      </motion.div>
    </DropdownMenuPrimitive.Content>
  </DropdownMenuPortal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, sideOffset = 6, alignOffset = -4, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    sideOffset={sideOffset}
    alignOffset={alignOffset}
    className={cn("z-dropdown", className)}
    asChild
    {...props}
  >
    <motion.div
      className={cn(dropdownContentBase)}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={motionPresets.variants.pop}
    >
      {children}
    </motion.div>
  </DropdownMenuPrimitive.SubContent>
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

const DropdownMenuArrow = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Arrow>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Arrow>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Arrow
    ref={ref}
    className={cn(
      "fill-[color:var(--bg-elevated)]",
      "drop-shadow-md",
      className
    )}
    {...props}
  />
));
DropdownMenuArrow.displayName = "DropdownMenuArrow";

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  DropdownMenuItemProps
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      dropdownItemBase,
      focusRing,
      fastTransition,
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
  </DropdownMenuPrimitive.Item>
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(dropdownItemBase, focusRing, fastTransition, className)}
    checked={checked}
    {...props}
  >
    <span className="absolute left-3 flex h-4 w-4 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(dropdownItemBase, focusRing, fastTransition, className)}
    {...props}
  >
    <span className="absolute left-3 flex h-4 w-4 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-3 w-3 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  DropdownMenuLabelProps
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-3 py-2 text-xs font-medium uppercase tracking-wide text-text-muted",
      inset && "pl-8",
      className
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border-muted", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({
  className,
  children,
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      "ml-auto text-[11px] uppercase tracking-widest text-text-muted",
      className
    )}
  >
    {children}
  </span>
);
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  DropdownMenuSubTriggerProps
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      dropdownItemBase,
      focusRing,
      fastTransition,
      "data-[state=open]:text-text-primary",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-2 h-4 w-4 opacity-60" />
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

const DropdownMenuSubContentWithArrow = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent> & {
    showArrow?: boolean;
  }
>(({ className, children, showArrow = false, ...props }, ref) => (
  <DropdownMenuSubContent ref={ref} className={className} {...props}>
    {children}
    {showArrow ? <DropdownMenuArrow /> : null}
  </DropdownMenuSubContent>
));
DropdownMenuSubContentWithArrow.displayName = "DropdownMenuSubContent";

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
};
