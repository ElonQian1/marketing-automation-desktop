// src/modules/version-control/ui/version-control-demo.tsx
// module: version-control | layer: ui | role: 版本控制演示页面
// summary: 用于测试和演示版本控制功能的独立页面

import React, { useState } from 'react';
import { Card, Button, Space, Input, message, Divider } from 'antd';
import { VersionControlPanel } from './version-control-panel';

interface VersionControlDemoProps {
  className?: string;
}

export const VersionControlDemo: React.FC<VersionControlDemoProps> = ({ className }) => {
  const [xmlContent, setXmlContent] = useState(`<?xml version="1.0" encoding="UTF-8"?>
<hierarchy rotation="0">
  <node index="0" text="首页" resource-id="com.xiaohongshu.app:id/main_home" class="android.widget.TextView" />
  <node index="1" text="发现" resource-id="com.xiaohongshu.app:id/main_discover" class="android.widget.TextView" />
  <node index="2" text="我" resource-id="com.xiaohongshu.app:id/main_profile" class="android.widget.TextView" />
</hierarchy>`);

  const handleLoadSampleXml = () => {
    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<hierarchy rotation="0">
  <node index="0" text="小红书" resource-id="com.xiaohongshu.app:id/title" class="android.widget.TextView" bounds="[100,200][400,300]" />
  <node index="1" text="搜索" resource-id="com.xiaohongshu.app:id/search" class="android.widget.Button" bounds="[450,200][600,300]" />
  <node index="2" text="笔记列表" resource-id="com.xiaohongshu.app:id/note_list" class="android.widget.ListView" bounds="[50,350][700,1200]">
    <node index="0" text="笔记1" resource-id="com.xiaohongshu.app:id/note_item" class="android.widget.RelativeLayout" />
    <node index="1" text="笔记2" resource-id="com.xiaohongshu.app:id/note_item" class="android.widget.RelativeLayout" />
  </node>
</hierarchy>`;
    setXmlContent(sampleXml);
    message.success('已加载示例 XML 内容');
  };

  const handleClearXml = () => {
    setXmlContent('');
    message.info('已清空 XML 内容');
  };

  return (
    <div className={`light-theme-force ${className || ''}`}>
      <Card title="版本控制系统演示" style={{ margin: '20px' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* XML 内容编辑区 */}
          <Card size="small" title="XML 内容编辑">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Button onClick={handleLoadSampleXml} type="primary">
                  加载示例 XML
                </Button>
                <Button onClick={handleClearXml}>
                  清空内容
                </Button>
              </Space>
              <Input.TextArea
                value={xmlContent}
                onChange={(e) => setXmlContent(e.target.value)}
                placeholder="输入或编辑 XML 内容..."
                rows={8}
                style={{ fontFamily: 'monospace' }}
              />
              <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)' }}>
                当前内容长度: {xmlContent.length} 字符
              </div>
            </Space>
          </Card>

          <Divider />

          {/* 版本控制面板 */}
          <VersionControlPanel xmlContent={xmlContent} />

          <Divider />

          {/* 使用说明 */}
          <Card size="small" title="使用说明" style={{ backgroundColor: 'var(--bg-secondary, #f8fafc)' }}>
            <Space direction="vertical">
              <div>
                <strong>基本功能:</strong>
                <ul style={{ margin: '8px 0', paddingLeft: '24px' }}>
                  <li>编辑上方的 XML 内容，然后点击"保存版本"创建新版本</li>
                  <li>使用"创建分支"功能管理不同的开发分支</li>
                  <li>通过"查看版本历史"查看所有保存的版本</li>
                  <li>点击版本操作按钮切换到不同版本或删除版本</li>
                </ul>
              </div>
              <div>
                <strong>测试流程:</strong>
                <ol style={{ margin: '8px 0', paddingLeft: '24px' }}>
                  <li>点击"加载示例 XML"获取测试数据</li>
                  <li>点击"保存版本"创建第一个版本</li>
                  <li>修改 XML 内容，再次保存创建新版本</li>
                  <li>测试版本切换和分支管理功能</li>
                </ol>
              </div>
              <div style={{ 
                padding: '12px', 
                backgroundColor: 'var(--bg-warning, #fef3c7)', 
                border: '1px solid var(--border-warning, #f59e0b)', 
                borderRadius: '6px',
                fontSize: '13px'
              }}>
                <strong>注意:</strong> 此演示页面连接到 Phase 3 实现的后端版本控制系统，所有操作都会调用真实的 Tauri 命令。
              </div>
            </Space>
          </Card>
        </Space>
      </Card>
    </div>
  );
};