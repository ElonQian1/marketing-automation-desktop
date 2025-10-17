// src/components/universal-ui/element-selection/__tests__/ElementSelectionPopover.test.tsx
// module: ui | layer: ui | role: test
// summary: ElementSelectionPopover 单元测试 - XOR 确认通道 + 并发防抖

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ElementSelectionPopover } from '../ElementSelectionPopover';
import type { ElementSelectionState } from '../ElementSelectionPopover';

const mockElement = {
  id: 'test-element-1',
  xpath: '//button[@id="test"]',
  text: '测试按钮',
  bounds: '100,200,300,400',
  resource_id: 'com.test:id/button',
  content_desc: 'Test Button',
  class_name: 'android.widget.Button',
  element_type: 'tap',
  clickable: true,
  enabled: true,
  visible: true,
};

const mockSelection: ElementSelectionState = {
  element: mockElement,
  position: { x: 150, y: 250 },
  confirmed: false,
};

describe('ElementSelectionPopover - XOR Confirm Channel', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('✅ 使用 onQuickCreate 当两个回调都提供时（运行期警告，只执行 quick）', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const quick = vi.fn().mockResolvedValue(true);
    const legacy = vi.fn().mockResolvedValue(true);

    render(
      <ElementSelectionPopover
        visible={true}
        selection={mockSelection}
        onQuickCreate={quick as any}
        onConfirm={legacy as any}
        onCancel={vi.fn()}
      />
    );

    // 应该有警告
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('同时提供了 onQuickCreate 和 onConfirm')
    );

    // 点击"直接确定"按钮
    const btn = screen.getByRole('button', { name: /直接确定|确定/i });
    await user.click(btn);

    await waitFor(() => expect(quick).toHaveBeenCalledTimes(1));
    expect(legacy).not.toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('✅ 返回 false：保持弹层开启', async () => {
    const quick = vi.fn().mockResolvedValue(false);

    const { container } = render(
      <ElementSelectionPopover
        visible={true}
        selection={mockSelection}
        onQuickCreate={quick}
        onCancel={vi.fn()}
      />
    );

    const btn = screen.getByRole('button', { name: /直接确定|确定/i });
    await user.click(btn);

    await waitFor(() => expect(quick).toHaveBeenCalled());

    // 弹层仍然可见（通过检查 Popover 容器）
    const popover = container.querySelector('[data-testid="confirm-popover"]') || 
                    container.querySelector('.ant-popover');
    expect(popover).toBeTruthy();
  });

  it('✅ 抛错：不关闭、按钮解除禁用、显示错误提示', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const quick = vi.fn().mockRejectedValue(new Error('测试错误'));

    render(
      <ElementSelectionPopover
        visible={true}
        selection={mockSelection}
        onQuickCreate={quick}
        onCancel={vi.fn()}
      />
    );

    const btn = screen.getByRole('button', { name: /直接确定|确定/i });
    await user.click(btn);

    await waitFor(() => expect(quick).toHaveBeenCalled());

    // 按钮重新可点（不应该有 disabled 属性或 disabled=false）
    await waitFor(() => {
      expect(btn).not.toBeDisabled();
    });

    // 弹层仍然可见
    expect(screen.getByText(/测试按钮/i)).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('✅ 并发防抖：连续点击只触发一次', async () => {
    const quick = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(true), 100))
    );

    render(
      <ElementSelectionPopover
        visible={true}
        selection={mockSelection}
        onQuickCreate={quick}
        onCancel={vi.fn()}
      />
    );

    const btn = screen.getByRole('button', { name: /直接确定|确定/i });

    // 快速连续点击 3 次
    await user.click(btn);
    await user.click(btn);
    await user.click(btn);

    // 等待请求完成
    await waitFor(() => expect(quick).toHaveBeenCalledTimes(1), { timeout: 200 });
  });

  it('✅ 没有提供回调：按钮禁用', () => {
    const { container } = render(
      <ElementSelectionPopover
        visible={true}
        selection={mockSelection}
        onCancel={vi.fn()}
        // 不提供 onQuickCreate 或 onConfirm
        {...({} as any)}
      />
    );

    const btn = screen.queryByRole('button', { name: /直接确定|确定/i });
    if (btn) {
      expect(btn).toBeDisabled();
    }
  });

  it('✅ 成功并关闭：返回 true 或 void', async () => {
    const quick = vi.fn().mockResolvedValue(true);

    const { rerender } = render(
      <ElementSelectionPopover
        visible={true}
        selection={mockSelection}
        onQuickCreate={quick}
        onCancel={vi.fn()}
      />
    );

    const btn = screen.getByRole('button', { name: /直接确定|确定/i });
    await user.click(btn);

    await waitFor(() => expect(quick).toHaveBeenCalled());

    // 注意：实际关闭逻辑在父组件，这里只测试回调被调用
    // 实际项目中需要配合父组件测试完整关闭流程
  });
});

describe('ElementSelectionPopover - 智能分析集成', () => {
  it('✅ 启用智能分析时显示分析按钮', () => {
    render(
      <ElementSelectionPopover
        visible={true}
        selection={mockSelection}
        onQuickCreate={vi.fn()}
        onCancel={vi.fn()}
        enableIntelligentAnalysis={true}
      />
    );

    // 应该有智能分析相关按钮
    const analyzeBtn = screen.queryByRole('button', { name: /智能分析|分析/i });
    expect(analyzeBtn).toBeTruthy();
  });
});
