// 临时调试脚本 - 直接测试层次结构构建器
// 这个文件在浏览器控制台中运行

// 模拟的UI元素数据（从debug_xml/current_ui_dump.xml提取）
const mockElements = [
  {
    id: 'element_33',
    text: '',
    element_type: 'android.widget.RelativeLayout',
    xpath: '/hierarchy/android.widget.FrameLayout[1]/android.widget.RelativeLayout[1]/android.widget.RelativeLayout[1]/android.widget.LinearLayout[1]/android.widget.RelativeLayout[1]',
    bounds: { left: 0, top: 1420, right: 720, bottom: 1570 },
    is_clickable: false,
    is_scrollable: false,
    is_enabled: true,
    is_focused: false,
    checkable: false,
    checked: false,
    selected: false,
    password: false,
    content_desc: '',
    resource_id: 'com.xingin.xhs:id/bottom_navgation',
    class_name: 'android.widget.RelativeLayout',
    package_name: 'com.xingin.xhs'
  },
  {
    id: 'element_34',
    text: '',
    element_type: 'android.widget.LinearLayout',
    xpath: '/hierarchy/android.widget.FrameLayout[1]/android.widget.RelativeLayout[1]/android.widget.RelativeLayout[1]/android.widget.LinearLayout[1]/android.widget.RelativeLayout[1]/android.widget.LinearLayout[1]',
    bounds: { left: 0, top: 1436, right: 256, bottom: 1484 },
    is_clickable: true,
    is_scrollable: false,
    is_enabled: true,
    is_focused: false,
    checkable: false,
    checked: false,
    selected: false,
    password: false,
    content_desc: '首页',
    resource_id: '',
    class_name: 'android.widget.LinearLayout',
    package_name: 'com.xingin.xhs'
  },
  {
    id: 'element_35',
    text: '',
    element_type: 'android.widget.ImageView',
    xpath: '/hierarchy/android.widget.FrameLayout[1]/android.widget.RelativeLayout[1]/android.widget.RelativeLayout[1]/android.widget.LinearLayout[1]/android.widget.RelativeLayout[1]/android.widget.LinearLayout[1]/android.widget.ImageView[1]',
    bounds: { left: 112, top: 1436, right: 144, bottom: 1468 },
    is_clickable: false,
    is_scrollable: false,
    is_enabled: true,
    is_focused: false,
    checkable: false,
    checked: false,
    selected: false,
    password: false,
    content_desc: '',
    resource_id: 'com.xingin.xhs:id/tab_icon',
    class_name: 'android.widget.ImageView',
    package_name: 'com.xingin.xhs'
  },
  {
    id: 'element_36',
    text: '首页',
    element_type: 'android.widget.TextView',
    xpath: '/hierarchy/android.widget.FrameLayout[1]/android.widget.RelativeLayout[1]/android.widget.RelativeLayout[1]/android.widget.LinearLayout[1]/android.widget.RelativeLayout[1]/android.widget.LinearLayout[1]/android.widget.TextView[1]',
    bounds: { left: 115, top: 1468, right: 141, bottom: 1484 },
    is_clickable: false,
    is_scrollable: false,
    is_enabled: true,
    is_focused: false,
    checkable: false,
    checked: false,
    selected: false,
    password: false,
    content_desc: '',
    resource_id: 'com.xingin.xhs:id/tab_text',
    class_name: 'android.widget.TextView',
    package_name: 'com.xingin.xhs'
  },
  {
    id: 'element_37',
    text: '',
    element_type: 'android.widget.LinearLayout',
    xpath: '/hierarchy/android.widget.FrameLayout[1]/android.widget.RelativeLayout[1]/android.widget.RelativeLayout[1]/android.widget.LinearLayout[1]/android.widget.RelativeLayout[1]/android.widget.LinearLayout[2]',
    bounds: { left: 256, top: 1436, right: 464, bottom: 1484 },
    is_clickable: true,
    is_scrollable: false,
    is_enabled: true,
    is_focused: false,
    checkable: false,
    checked: false,
    selected: false,
    password: false,
    content_desc: '联系人',
    resource_id: '',
    class_name: 'android.widget.LinearLayout',
    package_name: 'com.xingin.xhs'
  },
  {
    id: 'element_38',
    text: '',
    element_type: 'android.widget.ImageView',
    xpath: '/hierarchy/android.widget.FrameLayout[1]/android.widget.RelativeLayout[1]/android.widget.RelativeLayout[1]/android.widget.LinearLayout[1]/android.widget.RelativeLayout[1]/android.widget.LinearLayout[2]/android.widget.ImageView[1]',
    bounds: { left: 336, top: 1436, right: 384, bottom: 1484 },
    is_clickable: false,
    is_scrollable: false,
    is_enabled: true,
    is_focused: false,
    checkable: false,
    checked: false,
    selected: false,
    password: false,
    content_desc: '',
    resource_id: 'com.xingin.xhs:id/tab_icon',
    class_name: 'android.widget.ImageView',
    package_name: 'com.xingin.xhs'
  },
  {
    id: 'element_39',
    text: '',
    element_type: 'android.widget.LinearLayout',
    xpath: '/hierarchy/android.widget.FrameLayout[1]/android.widget.RelativeLayout[1]/android.widget.RelativeLayout[1]/android.widget.LinearLayout[1]/android.widget.RelativeLayout[1]/android.widget.LinearLayout[2]/android.widget.LinearLayout[1]',
    bounds: { left: 320, top: 1468, right: 400, bottom: 1484 },
    is_clickable: false,
    is_scrollable: false,
    is_enabled: true,
    is_focused: false,
    checkable: false,
    checked: false,
    selected: false,
    password: false,
    content_desc: '',
    resource_id: '',
    class_name: 'android.widget.LinearLayout',
    package_name: 'com.xingin.xhs'
  },
  {
    id: 'element_40',
    text: '联系人',
    element_type: 'android.widget.TextView',
    xpath: '/hierarchy/android.widget.FrameLayout[1]/android.widget.RelativeLayout[1]/android.widget.RelativeLayout[1]/android.widget.LinearLayout[1]/android.widget.RelativeLayout[1]/android.widget.LinearLayout[2]/android.widget.LinearLayout[1]/android.widget.TextView[1]',
    bounds: { left: 320, top: 1468, right: 400, bottom: 1484 },
    is_clickable: false,
    is_scrollable: false,
    is_enabled: true,
    is_focused: false,
    checkable: false,
    checked: false,
    selected: false,
    password: false,
    content_desc: '',
    resource_id: 'com.xingin.xhs:id/tab_text',
    class_name: 'android.widget.TextView',
    package_name: 'com.xingin.xhs'
  },
  {
    id: 'element_41',
    text: '',
    element_type: 'android.widget.LinearLayout',
    xpath: '/hierarchy/android.widget.FrameLayout[1]/android.widget.RelativeLayout[1]/android.widget.RelativeLayout[1]/android.widget.LinearLayout[1]/android.widget.RelativeLayout[1]/android.widget.LinearLayout[3]',
    bounds: { left: 464, top: 1436, right: 720, bottom: 1484 },
    is_clickable: true,
    is_scrollable: false,
    is_enabled: true,
    is_focused: false,
    checkable: false,
    checked: false,
    selected: false,
    password: false,
    content_desc: '我',
    resource_id: '',
    class_name: 'android.widget.LinearLayout',
    package_name: 'com.xingin.xhs'
  },
  {
    id: 'element_42',
    text: '',
    element_type: 'android.widget.ImageView',
    xpath: '/hierarchy/android.widget.FrameLayout[1]/android.widget.RelativeLayout[1]/android.widget.RelativeLayout[1]/android.widget.LinearLayout[1]/android.widget.RelativeLayout[1]/android.widget.LinearLayout[3]/android.widget.ImageView[1]',
    bounds: { left: 576, top: 1436, right: 608, bottom: 1468 },
    is_clickable: false,
    is_scrollable: false,
    is_enabled: true,
    is_focused: false,
    checkable: false,
    checked: false,
    selected: false,
    password: false,
    content_desc: '',
    resource_id: 'com.xingin.xhs:id/tab_icon',
    class_name: 'android.widget.ImageView',
    package_name: 'com.xingin.xhs'
  },
  {
    id: 'element_43',
    text: '我',
    element_type: 'android.widget.TextView',
    xpath: '/hierarchy/android.widget.FrameLayout[1]/android.widget.RelativeLayout[1]/android.widget.RelativeLayout[1]/android.widget.LinearLayout[1]/android.widget.RelativeLayout[1]/android.widget.LinearLayout[3]/android.widget.TextView[1]',
    bounds: { left: 587, top: 1468, right: 597, bottom: 1484 },
    is_clickable: false,
    is_scrollable: false,
    is_enabled: true,
    is_focused: false,
    checkable: false,
    checked: false,
    selected: false,
    password: false,
    content_desc: '',
    resource_id: 'com.xingin.xhs:id/tab_text',
    class_name: 'android.widget.TextView',
    package_name: 'com.xingin.xhs'
  }
];

