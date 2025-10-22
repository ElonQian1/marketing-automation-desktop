// src/pages/StepCardDemo.tsx
// module: pages | layer: ui | role: 步骤卡片动作系统演示页面
// summary: 展示新的步骤卡片动作切换系统

import React from 'react';
import { Space, Typography, Divider } from 'antd';
import { NewStepCard } from '../components/stepCards/NewStepCard';

const { Title, Paragraph } = Typography;

export const StepCardDemo: React.FC = () => {
  return (
    <div className="light-theme-force" style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Title level={2}>📱 步骤卡片动作切换系统演示</Title>
        
        <Paragraph>
          这是全新的步骤卡片系统，支持：
          <ul>
            <li>🎯 <strong>默认点选操作</strong> - 一键执行点击动作</li>
            <li>🔄 <strong>动作类型切换</strong> - 支持点选/双击/长按/滑动/输入/等待/返回</li>
            <li>⚙️ <strong>动态参数面板</strong> - 根据动作类型显示对应参数</li>
            <li>📊 <strong>执行状态机</strong> - 匹配→执行→验证的完整流程</li>
            <li>🛡️ <strong>选择器优先+坐标兜底</strong> - 可靠的执行策略</li>
          </ul>
        </Paragraph>

        <Divider />

        <Title level={3}>📋 演示步骤卡片</Title>

        {/* 演示卡片1：通讯录图标 */}
        <NewStepCard
          stepId="demo_1"
          stepName="点击通讯录图标"
          selectorId="element_element_63"
          initialAction="tap"
          onStatusChange={(status) => console.log('卡片1状态:', status)}
          onActionChange={(action) => console.log('卡片1动作:', action)}
        />

        {/* 演示卡片2：搜索框 */}
        <NewStepCard
          stepId="demo_2"
          stepName="搜索框输入"
          selectorId="element_search_box"
          initialAction="type"
          initialCommon={{ confidenceThreshold: 0.9 }}
          onStatusChange={(status) => console.log('卡片2状态:', status)}
          onActionChange={(action) => console.log('卡片2动作:', action)}
        />

        {/* 演示卡片3：滑动操作 */}
        <NewStepCard
          stepId="demo_3"
          stepName="向下滑动页面"
          selectorId="element_page_container"
          initialAction="swipe"
          initialCommon={{ verifyAfter: true }}
          onStatusChange={(status) => console.log('卡片3状态:', status)}
          onActionChange={(action) => console.log('卡片3动作:', action)}
        />

        <Divider />

        <Paragraph type="secondary" style={{ textAlign: 'center' }}>
          💡 <strong>使用说明：</strong><br />
          1. 点击"执行"按钮的下拉箭头切换动作类型<br />
          2. "执行"按钮执行匹配+动作，"仅匹配"按钮只做元素匹配预览<br />
          3. 参数面板会根据选择的动作类型动态变化<br />
          4. 通用设置控制执行策略和重试机制
        </Paragraph>
      </Space>
      

    </div>
  );
};