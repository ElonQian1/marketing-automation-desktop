// 快速测试脚本：验证层次结构构建逻辑

import type { UIElement } from '../api/universal-ui/types';
import { HierarchyBuilder } from '../components/universal-ui/element-selection/element-discovery/services/hierarchyBuilder';

// 基于实际XML的测试数据
const testElements: UIElement[] = [
  // 1. 底部导航容器 (根节点)
  {
    id: 'element_32',
    text: '',
    element_type: 'android.widget.LinearLayout',
    xpath: '/hierarchy/android.widget.FrameLayout[1]/android.widget.LinearLayout[1]/android.widget.FrameLayout[1]/android.widget.FrameLayout[1]/android.widget.RelativeLayout[1]/android.widget.LinearLayout[1]',
    bounds: { left: 0, top: 1420, right: 720, bottom: 1484 },
    is_clickable: false,
    is_scrollable: false,
    is_enabled: true,
    is_focused: false,
    checkable: false,
    checked: false,
    selected: false,
    password: false,
    content_desc: '',
    resource_id: 'com.hihonor.contacts:id/bottom_navgation',
    class_name: 'android.widget.LinearLayout'
  },
  
  // 2. 电话按钮 (第一个子按钮)
  {
    id: 'element_34',
    text: '',
    element_type: 'android.widget.LinearLayout',
    xpath: '/hierarchy/android.widget.FrameLayout[1]/android.widget.LinearLayout[1]/android.widget.FrameLayout[1]/android.widget.FrameLayout[1]/android.widget.RelativeLayout[1]/android.widget.LinearLayout[1]/android.widget.LinearLayout[1]',
    bounds: { left: 48, top: 1420, right: 256, bottom: 1484 },
    is_clickable: true,
    is_scrollable: false,
    is_enabled: true,
    is_focused: false,
    checkable: false,
    checked: false,
    selected: false,
    password: false,
    content_desc: '',
    resource_id: '',
    class_name: 'android.widget.LinearLayout'
  },

  // 3. 电话图标
  {
    id: 'element_35',
    text: '',
    element_type: 'android.widget.ImageView',
    xpath: '/hierarchy/android.widget.FrameLayout[1]/android.widget.LinearLayout[1]/android.widget.FrameLayout[1]/android.widget.FrameLayout[1]/android.widget.RelativeLayout[1]/android.widget.LinearLayout[1]/android.widget.LinearLayout[1]/android.widget.ImageView[1]',
    bounds: { left: 128, top: 1436, right: 176, bottom: 1484 },
    is_clickable: false,
    is_scrollable: false,
    is_enabled: true,
    is_focused: false,
    checkable: false,
    checked: false,
    selected: false,
    password: false,
    content_desc: '',
    resource_id: 'com.hihonor.contacts:id/top_icon',
    class_name: 'android.widget.ImageView'
  },

  // 4. 电话文本容器
  {
    id: 'element_36',
    text: '',
    element_type: 'android.widget.LinearLayout',
    xpath: '/hierarchy/android.widget.FrameLayout[1]/android.widget.LinearLayout[1]/android.widget.FrameLayout[1]/android.widget.FrameLayout[1]/android.widget.RelativeLayout[1]/android.widget.LinearLayout[1]/android.widget.LinearLayout[1]/android.widget.LinearLayout[1]',
    bounds: { left: 0, top: 0, right: 0, bottom: 0 },
    is_clickable: false,
    is_scrollable: false,
    is_enabled: true,
    is_focused: false,
    checkable: false,
    checked: false,
    selected: false,
    password: false,
    content_desc: '',
    resource_id: 'com.hihonor.contacts:id/container',
    class_name: 'android.widget.LinearLayout'
  },

  // 5. 电话文本
  {
    id: 'element_37',
    text: '电话',
    element_type: 'android.widget.TextView',
    xpath: '/hierarchy/android.widget.FrameLayout[1]/android.widget.LinearLayout[1]/android.widget.FrameLayout[1]/android.widget.FrameLayout[1]/android.widget.RelativeLayout[1]/android.widget.LinearLayout[1]/android.widget.LinearLayout[1]/android.widget.LinearLayout[1]/android.widget.TextView[1]',
    bounds: { left: 0, top: 0, right: 0, bottom: 0 },
    is_clickable: false,
    is_scrollable: false,
    is_enabled: true,
    is_focused: false,
    checkable: false,
    checked: false,
    selected: false,
    password: false,
    content_desc: '',
    resource_id: 'com.hihonor.contacts:id/content',
    class_name: 'android.widget.TextView'
  }
];

// 测试函数
export function testHierarchyBuilding() {
  console.log('🧪 开始测试层次结构构建...');
  
  const targetElement = testElements[0]; // 底部导航容器
  console.log('🎯 目标元素:', targetElement.id, targetElement.element_type);
  
  try {
    const hierarchyTree = HierarchyBuilder.buildHierarchyTree(testElements, targetElement);
    
    console.log('✅ 层次结构构建完成');
    console.log('🌳 根节点数量:', hierarchyTree.length);
    
    if (hierarchyTree.length > 0) {
      console.log('🏠 根节点详情:', hierarchyTree[0].id, hierarchyTree[0].element.element_type);
      console.log('👥 子节点数量:', hierarchyTree[0].children.length);
      
      hierarchyTree[0].children.forEach((child, index) => {
        console.log(`  └─ 子节点${index + 1}: ${child.id}(${child.element.element_type})`);
        child.children.forEach((grandchild, gIndex) => {
          console.log(`    └─ 孙节点${gIndex + 1}: ${grandchild.id}(${grandchild.element.element_type})`);
        });
      });
    }
    
    return hierarchyTree;
  } catch (error) {
    console.error('❌ 测试失败:', error);
    return [];
  }
}

// 如果直接运行此文件，执行测试
if (typeof window !== 'undefined') {
  // 在浏览器环境中，将测试函数添加到全局对象
  (window as any).testHierarchyBuilding = testHierarchyBuilding;
}