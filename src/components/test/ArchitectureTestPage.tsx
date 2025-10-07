import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Typography, Alert, Divider } from 'antd';
import type { UIElement } from '../../api/universal-ui/types';
import { HierarchyBuilder } from '../universal-ui/element-selection/element-discovery/services/hierarchyBuilder';

const { Title, Text } = Typography;

// 模拟的UI元素数据（基于debug_xml/current_ui_dump.xml的实际结构）
const mockElements: UIElement[] = [
  // 1. 底部导航容器
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
  },

  // 6. 联系人按钮 (第二个子按钮，当前选中)
  {
    id: 'element_38',
    text: '',
    element_type: 'android.widget.LinearLayout',
    xpath: '/hierarchy/android.widget.FrameLayout[1]/android.widget.LinearLayout[1]/android.widget.FrameLayout[1]/android.widget.FrameLayout[1]/android.widget.RelativeLayout[1]/android.widget.LinearLayout[1]/android.widget.LinearLayout[2]',
    bounds: { left: 256, top: 1420, right: 464, bottom: 1484 },
    is_clickable: true,
    is_scrollable: false,
    is_enabled: true,
    is_focused: false,
    checkable: false,
    checked: false,
    selected: true, // 当前选中
    password: false,
    content_desc: '',
    resource_id: '',
    class_name: 'android.widget.LinearLayout'
  },

  // 7. 联系人图标
  {
    id: 'element_39',
    text: '',
    element_type: 'android.widget.ImageView',
    xpath: '/hierarchy/android.widget.FrameLayout[1]/android.widget.LinearLayout[1]/android.widget.FrameLayout[1]/android.widget.FrameLayout[1]/android.widget.RelativeLayout[1]/android.widget.LinearLayout[1]/android.widget.LinearLayout[2]/android.widget.ImageView[1]',
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
    resource_id: 'com.hihonor.contacts:id/top_icon',
    class_name: 'android.widget.ImageView'
  },

  // 8. 联系人文本容器
  {
    id: 'element_40',
    text: '',
    element_type: 'android.widget.LinearLayout',
    xpath: '/hierarchy/android.widget.FrameLayout[1]/android.widget.LinearLayout[1]/android.widget.FrameLayout[1]/android.widget.FrameLayout[1]/android.widget.RelativeLayout[1]/android.widget.LinearLayout[1]/android.widget.LinearLayout[2]/android.widget.LinearLayout[1]',
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

  // 9. 联系人文本
  {
    id: 'element_41',
    text: '联系人',
    element_type: 'android.widget.TextView',
    xpath: '/hierarchy/android.widget.FrameLayout[1]/android.widget.LinearLayout[1]/android.widget.FrameLayout[1]/android.widget.FrameLayout[1]/android.widget.RelativeLayout[1]/android.widget.LinearLayout[1]/android.widget.LinearLayout[2]/android.widget.LinearLayout[1]/android.widget.TextView[1]',
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
  },

  // 10. 收藏按钮 (第三个子按钮)
  {
    id: 'element_42',
    text: '',
    element_type: 'android.widget.LinearLayout',
    xpath: '/hierarchy/android.widget.FrameLayout[1]/android.widget.LinearLayout[1]/android.widget.FrameLayout[1]/android.widget.FrameLayout[1]/android.widget.RelativeLayout[1]/android.widget.LinearLayout[1]/android.widget.LinearLayout[3]',
    bounds: { left: 464, top: 1420, right: 672, bottom: 1484 },
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

  // 11. 收藏图标
  {
    id: 'element_43',
    text: '',
    element_type: 'android.widget.ImageView',
    xpath: '/hierarchy/android.widget.FrameLayout[1]/android.widget.LinearLayout[1]/android.widget.FrameLayout[1]/android.widget.FrameLayout[1]/android.widget.RelativeLayout[1]/android.widget.LinearLayout[1]/android.widget.LinearLayout[3]/android.widget.ImageView[1]',
    bounds: { left: 544, top: 1436, right: 592, bottom: 1484 },
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

  // 12. 收藏文本容器
  {
    id: 'element_44',
    text: '',
    element_type: 'android.widget.LinearLayout',
    xpath: '/hierarchy/android.widget.FrameLayout[1]/android.widget.LinearLayout[1]/android.widget.FrameLayout[1]/android.widget.FrameLayout[1]/android.widget.RelativeLayout[1]/android.widget.LinearLayout[1]/android.widget.LinearLayout[3]/android.widget.LinearLayout[1]',
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

  // 13. 收藏文本
  {
    id: 'element_45',
    text: '收藏',
    element_type: 'android.widget.TextView',
    xpath: '/hierarchy/android.widget.FrameLayout[1]/android.widget.LinearLayout[1]/android.widget.FrameLayout[1]/android.widget.FrameLayout[1]/android.widget.RelativeLayout[1]/android.widget.LinearLayout[1]/android.widget.LinearLayout[3]/android.widget.LinearLayout[1]/android.widget.TextView[1]',
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

export const ArchitectureTestPage: React.FC = () => {
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
    class_name: 'android.widget.ImageView'
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
    class_name: 'android.widget.TextView'
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
    class_name: 'android.widget.LinearLayout'
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
    class_name: 'android.widget.ImageView'
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
    class_name: 'android.widget.LinearLayout'
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
    class_name: 'android.widget.TextView'
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
    class_name: 'android.widget.LinearLayout'
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
    class_name: 'android.widget.ImageView'
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
    class_name: 'android.widget.TextView'
  }
];

export const ArchitectureTestPage: React.FC = () => {
  const [testOutput, setTestOutput] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // 测试目标元素（底部导航容器）
  const targetElement = mockElements.find(el => el.id === 'element_32')!; // 使用底部导航容器作为目标

  const runArchitectureTest = async () => {
    setIsLoading(true);
    setTestOutput('');

    try {
      console.log('🧪 开始测试层次结构构建器...');
      console.log('📄 模拟元素数量:', mockElements.length);
      console.log('🎯 目标元素:', targetElement);

      // 输出所有元素的 XPath 和层级信息用于调试
      console.log('📋 所有元素的XPath信息:');
      mockElements.forEach(el => {
        const depth = (el.xpath?.split('/') || []).length;
        console.log(`  ${el.id}: depth=${depth}, xpath=${el.xpath}`);
        console.log(`    -> ${el.element_type}, resource_id=${el.resource_id}`);
      });

      // 构建层次结构
      const hierarchyTree = HierarchyBuilder.buildHierarchyTree(mockElements, targetElement);
      
      console.log('🏗️ 构建的层次结构:', hierarchyTree);
      
      // 使用调试方法打印树结构
      let treeStructureOutput = '';
      if (hierarchyTree.length > 0) {
        // 捕获console输出用于显示
        const originalLog = console.log;
        const logOutput: string[] = [];
        console.log = (message: string) => {
          logOutput.push(message);
          originalLog(message); // 同时输出到实际控制台
        };
        
        // 打印每个根节点的树结构
        hierarchyTree.forEach(rootNode => {
          HierarchyBuilder.printTreeStructure(rootNode, 0);
        });
        
        // 恢复console.log
        console.log = originalLog;
        treeStructureOutput = logOutput.join('\\n');
      }
      
      // 获取统计信息
      const statistics = HierarchyBuilder.getTreeStatistics(hierarchyTree);
      
      console.log('📊 统计信息:', statistics);
      
      // 详细分析根节点
      if (hierarchyTree.length > 0) {
        const root = hierarchyTree[0];
        console.log('🔍 根节点详细分析:');
        console.log(`  - ID: ${root.id}`);
        console.log(`  - Type: ${root.element.element_type}`);
        console.log(`  - Resource ID: ${root.element.resource_id}`);
        console.log(`  - Children: ${root.children.length}`);
        
        root.children.forEach((child, index) => {
          console.log(`  子节点${index + 1}: ${child.id}(${child.element.element_type})`);
          if (child.children.length > 0) {
            child.children.forEach((grandchild, gIndex) => {
              console.log(`    孙节点${gIndex + 1}: ${grandchild.id}(${grandchild.element.element_type}) "${grandchild.element.text}"`);
            });
          }
        });
      }
      
      // 设置输出到页面
      let output = '';
      output += `🧪 架构层次结构测试结果\\n\\n`;
      output += `📄 元素数量: ${mockElements.length}\\n`;
      output += `🎯 目标元素: ${targetElement.id} (${targetElement.element_type})\\n`;
      output += `🌳 构建的树根节点数: ${hierarchyTree.length}\\n\\n`;
      
      if (hierarchyTree.length > 0) {
        const root = hierarchyTree[0];
        output += `🏠 根节点: ${root.id} (${root.element.element_type})\\n`;
        output += `📁 Resource ID: ${root.element.resource_id}\\n`;
        output += `👥 直接子节点数: ${root.children.length}\\n\\n`;
        
        if (root.children.length > 0) {
          output += `🌿 子节点详情:\\n`;
          root.children.forEach((child, index) => {
            output += `${index + 1}. ${child.id} (${child.element.element_type})\\n`;
            output += `   Resource ID: ${child.element.resource_id}\\n`;
            output += `   子节点数: ${child.children.length}\\n`;
            if (child.children.length > 0) {
              child.children.forEach((grandchild, gIndex) => {
                output += `   └─ ${grandchild.id} (${grandchild.element.element_type}) "${grandchild.element.text}"\\n`;
              });
            }
            output += '\\n';
          });
        }
      }
      
      output += `📊 统计信息:\\n`;
      output += `- 总节点数: ${statistics.totalNodes}\\n`;
      output += `- 最大深度: ${statistics.maxDepth}\\n`;
      output += `- 可点击节点: ${statistics.clickableNodes}\\n`;
      output += `- 文本节点: ${statistics.textNodes}\\n\\n`;
      
      output += `🌲 树结构(控制台输出):\\n`;
      output += treeStructureOutput;
      
      setTestOutput(output);
      
      console.log('✅ 测试完成！');
      
    } catch (error) {
      console.error('❌ 测试失败:', error);
      setTestOutput(`❌ 测试失败: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 页面加载时自动运行测试
    runArchitectureTest();
  }, []);

  return (
    <div className="light-theme-force" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>🧪 架构层次结构测试页面</Title>
      
      <Alert
        message="测试目的"
        description="测试 HierarchyBuilder.buildHierarchyTree() 方法是否正确解析XML层次结构。预期应该显示底部导航容器及其子元素的完整层次树，而不是单个扁平节点。"
        type="info"
        style={{ marginBottom: '24px' }}
      />

      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 测试数据展示 */}
        <Card title="📊 测试数据" size="small" className="light-theme-force">
          <Space direction="vertical">
            <Text><strong>模拟元素数量:</strong> {mockElements.length}</Text>
            <Text><strong>目标元素:</strong> {targetElement.id} ({targetElement.element_type})</Text>
            <Text><strong>预期层次结构:</strong></Text>
            <div style={{ marginLeft: '16px', fontFamily: 'monospace', fontSize: '12px' }}>
              <div>📦 element_32 (bottom_navigation 容器)</div>
              <div>├── 🖱️ element_34 (电话按钮)</div>
              <div>│   ├── 📷 element_35 (电话图标)</div>
              <div>│   └── � element_36 (文本容器)</div>
              <div>│       └── 📝 element_37 (电话文本)</div>
              <div>├── 🖱️ element_38 (联系人按钮) ⭐ 选中</div>
              <div>│   ├── 📷 element_39 (联系人图标)</div>
              <div>│   └── 📦 element_40 (文本容器)</div>
              <div>│       └── 📝 element_41 (联系人文本)</div>
              <div>└── 🖱️ element_42 (收藏按钮)</div>
              <div>    ├── 📷 element_43 (收藏图标)</div>
              <div>    └── 📦 element_44 (文本容器)</div>
              <div>        └── 📝 element_45 (收藏文本)</div>
            </div>
          </Space>
        </Card>

        {/* 测试控制 */}
        <Card title="🧪 测试控制" size="small" className="light-theme-force">
          <Space>
            <Button 
              type="primary" 
              onClick={runArchitectureTest}
              loading={isLoading}
            >
              {isLoading ? '测试中...' : '重新运行测试'}
            </Button>
            <Button 
              onClick={() => console.clear()}
            >
              清空控制台
            </Button>
          </Space>
        </Card>

        {/* 测试结果 */}
        <Card 
          title="📋 测试结果" 
          size="small" 
          className="light-theme-force"
          extra={
            <Button 
              size="small"
              onClick={() => {
                console.log('🔍 详细查看控制台输出获取完整调试信息');
              }}
            >
              查看控制台
            </Button>
          }
        >
          {testOutput ? (
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              backgroundColor: 'var(--bg-elevated)', 
              padding: '16px', 
              borderRadius: '4px',
              fontSize: '12px',
              color: 'var(--text-1)',
              maxHeight: '400px',
              overflow: 'auto'
            }}>
              {testOutput}
            </pre>
          ) : (
            <Text>点击"运行测试"查看结果</Text>
          )}
        </Card>

        <Divider />
        
        <Alert
          message="重要调试信息"
          description={
            <div>
              <p>• 请打开浏览器开发者工具的控制台查看详细的调试输出</p>
              <p>• 查看 buildHierarchyTree() 方法中的调试日志，了解层次结构构建过程</p>
              <p>• 如果树结构显示有问题，检查 xpath 解析和父子关系建立逻辑</p>
            </div>
          }
          type="warning"
        />
      </Space>
    </div>
  );
};

export default ArchitectureTestPage;