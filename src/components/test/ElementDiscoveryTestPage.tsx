import React, { useState } from 'react';
import { Button, Card, Space, Typography, Alert } from 'antd';
import { useElementDiscovery } from '../universal-ui/element-selection/element-discovery';
import type { UIElement } from '../../api/universalUIAPI';

const { Title, Text } = Typography;

// 模拟XML解析的测试数据（基于你的实际XML结构）
const mockElements: UIElement[] = [
  // element_37 - 导航按钮容器（可点击）
  {
    id: 'element_37',
    text: '',
    element_type: 'android.widget.LinearLayout',
    xpath: '',
    bounds: { left: 256, top: 1420, right: 464, bottom: 1484 },
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
    class_name: 'android.widget.LinearLayout',
    package_name: 'com.xingin.xhs'
  },
  // element_38 - 图标子元素（不可点击）
  {
    id: 'element_38',
    text: '',
    element_type: 'android.widget.ImageView',
    xpath: '',
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
    resource_id: '',
    class_name: 'android.widget.ImageView',
    package_name: 'com.xingin.xhs'
  },
  // element_40 - "联系人"文本子元素（隐藏）
  {
    id: 'element_40',
    text: '联系人',
    element_type: 'android.widget.TextView',
    xpath: '',
    bounds: { left: 0, top: 0, right: 0, bottom: 0 }, // 隐藏元素
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
    class_name: 'android.widget.TextView',
    package_name: 'com.xingin.xhs'
  }
];

