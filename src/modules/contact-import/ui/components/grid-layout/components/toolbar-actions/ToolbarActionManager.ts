/**
 * 工具栏动作管理器
 * 统一管理工具栏的所有功能实现，保持代码模块化
 */

import { message } from 'antd';
import type { PanelConfig } from '../../GridLayoutWrapper';

export interface ToolbarActionCallbacks {
  onPanelVisibilityChange: (panelId: string, visible: boolean) => void;
  onLayoutChange?: (layout: any[]) => void;
  onPerformanceModeChange?: (enabled: boolean) => void;
  onToolbarVisibilityChange?: (visible: boolean) => void;
}

export interface LayoutResetOptions {
  defaultLayout?: any[];
  resetToEqual?: boolean;
  showConfirmation?: boolean;
}

export class ToolbarActionManager {
  private callbacks: ToolbarActionCallbacks;
  private panels: PanelConfig[];

  constructor(panels: PanelConfig[], callbacks: ToolbarActionCallbacks) {
    this.panels = panels;
    this.callbacks = callbacks;
  }

  /**
   * 重置布局到默认状态
   */
  resetLayout = (options: LayoutResetOptions = {}) => {
    const { resetToEqual = true, showConfirmation = true } = options;

    const performReset = () => {
      try {
        if (resetToEqual) {
          // 创建平均分布的布局
          const cols = 12;
          const panelWidth = Math.floor(cols / this.panels.length);
          
          const defaultLayout = this.panels.map((panel, index) => ({
            i: panel.i,
            x: (index * panelWidth) % cols,
            y: 0,
            w: panelWidth,
            h: 4,
          }));

          this.callbacks.onLayoutChange?.(defaultLayout);
        }

        // 显示所有面板
        this.panels.forEach(panel => {
          if (!panel.visible) {
            this.callbacks.onPanelVisibilityChange(panel.i, true);
          }
        });

        message.success('布局已重置');
      } catch (error) {
        console.error('重置布局失败:', error);
        message.error('重置布局失败');
      }
    };

    if (showConfirmation) {
      // 这里可以添加确认对话框逻辑
      performReset();
    } else {
      performReset();
    }
  };

  /**
   * 切换性能模式
   */
  togglePerformanceMode = (currentEnabled: boolean) => {
    const newEnabled = !currentEnabled;
    this.callbacks.onPerformanceModeChange?.(newEnabled);
    
    message.success(
      newEnabled ? '性能模式已启用' : '性能模式已禁用',
      2
    );
  };

  /**
   * 隐藏工具栏
   */
  hideToolbar = () => {
    this.callbacks.onToolbarVisibilityChange?.(false);
    message.info('工具栏已隐藏，可通过快捷键 Ctrl+T 重新显示', 3);
  };

  /**
   * 应用布局预设
   */
  applyLayoutPreset = (presetName: string) => {
    const presets = this.getLayoutPresets();
    const preset = presets[presetName];
    
    if (preset) {
      this.callbacks.onLayoutChange?.(preset);
      message.success(`已应用 ${presetName} 布局`);
    } else {
      message.error('找不到指定的布局预设');
    }
  };

  /**
   * 获取布局预设
   */
  private getLayoutPresets = () => {
    const cols = 12;
    
    return {
      '三列等宽': this.panels.map((panel, index) => ({
        i: panel.i,
        x: (index * 4) % cols,
        y: 0,
        w: 4,
        h: 4,
      })),
      
      '左右分栏': this.panels.map((panel, index) => ({
        i: panel.i,
        x: index < 2 ? 0 : 6,
        y: index % 2 === 0 ? 0 : 4,
        w: 6,
        h: 4,
      })),
      
      '主次布局': this.panels.map((panel, index) => ({
        i: panel.i,
        x: index === 0 ? 0 : 8,
        y: index === 0 ? 0 : (index - 1) * 4,
        w: index === 0 ? 8 : 4,
        h: 4,
      })),
    };
  };

  /**
   * 获取可用的布局预设列表
   */
  getAvailablePresets = () => {
    return Object.keys(this.getLayoutPresets());
  };

  /**
   * 批量显示/隐藏面板
   */
  toggleAllPanels = (visible: boolean) => {
    this.panels.forEach(panel => {
      this.callbacks.onPanelVisibilityChange(panel.i, visible);
    });
    
    message.success(visible ? '所有面板已显示' : '所有面板已隐藏');
  };

  /**
   * 更新面板引用（当面板配置变化时调用）
   */
  updatePanels = (newPanels: PanelConfig[]) => {
    this.panels = newPanels;
  };
}