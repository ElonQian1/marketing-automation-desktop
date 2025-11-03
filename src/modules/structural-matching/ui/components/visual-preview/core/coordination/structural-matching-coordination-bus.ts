// src/modules/structural-matching/ui/components/visual-preview/core/coordination/structural-matching-coordination-bus.ts
// module: structural-matching | layer: ui | role: 事件总线
// summary: 在覆盖层与元素结构树之间进行轻量级联动（高亮/选择），避免窗口重绘与全局状态污染

export type CoordinationEventType =
  | "highlight" // 高亮某个元素（不改变选择，不重算裁剪）
  | "select"    // 选择某个元素（可能用于后续扩展）
  | "clear";    // 清除高亮

export interface CoordinationEvent {
  type: CoordinationEventType;
  elementId?: string | null;
  source?: "overlay" | "tree" | "unknown";
}

type Listener = (evt: CoordinationEvent) => void;

class StructuralMatchingCoordinationBus {
  private listeners = new Set<Listener>();
  private lastHighlightId: string | null = null;

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    // 立即推送当前高亮状态，便于新订阅方同步
    if (this.lastHighlightId) {
      listener({ type: "highlight", elementId: this.lastHighlightId, source: "unknown" });
    }
    return () => this.listeners.delete(listener);
  }

  emit(evt: CoordinationEvent) {
    if (evt.type === "highlight") {
      this.lastHighlightId = evt.elementId ?? null;
    }
    if (evt.type === "clear") {
      this.lastHighlightId = null;
    }
    this.listeners.forEach((l) => l(evt));
  }

  getCurrentHighlight() {
    return this.lastHighlightId;
  }
}

export const structuralMatchingCoordinationBus = new StructuralMatchingCoordinationBus();