export const ElementDiscoveryTestPage: React.FC = () => {
  const [testResults, setTestResults] = useState<{
    scenario: string;
    targetElement: UIElement;
    discoveryResult: any;
  }[]>([]);

  const { discoveryResult, discoverElements, isAnalyzing, error } = useElementDiscovery(mockElements);

  const runTest = async (scenario: string, targetElement: UIElement) => {
    console.log(`🧪 运行测试场景: ${scenario}`);
    console.log('🎯 目标元素:', targetElement);
    
    try {
      await discoverElements(targetElement);
      
      setTestResults(prev => [...prev, {
        scenario,
        targetElement,
        discoveryResult: discoveryResult
      }]);
      
      console.log('✅ 测试完成，发现结果:', discoveryResult);
    } catch (err) {
      console.error('❌ 测试失败:', err);
    }
  };

  const testScenarios = [
    {
      name: '测试场景1：点击图标元素 (element_38)',
      description: '模拟用户点击图标，应该自动找到父容器并发现联系人文本',
      targetElement: mockElements[1] // element_38 图标
    },
    {
      name: '测试场景2：点击按钮容器 (element_37)', 
      description: '模拟用户点击正确的按钮容器，应该直接发现子元素',
      targetElement: mockElements[0] // element_37 按钮容器
    }
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>🧪 元素发现功能测试页面</Title>
      
      <Alert
        message="测试目的"
        description="验证修复后的元素发现功能是否能正确识别'联系人'隐藏文本元素，特别是在点击图标时能否自动找到父容器。"
        type="info"
        style={{ marginBottom: '24px' }}
      />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 测试数据展示 */}
        <Card title="📊 测试数据" size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            {mockElements.map((element, index) => (
              <Card key={element.id} type="inner" size="small">
                <Text strong>{element.id}</Text>
                <div>文本: "{element.text || '无'}"</div>
                <div>类型: {element.element_type}</div>
                <div>位置: [{element.bounds.left},{element.bounds.top}][{element.bounds.right},{element.bounds.bottom}]</div>
                <div>可点击: {element.is_clickable ? '是' : '否'}</div>
                {element.bounds.left === 0 && element.bounds.top === 0 && element.bounds.right === 0 && element.bounds.bottom === 0 && (
                  <Alert message="隐藏元素 - bounds=[0,0][0,0]" type="warning" />
                )}
                {element.text?.includes('联系人') && (
                  <Alert message="🎯 这是我们要发现的目标文本元素!" type="success" />
                )}
              </Card>
            ))}
          </Space>
        </Card>

        {/* 测试场景 */}
        <Card title="🧪 测试场景" size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            {testScenarios.map((scenario, index) => (
              <Card key={index} type="inner" size="small">
                <Title level={5}>{scenario.name}</Title>
                <Text>{scenario.description}</Text>
                <div style={{ marginTop: '12px' }}>
                  <Button 
                    type="primary"
                    loading={isAnalyzing}
                    onClick={() => runTest(scenario.name, scenario.targetElement)}
                  >
                    运行测试
                  </Button>
                </div>
              </Card>
            ))}
          </Space>
        </Card>

        {/* 当前发现结果 */}
        {discoveryResult && (
          <Card title="🔍 当前发现结果" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>目标元素:</Text> {discoveryResult.selfElement?.element.id || '无'}
              </div>
              <div>
                <Text strong>父元素数量:</Text> {discoveryResult.parentElements?.length || 0}
              </div>
              <div>
                <Text strong>子元素数量:</Text> {discoveryResult.childElements?.length || 0}
              </div>
              <div>
                <Text strong>兄弟元素数量:</Text> {discoveryResult.siblingElements?.length || 0}
              </div>
              
              {/* 🆕 兄弟元素展示 */}
              {discoveryResult.siblingElements?.length > 0 && (
                <Card type="inner" title="兄弟元素列表" size="small">
                  {discoveryResult.siblingElements.map((sibling: any, index: number) => (
                    <div key={index} style={{ marginBottom: '8px', padding: '8px', backgroundColor: '#e6f7ff', borderRadius: '4px' }}>
                      <div><strong>ID:</strong> {sibling.element.id}</div>
                      <div><strong>文本:</strong> "{sibling.element.text || '无'}"</div>
                      <div><strong>类型:</strong> {sibling.element.element_type}</div>
                      <div><strong>置信度:</strong> {(sibling.confidence * 100).toFixed(1)}%</div>
                      <div><strong>关系:</strong> {sibling.relationship}</div>
                      <div><strong>原因:</strong> {sibling.reason}</div>
                      {sibling.element.text?.includes('联系人') && (
                        <Alert message="🎉 成功发现联系人文本！（兄弟元素）" type="success" />
                      )}
                    </div>
                  ))}
                </Card>
              )}
              
              {discoveryResult.childElements?.length > 0 && (
                <Card type="inner" title="子元素列表" size="small">
                  {discoveryResult.childElements.map((child: any, index: number) => (
                    <div key={index} style={{ marginBottom: '8px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                      <div><strong>ID:</strong> {child.element.id}</div>
                      <div><strong>文本:</strong> "{child.element.text || '无'}"</div>
                      <div><strong>类型:</strong> {child.element.element_type}</div>
                      <div><strong>置信度:</strong> {(child.confidence * 100).toFixed(1)}%</div>
                      <div><strong>关系:</strong> {child.relationship}</div>
                      <div><strong>原因:</strong> {child.reason}</div>
                      {child.element.text?.includes('联系人') && (
                        <Alert message="🎉 成功发现联系人文本!" type="success" />
                      )}
                    </div>
                  ))}
                </Card>
              )}
            </Space>
          </Card>
        )}

        {/* 错误信息 */}
        {error && (
          <Alert
            message="测试出错"
            description={String(error)}
            type="error"
          />
        )}

        {/* 测试历史 */}
        {testResults.length > 0 && (
          <Card title="📋 测试历史" size="small">
            {testResults.map((result, index) => (
              <Card key={index} type="inner" size="small" style={{ marginBottom: '8px' }}>
                <Title level={5}>{result.scenario}</Title>
                <div>目标: {result.targetElement.id}</div>
                <div>子元素发现数量: {result.discoveryResult?.childElements?.length || 0}</div>
                {result.discoveryResult?.childElements?.some((c: any) => c.element.text?.includes('联系人')) ? (
                  <Alert message="✅ 成功发现联系人文本" type="success" />
                ) : (
                  <Alert message="❌ 未发现联系人文本" type="error" />
                )}
              </Card>
            ))}
          </Card>
        )}
      </Space>
    </div>
  );
};

export default ElementDiscoveryTestPage;