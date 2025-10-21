// src/modules/loop-drag-integration/LoopDragIntegration.tsx
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

// 循环体拖拽集成组件 - 支持拖拽步骤到循环体内

import React, { useMemo, useCallback } from "react";
import { Card, Typography, Space } from "antd";
import { DragSortContainer } from "../drag-sort/components/DragSortContainer";
import { DraggableStepCard } from "../../components/DraggableStepCard";
import { useDragSort } from "../drag-sort/hooks/useDragSort";
import { useLoopControl } from "../loop-control/hooks/useLoopControl";

import type {
  DraggableItem,
  DroppableArea,
  DragResult,
} from "../drag-sort/types";
import type {
  ExtendedSmartScriptStep,
  LoopConfig,
} from "../loop-control/types";

const { Title } = Typography;

export interface LoopDragIntegrationProps {
  /** 步骤列表 */
  steps: ExtendedSmartScriptStep[];
  /** 步骤更新回调 */
  onStepsChange: (steps: ExtendedSmartScriptStep[]) => void;
  /** 循环配置更新回调 */
  onLoopConfigChange?: (stepId: string, config: LoopConfig) => void;
  /** 自定义步骤渲染函数 */
  renderStep?: (
    step: ExtendedSmartScriptStep,
    isDragging?: boolean
  ) => React.ReactNode;
}

export const LoopDragIntegration: React.FC<LoopDragIntegrationProps> = ({
  steps,
  onStepsChange,
  onLoopConfigChange,
  renderStep,
}) => {
  // 转换步骤为拖拽项目
  const draggableItems: DraggableItem[] = useMemo(() => {
    return steps.map((step, index) => ({
      id: step.id,
      type: step.step_type,
      containerId: step.parentLoopId || "main",
      position: index,
      data: step,
    }));
  }, [steps]);

  // 定义拖拽区域
  const droppableAreas: DroppableArea[] = useMemo(() => {
    const areas: DroppableArea[] = [
      {
        id: "main",
        title: "主流程",
        type: "default",
        emptyText: "拖拽步骤到此处",
        backgroundColor: "var(--bg-elevated)",
      },
    ];

    // 为每个循环开始步骤创建循环体区域
    steps.forEach((step) => {
      if (step.step_type === "loop_start") {
        areas.push({
          id: `loop-${step.id}`,
          title: `循环体 - ${step.name || "未命名循环"}`,
          type: "loop",
          emptyText: "拖拽步骤到循环体内",
          backgroundColor: "#f0f8ff",
          hoverBackgroundColor: "#e6f4ff",
        });
      }
    });

    return areas;
  }, [steps]);

  // 循环控制Hook
  const loopControl = useLoopControl({});

  // 拖拽排序Hook
  const dragSort = useDragSort({
    initialItems: draggableItems,
    droppableAreas,
    config: {
      allowCrossContainer: true,
      allowIntoLoop: true,
      allowOutOfLoop: true,
    },
    onDragComplete: handleDragComplete,
    onValidateDrag: handleValidateDrag,
  });

  // 拖拽完成处理
  function handleDragComplete(items: DraggableItem[], result: DragResult) {
    const updatedSteps = items
      .sort((a, b) => (a.position || 0) - (b.position || 0))
      .map((item) => {
        const step = item.data as ExtendedSmartScriptStep;
        return {
          ...step,
          parentLoopId:
            item.containerId === "main"
              ? undefined
              : item.containerId?.replace("loop-", ""),
        };
      });

    onStepsChange(updatedSteps);
  }

  // 拖拽验证
  function handleValidateDrag(
    item: DraggableItem,
    targetContainer: string
  ): boolean {
    const step = item.data as ExtendedSmartScriptStep;

    // 循环开始/结束步骤不能拖入循环体
    if (
      targetContainer.startsWith("loop-") &&
      (step.step_type === "loop_start" || step.step_type === "loop_end")
    ) {
      return false;
    }

    // 不能拖入自己创建的循环体
    if (targetContainer === `loop-${step.id}`) {
      return false;
    }

    return true;
  }

  // 默认步骤渲染函数
  const defaultRenderStep = useCallback(
    (step: ExtendedSmartScriptStep, isDragging = false) => {
      if (step.step_type === "loop_start" || step.step_type === "loop_end") {
        return (
          <DraggableStepCard
            step={step}
            index={0}
            isDragging={isDragging}
            devices={[]}
            onEdit={() => {}}
            onDelete={() => {}}
            onToggle={() => {}}
            style={{
              opacity: isDragging ? 0.5 : 1,
              transform: isDragging ? "rotate(5deg)" : undefined,
              cursor: isDragging ? "grabbing" : "grab",
            }}
          />
        );
      }

      // 普通步骤卡片
      return (
        <DraggableStepCard
          step={step}
          index={0}
          isDragging={isDragging}
          devices={[]}
          onEdit={() => {}}
          onDelete={() => {}}
          onToggle={() => {}}
          style={{
            marginBottom: 8,
            opacity: isDragging ? 0.5 : 1,
            transform: isDragging ? "rotate(5deg)" : undefined,
            cursor: isDragging ? "grabbing" : "grab",
          }}
        />
      );
    },
    [loopControl]
  );

  // 渲染项目函数
  const renderItem = useCallback(
    (item: DraggableItem, isDragging = false) => {
      const step = item.data as ExtendedSmartScriptStep;
      return renderStep
        ? renderStep(step, isDragging)
        : defaultRenderStep(step, isDragging);
    },
    [renderStep, defaultRenderStep]
  );

  return (
    <div className="loop-drag-integration">
      <Title level={4} style={{ marginBottom: 16 }}>
        智能脚本编辑器 - 循环体拖拽
      </Title>

      <Space
        direction="vertical"
        size={16}
        style={{ width: "100%", marginBottom: 16 }}
      >
        <Card size="small" style={{ backgroundColor: "#f6ffed" }}>
          <Space>
            <span style={{ color: "#52c41a" }}>💡 使用提示:</span>
            <span>
              拖拽步骤到循环体内可组织执行顺序，循环开始/结束步骤不能拖入循环体
            </span>
          </Space>
        </Card>
      </Space>

      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Card>
          <Space style={{ marginBottom: 16 }}>
            <button
              onClick={() => {
                console.log("添加循环功能暂不可用");
              }}
              style={{
                padding: "6px 12px",
                backgroundColor: "#1890ff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              + 添加循环
            </button>
            <button
              onClick={() => dragSort.reset()}
              style={{
                padding: "var(--space-1) var(--space-3)",
                backgroundColor: "var(--bg-elevated)",
                color: "var(--text-2)",
                border: "1px solid var(--border-primary)",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
              }}
            >
              重置布局
            </button>
          </Space>

          <DragSortContainer
            items={dragSort.items}
            droppableAreas={droppableAreas}
            onDragEnd={dragSort.handleDragEnd}
            onDragStart={() => dragSort.setDragging(true)}
            renderItem={renderItem}
            disabled={false}
          />
        </Card>
      </Space>
    </div>
  );
};

export default LoopDragIntegration;
