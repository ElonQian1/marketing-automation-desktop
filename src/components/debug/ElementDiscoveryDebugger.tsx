/**
 * 元素发现功能调试和修复脚本
 * 
 * 问题分析：
 * 1. element_37 是真正的按钮容器（可点击）
 * 2. element_38 是图标（不可点击子元素）
 * 3. element_40 是"联系人"文本（隐藏子元素，bounds=[0,0][0,0]）
 * 
 * 修复方案：
 * 1. 确保点击映射到正确的父容器元素
 * 2. 增强隐藏元素检测逻辑
 * 3. 验证层级关系分析
 */

import React, { useEffect, useState } from 'react';
import { Button, Card, Typography, Space, Alert } from 'antd';

const { Title, Text, Paragraph } = Typography;

interface DebugElementInfo {
  id: string;
  text: string;
  className: string;
  bounds: string;
  clickable: boolean;
  children: DebugElementInfo[];
}

export const ElementDiscoveryDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<{
    contactElements: DebugElementInfo[];
    navigationButtons: DebugElementInfo[];
    hierarchyAnalysis: any[];
  } | null>(null);

  useEffect(() => {
    // 模拟调试XML中的元素关系
    const mockXMLStructure = {
      contactElements: [
        {
          id: 'element_40',
          text: '联系人',
          className: 'android.widget.TextView',
          bounds: '[0,0][0,0]',
          clickable: false,
          children: []
        }
      ],
      navigationButtons: [
        {
          id: 'element_37',
          text: '',
          className: 'android.widget.LinearLayout', 
          bounds: '[256,1420][464,1484]',
          clickable: true,
          children: [
            {
              id: 'element_38',
              text: '',
              className: 'android.widget.ImageView',
              bounds: '[336,1436][384,1484]', 
              clickable: false,
              children: []
            },
            {
              id: 'element_40',
              text: '联系人',
              className: 'android.widget.TextView',
              bounds: '[0,0][0,0]',
              clickable: false,
              children: []
            }
          ]
        }
      ],
      hierarchyAnalysis: [
        {
          issue: '用户可能点击了 element_38（图标）而不是 element_37（按钮容器）',
          impact: '导致子元素发现无法找到 element_40（联系人文本）',
          solution: '确保元素选择映射到正确的父容器'
        },
        {
          issue: 'element_40 是隐藏元素 bounds=[0,0][0,0]',
          impact: '可能被发现逻辑过滤掉',
          solution: '增强隐藏元素检测和显示逻辑'
        }
      ]
    };

    setDebugInfo(mockXMLStructure);
  }, []);

  const testElementDiscovery = () => {
    console.log('🧪 测试元素发现功能...');
    
    // 模拟正确的发现流程
    console.log('1. 用户应该点击 element_37（按钮容器）');
    console.log('2. 发现功能应该分析 element_37 的子元素');
    console.log('3. 应该找到 element_38（图标）和 element_40（联系人文本）');
    console.log('4. element_40 应该标记为隐藏元素但仍然显示');
    
    // 提供修复建议
    console.log('\n🔧 修复建议:');
    console.log('- 检查前端点击处理逻辑，确保映射到父容器');
    console.log('- 验证 useElementDiscovery.ts 中的隐藏元素检测');
    console.log('- 确认使用正确版本的 ElementSelectionPopover');
  };

  const simulateCorrectClick = () => {
    console.log('🎯 模拟正确的点击流程:');
    console.log('点击目标: element_37 (导航按钮容器)');
    console.log('预期子元素发现结果:');
    console.log('  1. element_38 - ImageView 图标');
    console.log('  2. element_40 - TextView "联系人" (隐藏元素)');
    
    // 这里可以集成实际的发现逻辑进行测试
  };

  if (!debugInfo) {
    return <div>加载调试信息...</div>;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>🔍 元素发现功能调试器</Title>
      
      <Alert
        message="发现问题分析"
        description="元素发现模态框的子元素 tab 页面没有显示 '联系人' 文本元素，但能看到 icon 元素。可能原因：点击映射错误或层级关系分析问题。"
        type="warning"
        style={{ marginBottom: '24px' }}
      />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 包含"联系人"的元素 */}
        <Card title="📱 包含'联系人'的元素" size="small">
          {debugInfo.contactElements.map((element, index) => (
            <Card key={element.id} type="inner" title={element.id} size="small">
              <p><strong>文本:</strong> "{element.text}"</p>
              <p><strong>类型:</strong> {element.className}</p>
              <p><strong>位置:</strong> {element.bounds}</p>
              <p><strong>可点击:</strong> {element.clickable ? '是' : '否'}</p>
              {element.bounds === '[0,0][0,0]' && (
                <Alert message="隐藏元素 - bounds=[0,0][0,0]" type="info" />
              )}
            </Card>
          ))}
        </Card>

        {/* 导航按钮分析 */}
        <Card title="🧭 导航按钮层级分析" size="small">
          {debugInfo.navigationButtons.map((button, index) => (
            <Card key={button.id} type="inner" title={`${button.id} (导航按钮容器)`} size="small">
              <p><strong>类型:</strong> {button.className}</p>
              <p><strong>位置:</strong> {button.bounds}</p>
              <p><strong>可点击:</strong> {button.clickable ? '是' : '否'}</p>
              <p><strong>子元素数量:</strong> {button.children.length}</p>
              
              {button.children.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <Text strong>子元素列表:</Text>
                  {button.children.map((child, childIndex) => (
                    <div key={child.id} style={{ marginLeft: '16px', marginTop: '8px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                      <p><strong>{child.id}</strong></p>
                      <p>文本: "{child.text || '无'}"</p>
                      <p>类型: {child.className}</p>
                      <p>位置: {child.bounds}</p>
                      {child.bounds === '[0,0][0,0]' && (
                        <Alert message="🔍 隐藏元素 - 应该被发现功能检测到" type="success" />
                      )}
                      {child.text.includes('联系人') && (
                        <Alert message="🎉 这就是缺失的'联系人'文本元素!" type="success" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </Card>

        {/* 层级分析问题 */}
        <Card title="🔗 层级分析问题" size="small">
          {debugInfo.hierarchyAnalysis.map((analysis, index) => (
            <Card key={index} type="inner" size="small" style={{ marginBottom: '8px' }}>
              <p><strong>问题:</strong> {analysis.issue}</p>
              <p><strong>影响:</strong> {analysis.impact}</p>
              <p><strong>解决方案:</strong> {analysis.solution}</p>
            </Card>
          ))}
        </Card>

        {/* 测试按钮 */}
        <Card title="🧪 调试测试" size="small">
          <Space>
            <Button type="primary" onClick={testElementDiscovery}>
              测试发现功能
            </Button>
            <Button onClick={simulateCorrectClick}>
              模拟正确点击
            </Button>
          </Space>
        </Card>

        {/* 修复建议 */}
        <Card title="🔧 修复建议" size="small">
          <ol>
            <li><strong>检查元素ID映射:</strong> 确保前端元素ID映射与XML结构一致</li>
            <li><strong>验证点击目标:</strong> 用户应该点击 element_37（按钮容器）而不是 element_38（图标）</li>
            <li><strong>增强隐藏元素检测:</strong> 确保 bounds=[0,0][0,0] 的元素仍能被发现并显示</li>
            <li><strong>检查代码版本:</strong> 确认使用的是正确版本的 ElementSelectionPopover 和 useElementDiscovery</li>
            <li><strong>调试层级分析:</strong> 验证 ElementHierarchyAnalyzer 的父子关系识别逻辑</li>
          </ol>
        </Card>
      </Space>
    </div>
  );
};

export default ElementDiscoveryDebugger;