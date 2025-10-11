// src/pages/performance-demo/XPathPerformanceDemo.tsx
// module: ui | layer: ui | role: page
// summary: 页面组件

import React, { useState } from 'react';
import { Card, Button, Space, Typography, Input, Row, Col, Divider } from 'antd';
import { PlayCircleOutlined, BugOutlined } from '@ant-design/icons';
import XPathService from '../../utils/xpath/XPathService';
import { XPathPerformanceMonitor, XPathPerformancePanel } from '../../components/universal-ui/views/xpath-monitor';

const { Title, Text } = Typography;

/**
 * XPath 性能测试和监控演示页面
 */
export const XPathPerformanceDemo: React.FC = () => {
  const [testXPath, setTestXPath] = useState<string>('//android.widget.TextView[@text="测试"]');
  const [testResults, setTestResults] = useState<string[]>([]);

  // 运行性能测试
  const runPerformanceTest = () => {
    const results: string[] = [];
    results.push('=== XPath 性能测试开始 ===');

    // 测试验证功能
    const testPaths = [
      '//android.widget.TextView[@text="测试"]',
      '//android.widget.Button[@resource-id="com.example:id/button"]',
      '//*[@content-desc="点击按钮"]',
      '//android.widget.EditText[@hint="请输入内容"]',
      '/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout',
    ];

    results.push('\n1. 验证缓存测试:');
    testPaths.forEach((path, index) => {
      const start = performance.now();
      const isValid1 = XPathService.isValid(path); // 第一次验证
      const time1 = performance.now() - start;

      const start2 = performance.now();
      const isValid2 = XPathService.isValid(path); // 第二次验证（应该命中缓存）
      const time2 = performance.now() - start2;

      results.push(`  路径 ${index + 1}: ${isValid1} (${time1.toFixed(2)}ms → ${time2.toFixed(2)}ms)`);
    });

    // 模拟元素生成测试
    results.push('\n2. 生成缓存测试:');
    const mockElements = [
      { tag: 'TextView', text: '测试文本1', 'resource-id': 'com.example:id/text1' },
      { tag: 'Button', text: '点击按钮', 'content-desc': '按钮描述' },
      { tag: 'EditText', hint: '输入框', class: 'android.widget.EditText' },
    ];

    mockElements.forEach((element, index) => {
      const start = performance.now();
      const xpath1 = XPathService.generate(element); // 第一次生成
      const time1 = performance.now() - start;

      const start2 = performance.now();
      const xpath2 = XPathService.generate(element); // 第二次生成（应该命中缓存）
      const time2 = performance.now() - start2;

      results.push(`  元素 ${index + 1}: ${xpath1} (${time1.toFixed(2)}ms → ${time2.toFixed(2)}ms)`);
    });

    // 解析测试
    results.push('\n3. 解析性能测试:');
    testPaths.forEach((path, index) => {
      const start = performance.now();
      const parsed = XPathService.parse(path);
      const time = performance.now() - start;
      results.push(`  解析 ${index + 1}: ${time.toFixed(2)}ms (${parsed ? '成功' : '失败'})`);
    });

    results.push('\n=== 测试完成 ===');
    setTestResults(results);
  };

  // 测试单个XPath
  const testSingleXPath = () => {
    if (!testXPath.trim()) return;

    const results: string[] = [];
    results.push(`=== 单个 XPath 测试: ${testXPath} ===`);

    // 验证测试
    const start1 = performance.now();
    const isValid = XPathService.isValid(testXPath);
    const time1 = performance.now() - start1;
    results.push(`验证结果: ${isValid} (耗时: ${time1.toFixed(2)}ms)`);

    // 解析测试
    const start2 = performance.now();
    const parsed = XPathService.parse(testXPath);
    const time2 = performance.now() - start2;
    results.push(`解析结果: ${parsed ? '成功' : '失败'} (耗时: ${time2.toFixed(2)}ms)`);

    if (parsed) {
      results.push(`解析详情: ${JSON.stringify(parsed, null, 2)}`);
    }

    // 优化测试
    const start3 = performance.now();
    const optimized = XPathService.optimize(testXPath);
    const time3 = performance.now() - start3;
    results.push(`优化结果: ${optimized} (耗时: ${time3.toFixed(2)}ms)`);

    setTestResults(results);
  };

  // 预热缓存
  const warmupCache = async () => {
    const commonPaths = [
      '//android.widget.TextView',
      '//android.widget.Button',
      '//android.widget.EditText',
      '//android.widget.ImageView',
      '//*[@resource-id]',
      '//*[@text]',
      '//*[@content-desc]',
    ];

    await XPathService.warmupCache(commonPaths);
    setTestResults(['缓存预热完成！常用 XPath 表达式已加载到缓存中。']);
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>XPath 性能监控演示</Title>
      <Text type="secondary">
        这个页面演示了 XPath 服务的性能监控功能，包括缓存命中率、计算时间和内存使用。
      </Text>

      <Row gutter={24} style={{ marginTop: 24 }}>
        {/* 左侧：测试控制面板 */}
        <Col span={12}>
          <Card title="性能测试" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="primary" 
                icon={<PlayCircleOutlined />}
                onClick={runPerformanceTest}
                block
              >
                运行完整性能测试
              </Button>

              <Button 
                onClick={warmupCache}
                block
              >
                预热缓存
              </Button>

              <Divider />

              <Text strong>单个 XPath 测试:</Text>
              <Input.TextArea
                value={testXPath}
                onChange={(e) => setTestXPath(e.target.value)}
                placeholder="输入要测试的 XPath 表达式"
                rows={2}
              />
              <Button 
                icon={<BugOutlined />}
                onClick={testSingleXPath}
                block
              >
                测试此 XPath
              </Button>

              <Divider />

              <XPathPerformancePanel />
            </Space>
          </Card>

          {/* 测试结果 */}
          {testResults.length > 0 && (
            <Card title="测试结果" size="small" style={{ marginTop: 16 }}>
              <div style={{ 
                background: '#f6f8fa', 
                padding: '12px', 
                borderRadius: '4px',
                maxHeight: '300px',
                overflow: 'auto'
              }}>
                <Text code style={{ 
                  whiteSpace: 'pre-wrap', 
                  fontSize: '12px',
                  display: 'block'
                }}>
                  {testResults.join('\n')}
                </Text>
              </div>
            </Card>
          )}
        </Col>

        {/* 右侧：性能监控 */}
        <Col span={12}>
          <XPathPerformanceMonitor />
        </Col>
      </Row>
    </div>
  );
};

export default XPathPerformanceDemo;