// src/components/MissingSnapshotDialog.tsx
// module: ui | layer: ui | role: 缺失快照对话框组件
// summary: 处理XML快照缺失时的用户选择对话框

import React from 'react';
import { Modal, message } from 'antd';
import XmlCacheManager from '../services/xml-cache-manager';

export interface MissingSnapshotDialogOptions {
  onRefreshSnapshot?: () => Promise<void>;
  onUseHistorySnapshot?: (cacheId: string) => Promise<void>;
  onCancel?: () => void;
}

/**
 * 显示缺失快照对话框的工具函数
 */
export function showMissingSnapshotDialog(
  stepId: string, 
  options: MissingSnapshotDialogOptions = {}
): void {
  const xmlCacheManager = XmlCacheManager.getInstance();
  const keys = xmlCacheManager.dumpKeys();
  
  Modal.confirm({
    title: '缺少XML快照',
    content: `未找到步骤的XML快照信息。可选择：重新抓取当前页面 / 使用历史快照（共 ${keys.ids.length} 个可用）/ 取消分析`,
    okText: '重新抓取当前页面',
    cancelText: '取消',
    width: 480,
    onOk: async () => {
      try {
        if (options.onRefreshSnapshot) {
          await options.onRefreshSnapshot();
        } else {
          message.info('重新抓取功能待实现，请手动刷新页面快照后重试');
        }
      } catch (error) {
        console.error('重新抓取快照失败:', error);
        message.error('重新抓取快照失败');
      }
    },
    onCancel: () => {
      // 如果有历史快照，提供使用选项
      if (keys.ids.length > 0) {
        showHistorySnapshotSelector(stepId, options);
      } else {
        options.onCancel?.();
      }
    }
  });
}

/**
 * 显示历史快照选择对话框
 */
function showHistorySnapshotSelector(
  stepId: string,
  options: MissingSnapshotDialogOptions
): void {
  const xmlCacheManager = XmlCacheManager.getInstance();
  const latest = xmlCacheManager.getLatestXmlCache();
  
  if (!latest) {
    message.warning('没有找到可用的历史快照');
    options.onCancel?.();
    return;
  }
  
  Modal.confirm({
    title: '使用历史快照',
    content: `找到最新的历史快照，是否使用它继续分析？\n快照ID: ${latest.cacheId}\n创建时间: ${new Date(latest.timestamp).toLocaleString()}`,
    okText: '使用此快照',
    cancelText: '取消',
    onOk: async () => {
      try {
        if (options.onUseHistorySnapshot) {
          await options.onUseHistorySnapshot(latest.cacheId);
          message.success(`已使用历史快照: ${latest.cacheId}`);
        } else {
          message.success(`已选择历史快照: ${latest.cacheId}`);
        }
      } catch (error) {
        console.error('使用历史快照失败:', error);
        message.error('使用历史快照失败');
      }
    },
    onCancel: () => {
      options.onCancel?.();
    }
  });
}

/**
 * React Hook 版本，返回显示对话框的函数
 */
export function useMissingSnapshotDialog() {
  const showDialog = React.useCallback((
    stepId: string, 
    options: MissingSnapshotDialogOptions = {}
  ) => {
    showMissingSnapshotDialog(stepId, options);
  }, []);
  
  return { showMissingSnapshotDialog: showDialog };
}