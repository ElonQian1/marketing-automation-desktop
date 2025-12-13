// src/modules/agent-chat/ui/AgentChatMessage.tsx
// module: agent-chat | layer: ui | role: 消息气泡组件
// summary: 显示单条对话消息

import React from 'react';
import { Avatar, Typography, Spin, Tag } from 'antd';
import {
  UserOutlined,
  RobotOutlined,
  ToolOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { AgentMessage } from '../domain/agent-chat-types';

/**
 * 简单的 Markdown 渲染函数（仅处理代码块和换行）
 */
function renderSimpleMarkdown(content: string): React.ReactNode {
  // 处理代码块
  const parts = content.split(/(```[\s\S]*?```)/g);
  return parts.map((part, index) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const code = part.slice(3, -3).replace(/^\w+\n/, ''); // 移除语言标识
      return (
        <pre key={index} style={{ background: 'rgba(0,0,0,0.3)', padding: 8, borderRadius: 4, overflow: 'auto' }}>
          <code>{code}</code>
        </pre>
      );
    }
    // 处理换行
    return <span key={index} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>;
  });
}
import './AgentChatMessage.css';

const { Text } = Typography;

interface AgentChatMessageProps {
  message: AgentMessage;
}

/**
 * 对话消息气泡组件
 */
export const AgentChatMessage: React.FC<AgentChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isError = !!message.error;
  const isStreaming = message.isStreaming;

  return (
    <div className={`agent-chat-message ${isUser ? 'user' : 'assistant'}`}>
      <div className="agent-chat-message-avatar">
        <Avatar
          size={36}
          icon={isUser ? <UserOutlined /> : <RobotOutlined />}
          style={{
            backgroundColor: isUser ? '#1890ff' : '#52c41a',
          }}
        />
      </div>
      
      <div className="agent-chat-message-content">
        <div className="agent-chat-message-header">
          <Text type="secondary" className="agent-chat-message-role">
            {isUser ? '你' : 'AI 助手'}
          </Text>
          <Text type="secondary" className="agent-chat-message-time">
            {formatTime(message.timestamp)}
          </Text>
        </div>
        
        <div className={`agent-chat-message-bubble ${isError ? 'error' : ''}`}>
          {isStreaming ? (
            <div className="agent-chat-message-loading">
              <Spin indicator={<LoadingOutlined spin />} size="small" />
              <span>{message.content}</span>
            </div>
          ) : isError ? (
            <div className="agent-chat-message-error">
              <ExclamationCircleOutlined />
              <span>错误: {message.error}</span>
            </div>
          ) : (
            <div className="agent-chat-message-text">
              {renderSimpleMarkdown(message.content)}
            </div>
          )}
          
          {/* 工具调用显示 */}
          {message.toolCalls && message.toolCalls.length > 0 && (
            <div className="agent-chat-message-tools">
              {message.toolCalls.map((tool) => (
                <Tag
                  key={tool.id}
                  icon={<ToolOutlined />}
                  color={
                    tool.status === 'completed' ? 'success' :
                    tool.status === 'failed' ? 'error' :
                    tool.status === 'running' ? 'processing' :
                    'default'
                  }
                >
                  {tool.name}
                </Tag>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function formatTime(date: Date): string {
  const d = new Date(date);
  return d.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
