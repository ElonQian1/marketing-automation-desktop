// src/modules/agent-chat/ui/AgentChatPanel.tsx
// module: agent-chat | layer: ui | role: 主面板组件
// summary: AI Agent 对话主面板，整合所有子组件

import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Empty, Badge, Tooltip, Space, Typography } from 'antd';
import {
  RobotOutlined,
  SettingOutlined,
  ApiOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { useAgentChat } from '../hooks/useAgentChat';
import { AgentChatMessage } from './AgentChatMessage';
import { AgentChatInput } from './AgentChatInput';
import { AgentConfigModal } from './AgentConfigModal';
import type { AgentProvider } from '../domain/agent-chat-types';
import './AgentChatPanel.css';

const { Text } = Typography;

interface AgentChatPanelProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * AI Agent 对话主面板
 */
export const AgentChatPanel: React.FC<AgentChatPanelProps> = ({
  className = '',
  style,
}) => {
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    isConfigured,
    isLoading,
    status,
    tools,
    currentProvider,
    configure,
    sendMessage,
    clearChat,
    recheckConfig,
  } = useAgentChat({
    onError: (error) => {
      console.error('Agent Chat Error:', error);
    },
  });

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 面板获得焦点时自动检查配置（处理热重载场景）
  useEffect(() => {
    const handleFocus = () => {
      recheckConfig();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [recheckConfig]);

  const handleConfigure = async (
    provider: AgentProvider,
    apiKey: string,
    model?: string
  ): Promise<boolean> => {
    return configure(provider, apiKey, model);
  };

  const getProviderLabel = (provider: AgentProvider | null): string => {
    switch (provider) {
      case 'openai': return 'OpenAI';
      case 'hunyuan': return '腾讯混元';
      case 'deepseek': return 'DeepSeek';
      case 'custom': return '自定义';
      default: return '未配置';
    }
  };

  const getStatusBadge = () => {
    if (!isConfigured) {
      return <Badge status="default" text="未连接" />;
    }
    switch (status) {
      case 'thinking':
        return <Badge status="processing" text="思考中" />;
      case 'waiting_for_tools':
        return <Badge status="processing" text="执行工具" />;
      case 'error':
        return <Badge status="error" text="错误" />;
      default:
        return <Badge status="success" text="就绪" />;
    }
  };

  return (
    <Card
      className={`agent-chat-panel ${className}`}
      style={style}
      title={
        <div className="agent-chat-panel-header">
          <Space>
            <RobotOutlined style={{ fontSize: 20, color: '#52c41a' }} />
            <span>AI 脚本助手</span>
            {getStatusBadge()}
          </Space>
          
          <Space>
            {isConfigured && (
              <Tooltip title={`${tools.length} 个可用工具`}>
                <Button type="text" icon={<ToolOutlined />} size="small">
                  {tools.length}
                </Button>
              </Tooltip>
            )}
            
            <Tooltip title={isConfigured ? `当前: ${getProviderLabel(currentProvider)}` : '配置 AI'}>
              <Button
                type="text"
                icon={isConfigured ? <ApiOutlined /> : <SettingOutlined />}
                onClick={() => setConfigModalOpen(true)}
              >
                {isConfigured ? getProviderLabel(currentProvider) : '配置'}
              </Button>
            </Tooltip>
          </Space>
        </div>
      }
      styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: 'calc(100% - 57px)' } }}
    >
      {/* 消息列表 */}
      <div className="agent-chat-messages">
        {messages.length === 0 ? (
          <div className="agent-chat-empty">
            {isConfigured ? (
              <Empty
                image={<RobotOutlined style={{ fontSize: 64, color: '#52c41a' }} />}
                description={
                  <div>
                    <Text>AI 助手已就绪</Text>
                    <br />
                    <Text type="secondary">
                      输入问题或选择快捷操作开始对话
                    </Text>
                  </div>
                }
              />
            ) : (
              <Empty
                image={<SettingOutlined style={{ fontSize: 64, color: '#faad14' }} />}
                description={
                  <div>
                    <Text>请先配置 AI 提供商</Text>
                    <br />
                    <Button
                      type="primary"
                      onClick={() => setConfigModalOpen(true)}
                      style={{ marginTop: 16 }}
                    >
                      立即配置
                    </Button>
                  </div>
                }
              />
            )}
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <AgentChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* 输入区域 */}
      <AgentChatInput
        onSend={sendMessage}
        onClear={clearChat}
        disabled={!isConfigured || isLoading}
        placeholder={
          !isConfigured
            ? '请先配置 AI 提供商...'
            : isLoading
            ? 'AI 正在思考...'
            : '输入消息，让 AI 帮你管理脚本...'
        }
      />

      {/* 配置弹窗 */}
      <AgentConfigModal
        open={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        onConfigure={handleConfigure}
        loading={isLoading}
      />
    </Card>
  );
};
