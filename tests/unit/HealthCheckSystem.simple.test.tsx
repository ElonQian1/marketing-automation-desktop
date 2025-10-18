// tests/unit/HealthCheckSystem.simple.test.tsx
// module: health-check | layer: unit-tests | role: 健康检查系统基础单元测试
// summary: 测试健康检查组件的核心功能，使用基础DOM断言

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import HealthCheckSystem from '../../src/components/HealthCheckSystem';
import { EVENTS } from '../../src/shared/constants/events';

// Mock 所有外部依赖
vi.mock('antd', () => ({
  Card: ({ children, title, extra }: any) => (
    <div data-testid="health-check-card">
      <div data-testid="card-title">{title}</div>
      <div data-testid="card-extra">{extra}</div>
      {children}
    </div>
  ),
  Space: ({ children }: any) => <div>{children}</div>,
  Typography: {
    Title: ({ children }: any) => <h5>{children}</h5>,
    Text: ({ children }: any) => <span>{children}</span>
  },
  Alert: ({ type, message }: any) => (
    <div data-testid="alert" className={`alert-${type}`}>
      {typeof message === 'object' ? JSON.stringify(message) : message}
    </div>
  ),
  Spin: () => <div data-testid="spin" />,
  Descriptions: ({ children }: any) => <div data-testid="descriptions">{children}</div>,
  Badge: ({ status, text }: any) => (
    <span data-testid="badge" className={`badge-${status}`}>{text}</span>
  ),
  Statistic: ({ title, value }: any) => (
    <div data-testid="statistic">
      <div>{title}</div>
      <div>{value}</div>
    </div>
  ),
  Row: ({ children }: any) => <div>{children}</div>,
  Col: ({ children }: any) => <div>{children}</div>
}));

vi.mock('../../src/components/ui', () => ({
  Button: ({ children, onClick, loading }: any) => (
    <button
      data-testid="check-button"
      onClick={onClick}
      disabled={loading}
      className={loading ? 'loading' : ''}
    >
      {children}
    </button>
  )
}));

vi.mock('../../src/hooks/useMessage', () => ({
  useMessage: () => ({
    message: {
      error: vi.fn(),
      success: vi.fn()
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

describe('HealthCheckSystem 基础测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.window.dispatchEvent = vi.fn();
  });

  it('渲染基本组件结构', () => {
    render(<HealthCheckSystem autoCheckOnMount={false} />);
    
    expect(screen.getByTestId('health-check-card')).toBeDefined();
    expect(screen.getByTestId('check-button')).toBeDefined();
  });

  it('首屏自动检查功能', async () => {
    mockCheckBackendHealth.mockResolvedValue({
      isHealthy: true,
      message: '服务正常'
    });
    mockGetBackendHealthStatus.mockResolvedValue({ status: 'healthy' });

    render(<HealthCheckSystem autoCheckOnMount={true} />);
    
    await waitFor(() => {
      expect(mockCheckBackendHealth).toHaveBeenCalledTimes(1);
    });
  });

  it('禁用自动检查时不执行检查', () => {
    render(<HealthCheckSystem autoCheckOnMount={false} />);
    
    expect(mockCheckBackendHealth).not.toHaveBeenCalled();
  });

  it('手动检查按钮功能', async () => {
    mockCheckBackendHealth.mockResolvedValue({
      isHealthy: true,
      message: '服务正常'
    });
    mockGetBackendHealthStatus.mockResolvedValue({ status: 'healthy' });

    render(<HealthCheckSystem autoCheckOnMount={false} />);
    
    const button = screen.getByTestId('check-button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockCheckBackendHealth).toHaveBeenCalledTimes(1);
    });
  });

  it('健康检查成功状态', async () => {
    mockCheckBackendHealth.mockResolvedValue({
      isHealthy: true,
      message: '后端服务正常',
      responseTime: 150
    });
    mockGetBackendHealthStatus.mockResolvedValue({ status: 'healthy' });

    render(<HealthCheckSystem autoCheckOnMount={false} />);
    
    const button = screen.getByTestId('check-button');
    fireEvent.click(button);
    
    await waitFor(() => {
      const alert = screen.getByTestId('alert');
      expect(alert.className).toContain('alert-success');
    });
  });

  it('健康检查失败状态', async () => {
    mockCheckBackendHealth.mockResolvedValue({
      isHealthy: false,
      message: '后端服务异常'
    });

    render(<HealthCheckSystem autoCheckOnMount={false} />);
    
    const button = screen.getByTestId('check-button');
    fireEvent.click(button);
    
    await waitFor(() => {
      const alert = screen.getByTestId('alert');
      expect(alert.className).toContain('alert-error');
    });
  });

  it('网络错误处理', async () => {
    mockCheckBackendHealth.mockRejectedValue(new Error('网络错误'));

    render(<HealthCheckSystem autoCheckOnMount={false} />);
    
    const button = screen.getByTestId('check-button');
    fireEvent.click(button);
    
    await waitFor(() => {
      const alert = screen.getByTestId('alert');
      expect(alert.className).toContain('alert-error');
    });
  });

  it('事件系统集成 - 成功事件', async () => {
    const mockResult = {
      isHealthy: true,
      message: '服务正常',
      responseTime: 100
    };
    
    mockCheckBackendHealth.mockResolvedValue(mockResult);
    mockGetBackendHealthStatus.mockResolvedValue({ status: 'healthy' });

    render(<HealthCheckSystem autoCheckOnMount={false} />);
    
    const button = screen.getByTestId('check-button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(global.window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EVENTS.HEALTH_CHECK_SUCCESS
        })
      );
    });
  });

  it('事件系统集成 - 失败事件', async () => {
    mockCheckBackendHealth.mockRejectedValue(new Error('服务异常'));

    render(<HealthCheckSystem autoCheckOnMount={false} />);
    
    const button = screen.getByTestId('check-button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(global.window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EVENTS.HEALTH_CHECK_FAILED
        })
      );
    });
  });

  it('详细信息显示控制', () => {
    const { rerender } = render(<HealthCheckSystem showDetails={true} autoCheckOnMount={false} />);
    expect(screen.queryByTestId('descriptions')).toBeDefined();

    rerender(<HealthCheckSystem showDetails={false} autoCheckOnMount={false} />);
    expect(screen.queryByTestId('descriptions')).toBeNull();
  });

  it('防止重复检查', async () => {
    let resolvePromise: (value: any) => void;
    const delayedPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    mockCheckBackendHealth.mockReturnValue(delayedPromise);

    render(<HealthCheckSystem autoCheckOnMount={false} />);
    
    const button = screen.getByTestId('check-button');
    
    // 第一次点击
    fireEvent.click(button);
    expect(mockCheckBackendHealth).toHaveBeenCalledTimes(1);
    
    // 第二次点击（应该被忽略）
    fireEvent.click(button);
    expect(mockCheckBackendHealth).toHaveBeenCalledTimes(1);
    
    // 完成检查
    resolvePromise!({ isHealthy: true, message: '正常' });
    
    await waitFor(() => {
      expect((button as HTMLButtonElement).disabled).toBe(false);
    });
    
    // 现在可以再次检查
    fireEvent.click(button);
    expect(mockCheckBackendHealth).toHaveBeenCalledTimes(2);
  });
});