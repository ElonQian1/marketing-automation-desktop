// src/modules/structural-matching/ui/components/structural-matching-error-boundary.tsx
// module: structural-matching | layer: ui | role: 错误边界组件
// summary: React错误边界组件，集成错误恢复服务

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Button, Space, Typography, Card, Collapse, Tag } from 'antd';
import { 
  ExclamationCircleOutlined, 
  ReloadOutlined, 
  BugOutlined,
  InfoCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { 
  StructuralMatchingErrorRecoveryService,
  type StructuralMatchingError,
  type UserFriendlyMessage 
} from '../../domain/services/structural-matching-error-recovery-service';
import { useStructuralMatchingEvents } from '../../hooks/use-structural-matching-events';

const { Text, Title, Paragraph } = Typography;
const { Panel } = Collapse;

/**
 * 错误边界属性
 */
export interface StructuralMatchingErrorBoundaryProps {
  children: ReactNode;
  
  // 组件标识
  componentName?: string;
  
  // 是否显示错误详情
  showErrorDetails?: boolean;
  
  // 是否启用自动恢复
  enableAutoRecovery?: boolean;
  
  // 自定义错误处理
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  
  // 自定义恢复操作
  onRecovery?: (success: boolean, strategy: string) => void;
  
  // 降级渲染内容
  fallback?: ReactNode;
  
  // 样式类名
  className?: string;
}

/**
 * 错误边界状态
 */
interface StructuralMatchingErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  structuredError: StructuralMatchingError | null;
  userFriendlyMessage: UserFriendlyMessage | null;
  isRecovering: boolean;
  recoveryAttempts: number;
  showDetails: boolean;
}

/**
 * 结构匹配错误边界组件
 */
export class StructuralMatchingErrorBoundary extends Component<
  StructuralMatchingErrorBoundaryProps,
  StructuralMatchingErrorBoundaryState