// 测试目标元素（联系人按钮的容器）
const targetElement = mockElements.find(el => el.id === 'element_37');

console.log('🧪 开始测试层次结构构建器...');
console.log('📄 模拟元素数量:', mockElements.length);
console.log('🎯 目标元素:', targetElement);

// 手动执行层次结构构建逻辑的简化版本
function testBuildHierarchy() {
  console.log('\n🔄 构建层次结构...');
  
  // 按照路径深度对元素进行分组
  const elementsByDepth = {};
  
  mockElements.forEach(element => {
    const depth = element.xpath.split('/').length;
    if (!elementsByDepth[depth]) {
      elementsByDepth[depth] = [];
    }
    elementsByDepth[depth].push(element);
  });
  
  console.log('📊 按深度分组的元素:', elementsByDepth);
  
  // 找到根元素（最浅的层级）
  const minDepth = Math.min(...Object.keys(elementsByDepth).map(Number));
  const rootElements = elementsByDepth[minDepth];
  
  console.log('🌳 根元素 (深度=' + minDepth + '):', rootElements);
  
  // 构建父子关系
  const hierarchy = {};
  
  mockElements.forEach(element => {
    hierarchy[element.id] = {
      element: element,
      children: [],
      parent: null
    };
  });
  
  // 基于xpath建立父子关系
  mockElements.forEach(element => {
    const pathParts = element.xpath.split('/').filter(part => part);
    if (pathParts.length > 1) {
      // 寻找潜在的父元素
      mockElements.forEach(potentialParent => {
        if (potentialParent.id !== element.id) {
          const parentPathParts = potentialParent.xpath.split('/').filter(part => part);
          
          // 如果potentialParent的路径是当前元素路径的前缀，并且深度相差1
          if (parentPathParts.length === pathParts.length - 1) {
            let isParent = true;
            for (let i = 0; i < parentPathParts.length; i++) {
              if (parentPathParts[i] !== pathParts[i]) {
                isParent = false;
                break;
              }
            }
            
            if (isParent) {
              hierarchy[element.id].parent = potentialParent.id;
              hierarchy[potentialParent.id].children.push(element.id);
            }
          }
        }
      });
    }
  });
  
  console.log('🏗️ 构建的层次结构:', hierarchy);
  
  // 打印树结构
  function printTree(elementId, level = 0) {
    const indent = '  '.repeat(level);
    const node = hierarchy[elementId];
    const element = node.element;
    
    const label = element.text || element.content_desc || element.resource_id || element.element_type;
    const clickable = element.is_clickable ? '🖱️' : '  ';
    
    console.log(`${indent}${clickable} ${element.id}: ${label} (${element.element_type})`);
    
    node.children.forEach(childId => {
      printTree(childId, level + 1);
    });
  }
  
  console.log('\n🌲 层次树结构:');
  // 打印根节点的树
  Object.keys(hierarchy).forEach(elementId => {
    if (!hierarchy[elementId].parent) {
      printTree(elementId);
    }
  });
}

// 运行测试
testBuildHierarchy();

console.log('\n✅ 测试完成！');