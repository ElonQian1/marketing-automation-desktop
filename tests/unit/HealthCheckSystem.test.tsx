// tests/unit/HealthCheckSystem.test.tsx
// module: health-check | layer: unit-tests | role: 健康检查系统单元测试
// summary: 测试健康检查组件的核心功能和状态管理

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import HealthCheckSystem from '../../src/components/HealthCheckSystem';
import * as backendHealthCheck from '../../src/services/backend-health-check';
import { EVENTS } from '../../src/shared/constants/events';

// Mock Ant Design components
vi.mock('antd', () => ({
  Card: ({ children, title, extra }: any) => (
    <div data-testid="health-check-card">
      <div data-testid="card-title">{title}</div>
      <div data-testid="card-extra">{extra}</div>
      {children}
    </div>
  ),
  Space: ({ children }: any) => <div data-testid="space">{children}</div>,
  Typography: {
    Title: ({ children }: any) => <h5 data-testid="title">{children}</h5>,
    Text: ({ children, strong, type }: any) => (
      <span data-testid="text" className={`${strong ? 'strong' : ''} ${type ? `type-${type}` : ''}`}>
        {children}
      </span>
    )
  },
  Alert: ({ type, message }: any) => (
    <div data-testid="alert" className={`alert-${type}`}>
      {message}
    </div>
  ),
  Spin: ({ size }: any) => <div data-testid="spin" className={`spin-${size}`} />,
  Descriptions: ({ children, size, column, bordered }: any) => (
    <div data-testid="descriptions" className={`descriptions-${size}`}>
      {children}
    </div>
  ),
  Badge: ({ status, text }: any) => (
    <span data-testid="badge" className={`badge-${status}`}>
      {text}
    </span>
  ),
  Statistic: ({ title, value, suffix, valueStyle }: any) => (
    <div data-testid="statistic">
      <div data-testid="statistic-title">{title}</div>
      <div data-testid="statistic-value" style={valueStyle}>
        {value}{suffix}
      </div>
    </div>
  ),
  Row: ({ children }: any) => <div data-testid="row">{children}</div>,
  Col: ({ children }: any) => <div data-testid="col">{children}</div>
}));

// Mock UI components
vi.mock('../../src/components/ui', () => ({
  Button: ({ children, onClick, loading, size, icon }: any) => (
    <button
      data-testid="button"
      onClick={onClick}
      className={loading ? 'loading' : ''}
      disabled={loading}
    >
      {icon} {children}
    </button>
  )
}));

// Mock message hook
vi.mock('../../src/hooks/useMessage', () => ({
  useMessage: () => ({
    message: {
      error: vi.fn(),
      success: vi.fn(),
      info: vi.fn()
    }
  })
}));

// Mock backend health check service
const mockCheckBackendHealth = vi.fn();
const mockGetBackendHealthStatus = vi.fn();

vi.mock('../../src/services/backend-health-check', () => ({
  checkBackendHealth: mockCheckBackendHealth,
  getBackendHealthStatus: mockGetBackendHealthStatus,
  backendHealthChecker: {}
}));

