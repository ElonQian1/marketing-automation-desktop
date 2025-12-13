// src/modules/agent-chat/hooks/useAgentChat.ts
// module: agent-chat | layer: hooks | role: 状态管理
// summary: AI Agent 对话状态管理 Hook

import { useState, useCallback, useRef } from 'react';
import { agentChatService } from '../services/agent-chat-service';
import type {
  AgentMessage,
  AgentProvider,
  ToolInfo,
  SessionStatus,
} from '../domain/agent-chat-types';

interface UseAgentChatOptions {
  onError?: (error: string) => void;
}

interface UseAgentChatReturn {
  // 状态
  messages: AgentMessage[];
  isConfigured: boolean;
  isLoading: boolean;
  status: SessionStatus;
  tools: ToolInfo[];
  currentProvider: AgentProvider | null;
  
  // 操作
  configure: (provider: AgentProvider, apiKey: string, model?: string) => Promise<boolean>;
  sendMessage: (content: string) => Promise<void>;
  analyzeScript: (scriptId: string) => Promise<void>;
  fixScript: (scriptId: string, issue: string) => Promise<void>;
  executeTask: (task: string) => Promise<void>;
  clearChat: () => Promise<void>;
  testConnection: () => Promise<boolean>;
}

/**
 * AI Agent 对话 Hook
 */
export function useAgentChat(options: UseAgentChatOptions = {}): UseAgentChatReturn {
  const { onError } = options;
  
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [tools, setTools] = useState<ToolInfo[]>([]);
  const [currentProvider, setCurrentProvider] = useState<AgentProvider | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // 添加消息
  const addMessage = useCallback((message: Omit<AgentMessage, 'id' | 'timestamp'>) => {
    const newMessage: AgentMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    setTimeout(scrollToBottom, 100);
    return newMessage.id;
  }, [scrollToBottom]);

  // 更新消息
  const updateMessage = useCallback((id: string, updates: Partial<AgentMessage>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  }, []);

  // 配置 AI 提供商
  const configure = useCallback(async (
    provider: AgentProvider,
    apiKey: string,
    model?: string
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await agentChatService.configure({
        provider,
        apiKey,
        model,
      });
      
      if (result.success) {
        setIsConfigured(true);
        setCurrentProvider(provider);
        
        // 获取可用工具
        const toolList = await agentChatService.listTools();
        setTools(toolList);
        
        // 添加系统欢迎消息
        addMessage({
          role: 'assistant',
          content: `🤖 AI 助手已就绪！\n\n我可以帮你：\n- 📝 分析和修复脚本问题\n- 🔧 创建新的自动化脚本\n- 📱 获取设备屏幕信息\n- 🚀 执行脚本测试\n\n可用工具: ${toolList.length} 个\n\n试试问我："帮我分析一下现有的脚本"`,
        });
        
        return true;
      } else {
        onError?.(result.error || '配置失败');
        return false;
      }
    } catch (error) {
      onError?.(String(error));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [addMessage, onError]);

  // 发送消息
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;
    
    // 添加用户消息
    addMessage({
      role: 'user',
      content: content.trim(),
    });
    
    // 添加 AI 思考中占位消息
    const thinkingId = addMessage({
      role: 'assistant',
      content: '思考中...',
      isStreaming: true,
    });
    
    setIsLoading(true);
    setStatus('thinking');
    
    try {
      const result = await agentChatService.chat(content);
      
      if (result.success) {
        updateMessage(thinkingId, {
          content: result.reply,
          isStreaming: false,
        });
      } else {
        updateMessage(thinkingId, {
          content: '',
          isStreaming: false,
          error: result.error || '请求失败',
        });
        onError?.(result.error || '请求失败');
      }
    } catch (error) {
      updateMessage(thinkingId, {
        content: '',
        isStreaming: false,
        error: String(error),
      });
      onError?.(String(error));
    } finally {
      setIsLoading(false);
      setStatus('idle');
    }
  }, [addMessage, updateMessage, isLoading, onError]);

  // 分析脚本
  const analyzeScript = useCallback(async (scriptId: string) => {
    addMessage({
      role: 'user',
      content: `请帮我分析脚本 \`${scriptId}\` 的问题`,
    });
    
    const thinkingId = addMessage({
      role: 'assistant',
      content: '正在分析脚本...',
      isStreaming: true,
    });
    
    setIsLoading(true);
    setStatus('thinking');
    
    try {
      const result = await agentChatService.analyzeScript(scriptId);
      
      updateMessage(thinkingId, {
        content: result.success ? result.reply : `分析失败: ${result.error}`,
        isStreaming: false,
        error: result.success ? undefined : result.error,
      });
    } catch (error) {
      updateMessage(thinkingId, {
        content: '',
        isStreaming: false,
        error: String(error),
      });
    } finally {
      setIsLoading(false);
      setStatus('idle');
    }
  }, [addMessage, updateMessage]);

  // 修复脚本
  const fixScript = useCallback(async (scriptId: string, issue: string) => {
    addMessage({
      role: 'user',
      content: `请修复脚本 \`${scriptId}\`\n\n问题: ${issue}`,
    });
    
    const thinkingId = addMessage({
      role: 'assistant',
      content: '正在修复脚本...',
      isStreaming: true,
    });
    
    setIsLoading(true);
    setStatus('thinking');
    
    try {
      const result = await agentChatService.fixScript(scriptId, issue);
      
      updateMessage(thinkingId, {
        content: result.success ? result.reply : `修复失败: ${result.error}`,
        isStreaming: false,
        error: result.success ? undefined : result.error,
      });
    } catch (error) {
      updateMessage(thinkingId, {
        content: '',
        isStreaming: false,
        error: String(error),
      });
    } finally {
      setIsLoading(false);
      setStatus('idle');
    }
  }, [addMessage, updateMessage]);

  // 执行任务
  const executeTask = useCallback(async (task: string) => {
    addMessage({
      role: 'user',
      content: `请帮我完成: ${task}`,
    });
    
    const thinkingId = addMessage({
      role: 'assistant',
      content: '正在执行任务...',
      isStreaming: true,
    });
    
    setIsLoading(true);
    setStatus('thinking');
    
    try {
      const result = await agentChatService.executeTask(task);
      
      updateMessage(thinkingId, {
        content: result.success ? result.reply : `执行失败: ${result.error}`,
        isStreaming: false,
        error: result.success ? undefined : result.error,
      });
    } catch (error) {
      updateMessage(thinkingId, {
        content: '',
        isStreaming: false,
        error: String(error),
      });
    } finally {
      setIsLoading(false);
      setStatus('idle');
    }
  }, [addMessage, updateMessage]);

  // 清空对话
  const clearChat = useCallback(async () => {
    await agentChatService.clearSession();
    setMessages([]);
    setStatus('idle');
  }, []);

  // 测试连接
  const testConnection = useCallback(async (): Promise<boolean> => {
    const result = await agentChatService.testConnection();
    return result.success;
  }, []);

  return {
    messages,
    isConfigured,
    isLoading,
    status,
    tools,
    currentProvider,
    configure,
    sendMessage,
    analyzeScript,
    fixScript,
    executeTask,
    clearChat,
    testConnection,
  };
}
