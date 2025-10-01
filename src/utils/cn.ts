// 文件路径：src/utils/cn.ts

/**
 * 类名合并工具 - 基于 clsx + tailwind-merge
 * 
 * 提供 Tailwind CSS 类名的智能合并和去重
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 合并类名工具函数
 * 
 * @param inputs - 类名输入（字符串、对象、数组等）
 * @returns 合并后的类名字符串，自动处理Tailwind CSS冲突
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}