// 拖拽防护守卫 Hook - 防止表格列宽拖拽与全局拖拽冲突
// 专为联系人导入工作台优化，不重构现有代码

import { useEffect, useRef } from 'react';

export interface DragGuardOptions {
  /** 是否启用守卫 */
  enabled?: boolean;
  /** 需要保护的表格容器选择器 */
  tableSelectors?: string[];
  /** 调试模式 */
  debug?: boolean;
}

const DEFAULT_TABLE_SELECTORS = [
  '[data-testid="workbench-numbers-table"]',
  '[data-testid="batch-manager-numbers-table"]',
  '.ant-table-container',
  '.contact-import-table'
];

/**
 * 拖拽防护守卫 Hook
 * 通过事件拦截的方式防止表格列宽拖拽被全局拖拽劫持
 */
export function useGridDragGuards(options: DragGuardOptions = {}) {
  const {
    enabled = true,
    tableSelectors = DEFAULT_TABLE_SELECTORS,
    debug = false
  } = options;

  const guardRef = useRef<{
    cleanup: (() => void)[];
    isActive: boolean;
  }>({ cleanup: [], isActive: false });

  useEffect(() => {
    if (!enabled) return;

    const log = (...args: any[]) => {
      if (debug) console.log('[DragGuard]', ...args);
    };

    // 清理之前的监听器
    guardRef.current.cleanup.forEach(fn => fn());
    guardRef.current.cleanup = [];

    // 创建高优先级事件拦截器
    const createPointerInterceptor = () => {
      const interceptPointerDown = (e: PointerEvent) => {
        const target = e.target as HTMLElement;
        if (!target) return;

        // 检查是否点击了列宽拖拽手柄
        const isResizeHandle = target.closest('[data-resize-handle]') ||
          target.closest('[role="separator"]') ||
          target.hasAttribute('data-resize-handle') ||
          target.hasAttribute('data-dnd-ignore');

        if (isResizeHandle) {
          log('检测到列宽拖拽手柄，启动防护');
          
          // 阻止全局拖拽激活
          e.stopImmediatePropagation();
          
          // 标记防护状态
          guardRef.current.isActive = true;

          // 临时禁用页面级拖拽事件
          const disableDragEvents = (event: Event) => {
            if (guardRef.current.isActive) {
              event.stopImmediatePropagation();
              log('拦截拖拽事件:', event.type);
            }
          };

          // 监听可能的冲突事件
          const eventTypes = ['dragstart', 'drag', 'dragover', 'dragenter'];
          eventTypes.forEach(type => {
            document.addEventListener(type, disableDragEvents, {
              capture: true,
              passive: false
            });
          });

          // 监听指针释放，清理防护状态
          const cleanupOnRelease = () => {
            guardRef.current.isActive = false;
            eventTypes.forEach(type => {
              document.removeEventListener(type, disableDragEvents, { capture: true });
            });
            document.removeEventListener('pointerup', cleanupOnRelease);
            document.removeEventListener('pointercancel', cleanupOnRelease);
            log('列宽拖拽结束，解除防护');
          };

          document.addEventListener('pointerup', cleanupOnRelease, { once: true });
          document.addEventListener('pointercancel', cleanupOnRelease, { once: true });
        }
      };

      // 高优先级监听 pointerdown
      document.addEventListener('pointerdown', interceptPointerDown, {
        capture: true,  // 捕获阶段拦截
        passive: false  // 允许调用 preventDefault
      });

      return () => {
        document.removeEventListener('pointerdown', interceptPointerDown, { capture: true });
      };
    };

    // 创建表格区域特殊保护
    const createTableProtection = () => {
      const protectedTables = new Set<HTMLElement>();

      const findAndProtectTables = () => {
        tableSelectors.forEach(selector => {
          const tables = document.querySelectorAll(selector);
          tables.forEach((table) => {
            const htmlTable = table as HTMLElement;
            if (!protectedTables.has(htmlTable)) {
              protectedTables.add(htmlTable);
              
              // 为表格添加保护标记
              htmlTable.setAttribute('data-drag-protected', 'true');
              
              // 找到列宽手柄并加强保护
              const handles = htmlTable.querySelectorAll('[data-resize-handle], [role="separator"]');
              handles.forEach(handle => {
                (handle as HTMLElement).style.zIndex = '9999';
                handle.setAttribute('data-drag-priority', 'high');
              });

              log(`保护表格: ${selector}`);
            }
          });
        });
      };

      // 立即保护现有表格
      findAndProtectTables();

      // 监听DOM变化，保护新添加的表格
      const observer = new MutationObserver(() => {
        findAndProtectTables();
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      return () => {
        observer.disconnect();
        protectedTables.forEach(table => {
          table.removeAttribute('data-drag-protected');
        });
      };
    };

    // 启动防护系统
    guardRef.current.cleanup.push(
      createPointerInterceptor(),
      createTableProtection()
    );

    log('拖拽防护守卫已启动');

    return () => {
      guardRef.current.cleanup.forEach(fn => fn());
      guardRef.current.cleanup = [];
      guardRef.current.isActive = false;
      log('拖拽防护守卫已清理');
    };
  }, [enabled, debug, tableSelectors]);

  return {
    isGuardActive: guardRef.current.isActive,
    // 手动触发表格保护扫描
    refreshProtection: () => {
      // 触发重新扫描和保护
      const event = new CustomEvent('dragguard:refresh');
      document.dispatchEvent(event);
    }
  };
}

export default useGridDragGuards;