describe('HealthCheckSystem', () => {
  const mockHealthResult = {
    isHealthy: true,
    message: '后端服务正常',
    responseTime: 150,
    endpoint: '/api/health',
    version: '1.0.0'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckBackendHealth.mockResolvedValue(mockHealthResult);
    mockGetBackendHealthStatus.mockResolvedValue({ status: 'healthy' });
    
    // Mock window.dispatchEvent
    global.window.dispatchEvent = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('应该正确渲染健康检查组件', () => {
    render(<HealthCheckSystem autoCheckOnMount={false} />);
    
    const healthCheckCard = screen.getByTestId('health-check-card');
    const title = screen.getByTestId('title');
    const button = screen.getByTestId('button');
    
    expect(healthCheckCard).toBeDefined();
    expect(title.textContent).toBe('后端健康状态');
    expect(button.textContent?.includes('手动检查')).toBe(true);
  });

  it('首屏加载时应该自动执行健康检查', async () => {
    render(<HealthCheckSystem autoCheckOnMount={true} />);
    
    await waitFor(() => {
      expect(mockCheckBackendHealth).toHaveBeenCalledTimes(1);
      expect(mockGetBackendHealthStatus).toHaveBeenCalledTimes(1);
    });
  });

  it('禁用首屏自动检查时不应该执行检查', () => {
    render(<HealthCheckSystem autoCheckOnMount={false} />);
    
    expect(mockCheckBackendHealth).not.toHaveBeenCalled();
    expect(mockGetBackendHealthStatus).not.toHaveBeenCalled();
  });

  it('点击手动检查按钮应该触发健康检查', async () => {
    render(<HealthCheckSystem autoCheckOnMount={false} />);
    
    const checkButton = screen.getByTestId('button');
    fireEvent.click(checkButton);
    
    await waitFor(() => {
      expect(mockCheckBackendHealth).toHaveBeenCalledTimes(1);
    });
  });

  it('健康检查成功时应该显示成功状态', async () => {
    render(<HealthCheckSystem autoCheckOnMount={false} />);
    
    const checkButton = screen.getByTestId('button');
    fireEvent.click(checkButton);
    
    await waitFor(() => {
      const alert = screen.getByTestId('alert');
      expect(alert.className).toContain('alert-success');
      expect(alert.textContent?.includes('后端服务正常')).toBe(true);
    });
    
    const badge = screen.getByTestId('badge');
    expect(badge.className).toContain('badge-success');
    expect(badge.textContent).toBe('健康');
  });

  it('健康检查失败时应该显示错误状态', async () => {
    const errorResult = {
      isHealthy: false,
      message: '后端服务异常',
      responseTime: 0,
      endpoint: '/api/health'
    };
    
    mockCheckBackendHealth.mockResolvedValueOnce(errorResult);
    
    render(<HealthCheckSystem autoCheckOnMount={false} />);
    
    const checkButton = screen.getByTestId('button');
    fireEvent.click(checkButton);
    
    await waitFor(() => {
      const alert = screen.getByTestId('alert');
      expect(alert).toHaveClass('alert-error');
      expect(alert).toHaveTextContent('后端服务异常');
    });
    
    expect(screen.getByTestId('badge')).toHaveClass('badge-error');
    expect(screen.getByTestId('badge')).toHaveTextContent('异常');
  });

  it('网络错误时应该显示错误状态', async () => {
    mockCheckBackendHealth.mockRejectedValueOnce(new Error('网络连接失败'));
    
    render(<HealthCheckSystem autoCheckOnMount={false} />);
    
    const checkButton = screen.getByTestId('button');
    fireEvent.click(checkButton);
    
    await waitFor(() => {
      const alert = screen.getByTestId('alert');
      expect(alert).toHaveClass('alert-error');
      expect(alert).toHaveTextContent('网络连接失败');
    });
  });

  it('检查中时应该显示loading状态', async () => {
    // 延迟Promise以捕获loading状态
    let resolvePromise: (value: any) => void;
    const delayedPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    mockCheckBackendHealth.mockReturnValueOnce(delayedPromise);
    
    render(<HealthCheckSystem autoCheckOnMount={false} />);
    
    const checkButton = screen.getByTestId('button');
    fireEvent.click(checkButton);
    
    // 验证loading状态
    expect(checkButton).toHaveClass('loading');
    expect(checkButton).toBeDisabled();
    
    expect(screen.getByTestId('badge')).toHaveClass('badge-processing');
    expect(screen.getByTestId('badge')).toHaveTextContent('检查中');
    
    // 完成Promise
    resolvePromise!(mockHealthResult);
    
    await waitFor(() => {
      expect(checkButton).not.toHaveClass('loading');
      expect(checkButton).not.toBeDisabled();
    });
  });

  it('应该正确显示响应时间和详细信息', async () => {
    render(<HealthCheckSystem autoCheckOnMount={false} showDetails={true} />);
    
    const checkButton = screen.getByTestId('button');
    fireEvent.click(checkButton);
    
    await waitFor(() => {
      const statistics = screen.getAllByTestId('statistic');
      const responseTimeStat = statistics.find(stat => 
        stat.querySelector('[data-testid="statistic-title"]')?.textContent === '响应时间'
      );
      
      expect(responseTimeStat).toBeInTheDocument();
      expect(responseTimeStat?.querySelector('[data-testid="statistic-value"]')).toHaveTextContent('150ms');
    });
    
    expect(screen.getByTestId('descriptions')).toBeInTheDocument();
  });

  it('隐藏详细信息时不应该显示详细面板', () => {
    render(<HealthCheckSystem autoCheckOnMount={false} showDetails={false} />);
    
    expect(screen.queryByTestId('descriptions')).not.toBeInTheDocument();
  });

  it('健康检查成功时应该触发成功事件', async () => {
    render(<HealthCheckSystem autoCheckOnMount={false} />);
    
    const checkButton = screen.getByTestId('button');
    fireEvent.click(checkButton);
    
    await waitFor(() => {
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EVENTS.HEALTH_CHECK_SUCCESS,
          detail: expect.objectContaining({
            result: mockHealthResult,
            timestamp: expect.any(Number)
          })
        })
      );
    });
  });

  it('健康检查失败时应该触发失败事件', async () => {
    mockCheckBackendHealth.mockRejectedValueOnce(new Error('服务异常'));
    
    render(<HealthCheckSystem autoCheckOnMount={false} />);
    
    const checkButton = screen.getByTestId('button');
    fireEvent.click(checkButton);
    
    await waitFor(() => {
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EVENTS.HEALTH_CHECK_FAILED,
          detail: expect.objectContaining({
            error: '服务异常',
            timestamp: expect.any(Number)
          })
        })
      );
    });
  });

  it('检查进行中时点击按钮不应该重复触发检查', async () => {
    let resolvePromise: (value: any) => void;
    const delayedPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    mockCheckBackendHealth.mockReturnValueOnce(delayedPromise);
    
    render(<HealthCheckSystem autoCheckOnMount={false} />);
    
    const checkButton = screen.getByTestId('button');
    
    // 第一次点击
    fireEvent.click(checkButton);
    expect(mockCheckBackendHealth).toHaveBeenCalledTimes(1);
    
    // 第二次点击（应该被忽略）
    fireEvent.click(checkButton);
    expect(mockCheckBackendHealth).toHaveBeenCalledTimes(1);
    
    // 完成检查
    resolvePromise!(mockHealthResult);
    
    await waitFor(() => {
      expect(checkButton).not.toBeDisabled();
    });
    
    // 现在第三次点击应该成功
    fireEvent.click(checkButton);
    expect(mockCheckBackendHealth).toHaveBeenCalledTimes(2);
  });

  it('应该正确格式化时间戳', async () => {
    render(<HealthCheckSystem autoCheckOnMount={false} />);
    
    const checkButton = screen.getByTestId('button');
    fireEvent.click(checkButton);
    
    await waitFor(() => {
      const statistics = screen.getAllByTestId('statistic');
      const timeStat = statistics.find(stat => 
        stat.querySelector('[data-testid="statistic-title"]')?.textContent === '最后检查时间'
      );
      
      expect(timeStat).toBeInTheDocument();
      // 验证时间格式（应该包含日期和时间）
      const timeValue = timeStat?.querySelector('[data-testid="statistic-value"]')?.textContent;
      expect(timeValue).toMatch(/\d{4}.*\d{2}.*\d{2}/); // 基本的日期格式检查
    });
  });
});