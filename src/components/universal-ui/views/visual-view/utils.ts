/**
 * 可视化视图工具函数
 */

import { VisualUIElement, VisualElementCategory } from '../../types';
import { UIElement } from '../../../../api/universalUIAPI';

/**
 * 转换UIElement到VisualUIElement
 */
export const convertUIElementToVisual = (element: UIElement): VisualUIElement => {
  return {
    id: element.id,
    text: element.text || '',
    // 从 UIElement 回到 Visual 仅用于展示，描述取真实 content_desc；
    // 注意：反向转换（Visual -> UI）时不要再把友好描述写回 content_desc
    description: element.content_desc || '',
    type: element.element_type || element.class_name || '',
    category: categorizeElement(element),
    position: {
      x: element.bounds.left,
      y: element.bounds.top,
      width: element.bounds.right - element.bounds.left,
      height: element.bounds.bottom - element.bounds.top
    },
    clickable: element.is_clickable || false,
    importance: getElementImportance(element),
    userFriendlyName: getUserFriendlyName(element),
    scrollable: element.is_scrollable || false,
    enabled: element.is_enabled !== false,
    selected: element.selected || false,
    focused: false, // UIElement类型中没有focused属性，默认为false
    element_type: element.element_type,
    is_clickable: element.is_clickable,
    content_desc: element.content_desc
  };
};

/**
 * 转换VisualUIElement到UIElement
 */
export const convertVisualToUIElement = (element: VisualUIElement): UIElement => {
  return {
    id: element.id,
    text: element.text,
    // 严格保持 content_desc 的“设备XML真实值”语义：
    // VisualUIElement.description 可能是“未知元素（可点击）”等友好占位，不能回填到 content_desc。
    // 这里统一置空，由上游在有真实 content-desc 时再赋值。
    content_desc: '',
    element_type: element.type,
    bounds: {
      left: element.position.x,
      top: element.position.y,
      right: element.position.x + element.position.width,
      bottom: element.position.y + element.position.height
    },
    is_clickable: element.clickable,
    is_scrollable: element.scrollable || false,
    is_enabled: element.enabled !== false,
    is_focused: element.focused || false,
    resource_id: '',
    class_name: element.type || '',
    xpath: '',
    parentId: null,
    checkable: false,
    checked: false,
    focusable: element.focused || false,
    selected: element.selected || false,
    password: false, // 添加缺少的password属性
    children: [], // 🎯 添加必需的children字段
  } as UIElement;
};

/**
 * 获取元素的用户友好名称
 */
export const getUserFriendlyName = (element: UIElement | any): string => {
  if (element.content_desc && element.content_desc.trim()) {
    return element.content_desc;
  }
  if (element.text && element.text.trim()) {
    return element.text;
  }
  
  const className = element.class_name || element.element_type || '';
  if (className.includes('Button')) return '按钮';
  if (className.includes('TextView')) return '文本';
  if (className.includes('ImageView')) return '图片';
  if (className.includes('EditText')) return '输入框';
  if (className.includes('RecyclerView')) return '列表';
  if (className.includes('ViewPager')) return '滑动页面';
  if (className.includes('Tab')) return '标签页';
  
  return '未知元素';
};

/**
 * 判断元素类别
 */
export const categorizeElement = (element: UIElement | any): string => {
  const contentDesc = element.content_desc || '';
  const text = element.text || '';
  const className = element.class_name || element.element_type || '';
  
  if (contentDesc.includes('首页') || contentDesc.includes('消息') || contentDesc.includes('我') || 
      contentDesc.includes('市集') || contentDesc.includes('发布') || 
      text.includes('首页') || text.includes('消息') || text.includes('我')) {
    return 'navigation';
  }
  
  if (contentDesc.includes('关注') || contentDesc.includes('发现') || contentDesc.includes('视频') || 
      text.includes('关注') || text.includes('发现') || text.includes('视频')) {
    return 'tabs';
  }
  
  if (contentDesc.includes('搜索') || className.includes('search')) {
    return 'search';
  }
  
  if (contentDesc.includes('笔记') || contentDesc.includes('视频') || 
      (element.is_clickable && contentDesc.includes('来自'))) {
    return 'content';
  }
  
  if (className.includes('Button') || element.is_clickable) {
    return 'buttons';
  }
  
  if (className.includes('TextView') && text.trim()) {
    return 'text';
  }
  
  if (className.includes('ImageView')) {
    return 'images';
  }
  
  return 'others';
};

/**
 * 获取元素重要性
 */
export const getElementImportance = (element: UIElement | any): 'high' | 'medium' | 'low' => {
  const contentDesc = element.content_desc || '';
  const text = element.text || '';
  
  if (contentDesc.includes('首页') || contentDesc.includes('搜索') || 
      contentDesc.includes('笔记') || contentDesc.includes('视频') ||
      contentDesc.includes('发布') || contentDesc.includes('消息')) {
    return 'high';
  }
  
  if (element.is_clickable || contentDesc.includes('按钮') || 
      text.includes('确定') || text.includes('取消') || text.includes('保存')) {
    return 'medium';
  }
  
  return 'low';
};

/**
 * 创建默认元素分类
 */
export const createDefaultCategories = (elements: VisualUIElement[]): VisualElementCategory[] => {
  const categoryMap: Record<string, VisualElementCategory> = {
    navigation: { name: '导航功能', icon: '🧭', color: '#1890ff', description: '主要导航和菜单', elements: [] },
    tabs: { name: '标签页', icon: '📑', color: '#722ed1', description: '页面标签和切换', elements: [] },
    search: { name: '搜索功能', icon: '🔍', color: '#13c2c2', description: '搜索相关功能', elements: [] },
    content: { name: '内容卡片', icon: '📄', color: '#52c41a', description: '主要内容区域', elements: [] },
    buttons: { name: '按钮控件', icon: '🔘', color: '#fa8c16', description: '可点击的按钮', elements: [] },
    text: { name: '文本内容', icon: '📝', color: '#eb2f96', description: '文本信息显示', elements: [] },
    images: { name: '图片内容', icon: '🖼️', color: '#f5222d', description: '图片和图标', elements: [] },
    others: { name: '其他元素', icon: '📦', color: '#8c8c8c', description: '其他UI元素', elements: [] }
  };

  // 将元素分配到对应分类
  elements.forEach(element => {
    const category = categoryMap[element.category];
    if (category) {
      category.elements.push(element);
    }
  });

  return Object.values(categoryMap);
};

/**
 * 计算元素统计信息
 */
export const calculateElementStatistics = (elements: VisualUIElement[]) => {
  const total = elements.length;
  const interactive = elements.filter(e => e.clickable).length;
  const types = new Set(elements.map(e => e.type)).size;
  
  const grouped = elements.reduce((acc, element) => {
    if (!acc[element.type]) {
      acc[element.type] = [];
    }
    acc[element.type].push(element);
    return acc;
  }, {} as Record<string, VisualUIElement[]>);

  return {
    total,
    interactive,
    types,
    grouped
  };
};