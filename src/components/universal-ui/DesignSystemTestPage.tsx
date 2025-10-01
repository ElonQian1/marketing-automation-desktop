/**
 * 设计系统测试页面
 * 独立测试新的 Universal UI 现代化设计系统
 */

import React, { useState } from 'react';
import { Button } from 'antd';
import DesignSystemPreview from './DesignSystemPreview';

const DesignSystemTestPage: React.FC = () => {
  const [previewVisible, setPreviewVisible] = useState(false);

  return (
    <div style={{ padding: '24px' }}>
      <h1>Universal UI 现代化设计系统测试</h1>
      <p>点击下面的按钮查看新的设计系统预览：</p>
      
      <Button 
        type="primary" 
        size="large"
        onClick={() => setPreviewVisible(true)}
      >
        打开设计系统预览
      </Button>

      <DesignSystemPreview 
        visible={previewVisible}
        onCancel={() => setPreviewVisible(false)}
      />
      
      <div style={{ 
        marginTop: 'var(--space-8)', 
        padding: 'var(--space-6)', 
        backgroundColor: 'var(--bg-elevated)', 
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border-primary)'
      }}>
        <h2>设计改进总结</h2>
        <ul>
          <li>✅ 解决了单一色调问题，引入丰富的语义化色彩系统</li>
          <li>✅ 建立了清晰的视觉层次和信息架构</li>
          <li>✅ 创建了现代化的设计令牌系统</li>
          <li>✅ 实现了设备连接面板的完整重设计</li>
          <li>✅ 优化了 Ant Design 组件的视觉效果</li>
          <li>✅ 添加了响应式设计和可访问性支持</li>
        </ul>
      </div>
    </div>
  );
};

export default DesignSystemTestPage;