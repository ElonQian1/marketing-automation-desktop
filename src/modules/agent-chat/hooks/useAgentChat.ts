// src/modules/agent-chat/hooks/useAgentChat.ts
// module: agent-chat | layer: hooks | role: 状态管理
// summary: AI Agent 对话状态管理 Hook

import { useState, useCallback, useRef, useEffect } from 'react';
import { agentChatService } from '../services/agent-chat-service';
import type {
  AgentMessage,
  AgentProvider,
  ToolInfo,
  SessionStatus,
} from '../domain/agent-chat-types';

interface UseAgentChatOptions {
  onError?: (error: string) => void;
  autoRestore?: boolean; // 是否自动恢复保存的配置
}

interface UseAgentChatReturn {
  // 状态
  messages: AgentMessage[];
  isConfigured: boolean;
  isLoading: boolean;
  isRestoring: boolean;
  status: SessionStatus;
  tools: ToolInfo[];
  currentProvider: AgentProvider | null;
  hasSavedConfig: boolean;
  
  // 操作
  configure: (provider: AgentProvider, apiKey: string, model?: string) => Promise<boolean>;
  sendMessage: (content: string) => Promise<void>;
  analyzeScript: (scriptId: string) => Promise<void>;
  fixScript: (scriptId: string, issue: string) => Promise<void>;
  executeTask: (task: string) => Promise<void>;
  clearChat: () => Promise<void>;
  testConnection: () => Promise<boolean>;
  restoreConfig: () => Promise<boolean>;
  clearSavedConfig: () => Promise<void>;
  recheckConfig: () => Promise<void>; // 手动重新检查配置状态
}

/**
 * AI Agent 对话 Hook
 */
export function useAgentChat(options: UseAgentChatOptions = {}): UseAgentChatReturn {
  const { onError } = options;
  // autoRestore 功能已内置在 useEffect 中，始终自动恢复
  
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [tools, setTools] = useState<ToolInfo[]>([]);
  const [currentProvider, setCurrentProvider] = useState<AgentProvider | null>(null);
  const [hasSavedConfig, setHasSavedConfig] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // 注意：不使用 ref 来防止重复初始化，因为热重载时 ref 会被保留但实际需要重新初始化

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

  // 恢复保存的配置
  const restoreConfig = useCallback(async (): Promise<boolean> => {
    setIsRestoring(true);
    try {
      const result = await agentChatService.restoreConfig();
      if (result.success) {
        setIsConfigured(true);
        
        // 从 message 中解析 provider
        const providerMatch = result.message.match(/\((\w+)\)/);
        if (providerMatch) {
          setCurrentProvider(providerMatch[1] as AgentProvider);
        }
        
        // 获取可用工具
        const toolList = await agentChatService.listTools();
        setTools(toolList);
        
        // 添加欢迎消息
        addMessage({
          role: 'assistant',
          content: `🔄 配置已自动恢复\n\n可用工具: ${toolList.length} 个`,
        });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('恢复配置失败:', error);
      return false;
    } finally {
      setIsRestoring(false);
    }
  }, [addMessage]);

  // 清除保存的配置
  const clearSavedConfig = useCallback(async () => {
    await agentChatService.clearSavedConfig();
    setIsConfigured(false);
    setCurrentProvider(null);
    setTools([]);
    setHasSavedConfig(false);
  }, []);

  // 手动重新检查配置状态（用于热重载后同步）
  const recheckConfig = useCallback(async () => {
    console.log('🔍 手动检查配置状态...');
    const status = await agentChatService.getConfigStatus();
    setHasSavedConfig(status.hasSavedConfig);
    
    if (status.isConfigured && !isConfigured) {
      console.log('🔄 检测到后端已配置，同步前端状态...');
      setIsConfigured(true);
      if (status.provider) {
        setCurrentProvider(status.provider as AgentProvider);
      }
      const toolList = await agentChatService.listTools();
      setTools(toolList);
    } else if (!status.isConfigured && status.hasSavedConfig) {
      // 后端未配置但有保存的配置，尝试恢复
      console.log('🔄 后端未配置但有保存配置，尝试恢复...');
      await restoreConfig();
    }
  }, [isConfigured, restoreConfig]);

  // 组件挂载时自动检查和恢复配置
  // 注意：Vite HMR 会保留 React 状态，所以不能依赖 isConfigured 状态判断
  useEffect(() => {
    let cancelled = false;
    
    const initConfig = async () => {
      console.log('🚀 [useAgentChat] 初始化配置检查...');
      
      try {
        const status = await agentChatService.getConfigStatus();
        if (cancelled) return;
        
        console.log('📊 后端配置状态:', JSON.stringify(status));
        setHasSavedConfig(status.hasSavedConfig);
        
        // 优先级1：后端已经配置好了（热重载后 Rust 后端状态可能保留）
        if (status.isConfigured) {
          console.log('✅ 后端已配置，同步前端状态');
          setIsConfigured(true);
          if (status.provider) {
            setCurrentProvider(status.provider as AgentProvider);
          }
          const toolList = await agentChatService.listTools();
          if (!cancelled) {
            setTools(toolList);
          }
          return;
        }
        
        // 优先级2：后端未配置，但有保存的配置可恢复
        if (status.hasSavedConfig) {
          console.log('🔄 后端未配置，自动恢复保存的配置...');
          const result = await agentChatService.restoreConfig();
          if (cancelled) return;
          
          if (result.success) {
            console.log('✅ 配置恢复成功:', status.provider);
            setIsConfigured(true);
            if (status.provider) {
              setCurrentProvider(status.provider as AgentProvider);
            }
            const toolList = await agentChatService.listTools();
            if (!cancelled) {
              setTools(toolList);
              // 添加恢复成功提示（仅当没有消息时）
              setMessages(prev => {
                if (prev.length === 0) {
                  return [{
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: `🔄 配置已自动恢复 (${status.provider})\n\n可用工具: ${toolList.length} 个`,
                    timestamp: new Date(),
                  }];
                }
                return prev;
              });
            }
          } else {
            console.warn('⚠️ 配置恢复失败:', result.error);
            // 恢复失败，重置前端状态
            setIsConfigured(false);
          }
          return;
        }
        
        // 优先级3：没有任何配置
        console.log('ℹ️ 没有保存的配置，需要用户手动配置');
        setIsConfigured(false);
        
      } catch (error) {
        console.error('❌ 初始化配置检查失败:', error);
        setIsConfigured(false);
      }
    };
    
    initConfig();
    
    return () => {
      cancelled = true;
    };
  }, []); // 空依赖，只在挂载时执行一次

  return {
    messages,
    isConfigured,
    isLoading,
    isRestoring,
    status,
    tools,
    currentProvider,
    hasSavedConfig,
    configure,
    sendMessage,
    analyzeScript,
    fixScript,
    executeTask,
    clearChat,
    testConnection,
    restoreConfig,
    clearSavedConfig,
    recheckConfig,
  };
}
