import { PointerSensor } from '@dnd-kit/core';

// 自定义 PointerSensor：在以下元素上禁止激活拖拽
// 1) data-dnd-ignore 标记
// 2) data-resize-handle 或 role=separator（列宽拖拽手柄）
// 3) 交互控件（input/textarea/select/button/a[href] 等）与常见 antd 控件
function shouldIgnoreDrag(target: EventTarget | null): boolean {
  const el = (target as HTMLElement) ?? null;
  if (!el) return false;

  const closest = (selector: string) => el.closest(selector);

  // 显式忽略标记
  if (closest('[data-dnd-ignore]')) return true;
  if (closest('[data-resize-handle]')) return true;
  if (closest('[role="separator"]')) return true;

  // 基础交互元素
  const tag = el.tagName?.toLowerCase();
  if (['input', 'textarea', 'select', 'button', 'label'].includes(tag)) return true;
  if (el.isContentEditable) return true;
  if (closest('a[href]')) return true;

  // 常见 antd 交互控件
  if (closest('.ant-select')) return true;
  if (closest('.ant-switch')) return true;
  if (closest('.ant-slider')) return true;
  if (closest('.ant-input-number')) return true;
  if (closest('.ant-checkbox')) return true;
  if (closest('.ant-radio')) return true;

  return false;
}

export class InteractivePointerSensor extends PointerSensor {
  // 通过自定义 activator 过滤不应激活拖拽的点击
  static activators = [
    {
      eventName: 'onPointerDown',
      handler: ({ nativeEvent }: { nativeEvent: PointerEvent }) => {
        // 仅左键
        if (nativeEvent.button !== 0) return false;
        // 忽略在交互/手柄元素上的拖拽激活
        if (shouldIgnoreDrag(nativeEvent.target)) return false;
        return true;
      },
    },
  ] as any;
}

export default InteractivePointerSensor;
