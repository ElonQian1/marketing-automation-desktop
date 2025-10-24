// src/components/universal-ui/views/visual-view/utils/categorization.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

// 元素分类与用户友好名称工具函数（从大文件抽离）

export function getUserFriendlyName(node: any): string {
  if (node['content-desc'] && node['content-desc'].trim()) return node['content-desc'];
  if (node.text && node.text.trim()) return node.text;
  const className = node.class || '';
  if (className.includes('Button')) return '按钮';
  if (className.includes('TextView')) return '文本';
  if (className.includes('ImageView')) return '图片';
  if (className.includes('EditText')) return '输入框';
  if (className.includes('RecyclerView')) return '列表';
  if (className.includes('ViewPager')) return '滑动页面';
  if (className.includes('Tab')) return '标签页';
  return '未知元素';
}

export function categorizeElement(node: any): string {
  const contentDesc = node['content-desc'] || '';
  const text = node.text || '';
  const className = node.class || '';

  if (
    contentDesc.includes('首页') || contentDesc.includes('消息') || contentDesc.includes('我') ||
    contentDesc.includes('市集') || contentDesc.includes('发布') || text.includes('首页') ||
    text.includes('消息') || text.includes('我')
  ) return 'navigation';

  if (
    contentDesc.includes('关注') || contentDesc.includes('发现') || contentDesc.includes('视频') ||
    text.includes('关注') || text.includes('发现') || text.includes('视频')
  ) return 'tabs';

  if (contentDesc.includes('搜索') || className.includes('search')) return 'search';

  // 🆕 添加菜单元素识别
  if (
    contentDesc.includes('菜单') || contentDesc.includes('menu') || contentDesc.includes('设置') ||
    contentDesc.includes('更多') || contentDesc.includes('选项') || text.includes('菜单') ||
    text.includes('设置') || text.includes('更多')
  ) return 'menu';

  if (contentDesc.includes('笔记') || contentDesc.includes('视频') || (node.clickable === 'true' && contentDesc.includes('来自'))) return 'content';

  if (className.includes('Button') || node.clickable === 'true') return 'buttons';
  if (className.includes('TextView') && text.trim()) return 'text';
  if (className.includes('ImageView')) return 'images';
  return 'others';
}