> {
  private errorRecoveryService: StructuralMatchingErrorRecoveryService;
  private errorId: string = '';

  constructor(props: StructuralMatchingErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      structuredError: null,
      userFriendlyMessage: null,
      isRecovering: false,
      recoveryAttempts: 0,
      showDetails: false
    };

    this.errorRecoveryService = StructuralMatchingErrorRecoveryService.getInstance();
  }

  static getDerivedStateFromError(error: Error): Partial<StructuralMatchingErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('🚨 [ErrorBoundary] 捕获到错误:', error);
    
    this.setState({ errorInfo });
    
    // 调用自定义错误处理
    this.props.onError?.(error, errorInfo);
    
    // 处理错误恢复
    this.handleErrorRecovery(error, errorInfo);
  }

  /**
   * 处理错误恢复
   */
  private async handleErrorRecovery(error: Error, errorInfo: ErrorInfo): Promise<void> {
    const context = {
      component: this.props.componentName || 'StructuralMatchingErrorBoundary',
      operation: 'render',
      data: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      }
    };

    try {
      this.setState({ isRecovering: true });
      
      const recoveryResult = await this.errorRecoveryService.handleError(error, context, {
        enableFallback: true,
        maxRetries: 2
      });

      // 获取用户友好消息
      const structuredError = (this.errorRecoveryService as any).createStructuredError(error, context);
      const userFriendlyMessage = this.errorRecoveryService.getUserFriendlyMessage(structuredError);
      
      this.setState({
        structuredError,
        userFriendlyMessage,
        isRecovering: false,
        recoveryAttempts: this.state.recoveryAttempts + 1
      });

      // 调用恢复回调
      this.props.onRecovery?.(recoveryResult.success, recoveryResult.strategy);

      // 如果启用自动恢复且恢复成功，尝试重置组件
      if (this.props.enableAutoRecovery && recoveryResult.success) {
        setTimeout(() => {
          this.resetErrorBoundary();
        }, 2000);
      }

    } catch (recoveryError) {
      console.error('❌ [ErrorBoundary] 错误恢复失败:', recoveryError);
      this.setState({ isRecovering: false });
    }
  }

  /**
   * 重置错误边界
   */
  private resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      structuredError: null,
      userFriendlyMessage: null,
      isRecovering: false,
      showDetails: false
    });
  };

  /**
   * 手动重试
   */
  private handleRetry = (): void => {
    this.setState({ isRecovering: true });
    
    // 延迟重置以显示加载状态
    setTimeout(() => {
      this.resetErrorBoundary();
    }, 1000);
  };

  /**
   * 切换详情显示
   */
  private toggleDetails = (): void => {
    this.setState({ showDetails: !this.state.showDetails });
  };

  /**
   * 获取错误严重性图标
   */
  private getSeverityIcon(severity?: string): ReactNode {
    switch (severity) {
      case 'critical':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'high':
        return <WarningOutlined style={{ color: '#fa8c16' }} />;
      case 'medium':
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
      case 'low':
        return <InfoCircleOutlined style={{ color: '#52c41a' }} />;
      default:
        return <BugOutlined style={{ color: '#722ed1' }} />;
    }
  }

  /**
   * 获取严重性标签颜色
   */
  private getSeverityColor(severity?: string): string {
    switch (severity) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'blue';
      case 'low': return 'green';
      default: return 'purple';
    }
  }

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { 
      showErrorDetails = false,
      fallback,
      className 
    } = this.props;

    const { 
      error, 
      errorInfo, 
      structuredError, 
      userFriendlyMessage, 
      isRecovering,
      recoveryAttempts,
      showDetails 
    } = this.state;

    // 如果提供了降级内容，优先使用
    if (fallback && !userFriendlyMessage) {
      return <div className={className}>{fallback}</div>;
    }

    // 渲染用户友好的错误界面
    return (
      <div className={`structural-matching-error-boundary ${className || ''}`.trim()}>
        <Card 
          style={{ margin: '16px', maxWidth: '800px' }}
          styles={{ body: { padding: '24px' } }}
        >
          {/* 错误标题和图标 */}
          <Space align="start" style={{ marginBottom: '16px' }}>
            {this.getSeverityIcon(structuredError?.severity)}
            <div>
              <Title level={4} style={{ margin: 0, color: '#ff4d4f' }}>
                {userFriendlyMessage?.title || '系统错误'}
              </Title>
              {structuredError && (
                <Space size="small" style={{ marginTop: '4px' }}>
                  <Tag color={this.getSeverityColor(structuredError.severity)}>
                    {structuredError.severity?.toUpperCase()}
                  </Tag>
                  <Tag color="default">
                    {structuredError.category}
                  </Tag>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    错误代码: {structuredError.code}
                  </Text>
                </Space>
              )}
            </div>
          </Space>

          {/* 错误描述 */}
          <Paragraph style={{ marginBottom: '16px', fontSize: '14px' }}>
            {userFriendlyMessage?.description || error?.message || '发生了未知错误'}
          </Paragraph>

          {/* 建议和操作 */}
          {userFriendlyMessage?.suggestion && (
            <Alert
              message={userFriendlyMessage.suggestion}
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />
          )}

          {/* 恢复状态提示 */}
          {isRecovering && (
            <Alert
              message="正在尝试自动恢复..."
              type="warning"
              showIcon
              style={{ marginBottom: '16px' }}
            />
          )}

          {recoveryAttempts > 0 && !isRecovering && (
            <Alert
              message={`已尝试自动恢复 ${recoveryAttempts} 次`}
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />
          )}

          {/* 操作按钮 */}
          <Space wrap style={{ marginBottom: '16px' }}>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={this.handleRetry}
              loading={isRecovering}
            >
              重试
            </Button>
            
            {userFriendlyMessage?.actionButton && (
              <Button
                onClick={userFriendlyMessage.actionButton.action}
                disabled={isRecovering}
              >
                {userFriendlyMessage.actionButton.text}
              </Button>
            )}

            {(showErrorDetails || error) && (
              <Button
                type="text"
                icon={<BugOutlined />}
                onClick={this.toggleDetails}
              >
                {showDetails ? '隐藏' : '显示'}技术详情
              </Button>
            )}

            {userFriendlyMessage?.learnMoreUrl && (
              <Button
                type="link"
                href={userFriendlyMessage.learnMoreUrl}
                target="_blank"
              >
                了解更多
              </Button>
            )}
          </Space>

          {/* 技术详情（可折叠） */}
          {showDetails && (showErrorDetails || error) && (
            <Collapse 
              ghost
              items={[
                {
                  key: 'technical-details',
                  label: (
                    <Space>
                      <BugOutlined />
                      <span>技术详情</span>
                    </Space>
                  ),
                  children: (
                    <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
                      {/* 错误消息 */}
                      {error && (
                        <div style={{ marginBottom: '12px' }}>
                          <Text strong>错误消息:</Text>
                          <pre style={{ 
                            marginTop: '4px', 
                            fontSize: '12px', 
                            color: '#ff4d4f',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word'
                          }}>
                            {error.message}
                          </pre>
                        </div>
                      )}

                      {/* 组件堆栈 */}
                      {errorInfo?.componentStack && (
                        <div style={{ marginBottom: '12px' }}>
                          <Text strong>组件堆栈:</Text>
                          <pre style={{ 
                            marginTop: '4px', 
                            fontSize: '11px', 
                            color: '#666',
                            maxHeight: '150px',
                            overflow: 'auto',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {errorInfo.componentStack}
                          </pre>
                        </div>
                      )}

                      {/* 错误堆栈 */}
                      {error?.stack && (
                        <div>
                          <Text strong>错误堆栈:</Text>
                          <pre style={{ 
                            marginTop: '4px', 
                            fontSize: '11px', 
                            color: '#666',
                            maxHeight: '200px',
                            overflow: 'auto',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {error.stack}
                          </pre>
                        </div>
                      )}
                    </div>
                  )
                }
              ]}
            />
          )}
        </Card>
      </div>
    );
  }
}

/**
 * 高阶组件：为组件添加错误边界
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<StructuralMatchingErrorBoundaryProps, 'children'>
) {
  const WithErrorBoundaryComponent = (props: P) => (
    <StructuralMatchingErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </StructuralMatchingErrorBoundary>
  );

  WithErrorBoundaryComponent.displayName = 
    `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundaryComponent;
}

/**
 * Hook版本的错误边界
 */
export function useErrorBoundary() {
  const { emit } = useStructuralMatchingEvents({ 
    componentId: 'useErrorBoundary',
    enableDebugLogs: false 
  });

  const reportError = React.useCallback((error: Error, context?: Record<string, unknown>) => {
    emit('ERROR_OCCURRED', {
      error: {
        code: 'HOOK_ERROR',
        message: error.message,
        stack: error.stack,
        severity: 'medium'
      },
      context: {
        component: 'useErrorBoundary',
        operation: 'manual_report',
        data: context
      }
    });
  }, [emit]);

  return { reportError };
}

export default StructuralMatchingErrorBoundary;