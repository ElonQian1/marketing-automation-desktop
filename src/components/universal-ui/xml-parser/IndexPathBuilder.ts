// src/components/universal-ui/xml-parser/IndexPathBuilder.ts
// module: ui | layer: utils | role: utility
// summary: 工具函数 - 构建XML元素的绝对下标链

/**
 * IndexPath 构建器
 * 用于生成元素在XML树中的绝对路径（下标链）
 * 
 * 核心思路：
 * 1. 从目标元素开始向上遍历到根节点
 * 2. 记录每一层在父节点的children中的索引位置
 * 3. 反转得到从根到叶的下标链
 * 
 * 示例：
 * - XML树：root -> child[0] -> child[5] -> child[2] (目标)
 * - indexPath: [0, 5, 2]
 */

/**
 * 从DOM Element构建绝对下标链
 * @param element DOM Element节点
 * @returns 下标链数组，例如 [0, 0, 0, 5, 2]
 */
export function buildIndexPath(element: Element): number[] {
  const path: number[] = [];
  let current: Element | null = element;

  // 向上遍历到根节点
  while (current && current.parentElement) {
    const parent = current.parentElement;
    
    // 计算当前节点在父节点children中的索引
    const siblings = Array.from(parent.children);
    const indexInParent = siblings.indexOf(current);
    
    if (indexInParent >= 0) {
      path.unshift(indexInParent); // 插入到前面（因为是向上遍历）
    }
    
    current = parent;
  }

  return path;
}

/**
 * 从下标链定位到DOM元素
 * @param xmlDoc XML文档
 * @param indexPath 下标链
 * @returns 找到的Element或null
 */
export function findElementByIndexPath(
  xmlDoc: Document,
  indexPath: number[]
): Element | null {
  if (!indexPath || indexPath.length === 0) {
    return null;
  }

  let current: Element | null = xmlDoc.documentElement;
  
  // 从根节点开始，按下标链逐层深入
  for (const index of indexPath) {
    if (!current || !current.children || index >= current.children.length) {
      return null; // 路径无效
    }
    current = current.children[index];
  }

  return current;
}

/**
 * 验证下标链是否有效
 * @param xmlDoc XML文档
 * @param indexPath 下标链
 * @returns 是否有效
 */
export function validateIndexPath(
  xmlDoc: Document,
  indexPath: number[]
): boolean {
  const element = findElementByIndexPath(xmlDoc, indexPath);
  return element !== null;
}

/**
 * 将下标链转换为字符串格式（用于显示或存储）
 * @param indexPath 下标链
 * @returns 字符串格式，例如 "0/0/0/5/2"
 */
export function indexPathToString(indexPath: number[]): string {
  return indexPath.join('/');
}

/**
 * 从字符串格式解析下标链
 * @param pathString 字符串格式，例如 "0/0/0/5/2"
 * @returns 下标链数组
 */
export function indexPathFromString(pathString: string): number[] {
  if (!pathString || pathString.trim() === '') {
    return [];
  }
  return pathString.split('/').map(s => parseInt(s, 10)).filter(n => !isNaN(n));
}

/**
 * 比较两个下标链是否相同
 * @param path1 下标链1
 * @param path2 下标链2
 * @returns 是否相同
 */
export function areIndexPathsEqual(path1: number[], path2: number[]): boolean {
  if (path1.length !== path2.length) {
    return false;
  }
  return path1.every((val, idx) => val === path2[idx]);
}
