// src/components/universal-ui/views/xpath-monitor/XPathPerformancePanel.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React, { useState } from 'react';
import { Button, Modal, Typography, Space, Divider } from 'antd';
import { BarChartOutlined } from '@ant-design/icons';
import XPathService from '../../../../utils/xpath/XPathService';

const { Text, Paragraph } = Typography;

/**
 * XPath 性能报告面板
 * 用于开发调试时快速查看性能报告
 */
export const XPathPerformancePanel: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [report, setReport] = useState<string>('');

  const handleShowReport = () => {
    const performanceReport = XPathService.getPerformanceReport();
    setReport(performanceReport);
    setVisible(true);
  };

  const handleClearCache = () => {
    XPathService.clearCache();
    const newReport = XPathService.getPerformanceReport();
    setReport(newReport);
  };

  return (
    <>
      <Button 
        icon={<BarChartOutlined />} 
        onClick={handleShowReport}
        type="dashed"
        size="small"
      >
        XPath 性能报告
      </Button>

      <Modal
        title="XPath Service 性能报告"
        open={visible}
        onCancel={() => setVisible(false)}
        footer={
          <Space>
            <Button onClick={handleClearCache}>
              清除缓存
            </Button>
            <Button onClick={handleShowReport}>
              刷新报告
            </Button>
            <Button type="primary" onClick={() => setVisible(false)}>
              关闭
            </Button>
          </Space>
        }
        width={600}
      >
        <div style={{ maxHeight: '400px', overflow: 'auto' }}>
          <Paragraph>
            <Text code style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
              {report}
            </Text>
          </Paragraph>
          
          <Divider />
          
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text type="secondary">
              <strong>说明:</strong>
            </Text>
            <Text type="secondary">
              • 命中率越高表示缓存效果越好，减少了重复计算
            </Text>
            <Text type="secondary">
              • 验证缓存用于缓存 XPath 表达式的有效性检查结果
            </Text>
            <Text type="secondary">
              • 生成缓存用于缓存从元素生成的 XPath 表达式
            </Text>
            <Text type="secondary">
              • 总计算时间反映了实际的 XPath 操作耗时（不包括缓存命中）
            </Text>
          </Space>
        </div>
      </Modal>
    </>
  );
};

export default XPathPerformancePanel;