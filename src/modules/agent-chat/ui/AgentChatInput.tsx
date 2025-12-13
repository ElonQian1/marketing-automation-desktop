// src/modules/agent-chat/ui/AgentChatInput.tsx
// module: agent-chat | layer: ui | role: 输入框组件
// summary: 对话输入框，支持快捷操作

import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Tooltip, Dropdown, Space } from 'antd';
import type { MenuProps } from 'antd';
import {
  SendOutlined,
  ThunderboltOutlined,
  ClearOutlined,
  BugOutlined,
  ToolOutlined,
  FileSearchOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import './AgentChatInput.css';

const { TextArea } = Input;

interface AgentChatInputProps {
  onSend: (message: string) => void;
  onClear: () => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * 对话输入框组件
 */
export const AgentChatInput: React.FC<AgentChatInputProps> = ({
  onSend,
  onClear,
  disabled = false,
  placeholder = '输入消息，或选择快捷操作...',
}) => {
  const [value, setValue] = useState('');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // 快捷操作菜单
  const quickActions: MenuProps['items'] = [
    {
      key: 'analyze',
      icon: <FileSearchOutlined />,
      label: '分析所有脚本',
      onClick: () => onSend('请帮我列出所有脚本，并分析它们的问题'),
    },
    {
      key: 'create',
      icon: <RocketOutlined />,
      label: '创建新脚本',
      onClick: () => onSend('请帮我创建一个新的自动化脚本'),
    },
    {
      key: 'debug',
      icon: <BugOutlined />,
      label: '调试脚本',
      onClick: () => onSend('请帮我调试当前脚本，找出执行失败的原因'),
    },
    {
      key: 'devices',
      icon: <ToolOutlined />,
      label: '检查设备状态',
      onClick: () => onSend('请列出当前连接的设备，并检查它们的状态'),
    },
    { type: 'divider' },
    {
      key: 'help',
      label: '查看所有可用工具',
      onClick: () => onSend('请列出你可以使用的所有工具，并简要说明它们的用途'),
    },
  ];

  const handleSend = () => {
    if (value.trim() && !disabled) {
      onSend(value.trim());
      setValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + Enter 发送
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  // 自动聚焦
  useEffect(() => {
    textAreaRef.current?.focus();
  }, []);

  return (
    <div className="agent-chat-input">
      <div className="agent-chat-input-toolbar">
        <Space>
          <Dropdown menu={{ items: quickActions }} trigger={['click']}>
            <Button
              type="text"
              icon={<ThunderboltOutlined />}
              disabled={disabled}
            >
              快捷操作
            </Button>
          </Dropdown>
          
          <Tooltip title="清空对话">
            <Button
              type="text"
              icon={<ClearOutlined />}
              onClick={onClear}
              disabled={disabled}
            />
          </Tooltip>
        </Space>
        
        <span className="agent-chat-input-hint">
          Ctrl + Enter 发送
        </span>
      </div>
      
      <div className="agent-chat-input-area">
        <TextArea
          ref={textAreaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoSize={{ minRows: 2, maxRows: 6 }}
          className="agent-chat-textarea"
        />
        
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="agent-chat-send-btn"
        >
          发送
        </Button>
      </div>
    </div>
  );
};
