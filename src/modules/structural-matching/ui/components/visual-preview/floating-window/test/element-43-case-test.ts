// src/modules/structural-matching/ui/components/visual-preview/floating-window/test/element-43-case-test.ts
// module: structural-matching | layer: ui | role: 测试用例
// summary: element_43案例的硬编码测试

import {
  correctElementBounds,
  recalculateChildElements,
} from "../utils/element-bounds-corrector";
import type { VisualUIElement } from "../../../../../../components/universal-ui/types/index";

/**
 * element_43 真实案例数据
 * 基于文档: docs\决策链\1.4.3、element_43架构分析.md
 * XML文件: debug_xml/ui_dump_e0d909c3_20251030_122312.xml
 */

// 模拟用户点击的element_43数据
const mockUserClickedElement = {
  id: "element_43",
  bounds: "[13,1158][534,2023]", // ✅ 修正为字符串格式
  position: {  // ✅ 添加position字段
    x: 13,
    y: 1158,
    width: 521, // 534-13
    height: 865 // 2023-1158
  },
  clickable: false, // ❌ 外层不可点击容器
  'content-desc': "笔记  深圳也太牛了，取消了！ 来自小何老师 55赞",
  className: "android.widget.FrameLayout", // class → className
  'long-clickable': true,
};

// 模拟第一个可点击的子元素（实际应该被点击的元素）
const mockActualClickableChild = {
  id: "clickable_child_0",
  bounds: "[13,1158][534,2023]", // ✅ 修正为字符串格式
  position: { // ✅ 添加position字段
    x: 13,
    y: 1158,
    width: 521,
    height: 865
  },
  clickable: true, // ✅ 真正可点击的子元素
  className: "android.widget.FrameLayout", // class → className
  'resource-id': "com.xingin.xhs:id/0_resource_name_obfuscated",
};

// 模拟子元素列表（包含在该区域内的所有子元素）
const mockChildElements: VisualUIElement[] = [
  {
    id: "image_container",
    text: "",
    description: "图片容器",
    type: "android.widget.FrameLayout",
    category: "others",
    position: { x: 13, y: 1158, width: 521, height: 694 },
    bounds: "[13,1158][534,1852]",
    clickable: false,
    importance: "low" as const,
    userFriendlyName: "图片容器",
    className: "android.widget.FrameLayout",
  },
  {
    id: "decoration_view",
    text: "",
    description: "装饰视图",
    type: "android.view.View",
    category: "others",
    position: { x: 39, y: 1876, width: 468, height: 45 },
    bounds: "[39,1876][507,1921]",
    clickable: false,
    importance: "low" as const,
    userFriendlyName: "装饰视图",
    className: "android.view.View",
  },
  {
    id: "author_info_bar",
    text: "",
    description: "作者信息栏",
    type: "android.view.ViewGroup",
    category: "buttons",
    position: { x: 13, y: 1921, width: 510, height: 102 },
    bounds: "[13,1921][523,2023]",
    clickable: true, // ✅ 作者信息栏可点击
    importance: "high" as const,
    userFriendlyName: "作者信息栏",
    className: "android.view.ViewGroup",
  },
  {
    id: "author_name",
    text: "小何老师", // ⭐ 正确的文本
    description: "作者姓名",
    type: "android.widget.TextView",
    category: "text",
    position: { x: 108, y: 1957, width: 286, height: 30 },
    bounds: "[108,1957][394,1987]",
    clickable: false,
    importance: "medium" as const,
    userFriendlyName: "小何老师",
    className: "android.widget.TextView",
  },
  {
    id: "like_button",
    text: "",
    description: "点赞按钮",
    type: "android.widget.ImageView",
    category: "buttons",
    position: { x: 394, y: 1933, width: 79, height: 79 },
    bounds: "[394,1933][473,2012]",
    clickable: true,
    importance: "high" as const,
    userFriendlyName: "点赞按钮",
    className: "android.widget.ImageView",
  },
  {
    id: "like_count",
    text: "55", // ⭐ 正确的点赞数
    description: "点赞数",
    type: "android.widget.TextView",
    category: "text",
    position: { x: 473, y: 1954, width: 34, height: 37 },
    bounds: "[473,1954][507,1991]",
    clickable: true,
    importance: "medium" as const,
    userFriendlyName: "55",
    className: "android.widget.TextView",
  },
];

// 模拟错误提取的文本（来自完全不同区域）
const mockWrongExtractedText = {
  text: "147", // ❌ 这个来自右上角完全不同的卡片
  bounds: { left: 990, top: 1014, right: 1040, bottom: 1051 }, // 右上角位置
  source: "不同的卡片 - 知恩的笔记",
};

// 模拟步骤卡数据
const mockStepCardData = {
  original_element: mockUserClickedElement,
  elementContext: {
    xpath: "//android.widget.FrameLayout[@clickable='false']",
    bounds: "[13,1158][534,2023]",
    text: "147", // ❌ 错误提取的文本（应该是"小何老师"）
    className: "android.widget.FrameLayout",
  },
};

// 模拟元素结构树数据（当前有问题的）
const mockCurrentElementTreeData = {
  rootElement: mockUserClickedElement, // 使用外层不可点击容器
  bounds: {
    x: 13,
    y: 1158,
    width: 534 - 13,
    height: 2023 - 1158,
  },
  childElements: mockChildElements,
};

/**
 * 测试边界校正功能
 */
export function testElementBoundsCorrection() {
  console.log("🧪 Testing element_43 bounds correction...");

  // 检测是否需要校正
  const needsCorrection = shouldCorrectBounds(
    mockStepCardData,
    mockCurrentElementTreeData
  );

  console.log("❓ Needs correction:", needsCorrection);

  if (needsCorrection) {
    // 执行校正
    const corrected = correctElementBounds(
      mockCurrentElementTreeData,
      mockStepCardData
    );

    console.log("✅ Corrected bounds:", corrected);

    // 重新计算子元素
    const recalculatedChildren = recalculateChildElements(
      mockChildElements, // allElements
      corrected.correctedBounds, // correctedBounds
      corrected.correctedRootElement.id // rootElementId
    );

    console.log("📋 Recalculated children:", recalculatedChildren);

    return {
      original: mockCurrentElementTreeData,
      corrected: corrected,
      children: recalculatedChildren,
    };
  }

  return { needsCorrection: false };
}

/**
 * 测试视口对齐计算
 */
export function testViewportAlignment() {
  console.log("🧪 Testing element_43 viewport alignment...");

  // 使用校正后的边界计算视口
  const correctionResult = testElementBoundsCorrection();

  if (correctionResult.corrected) {
    // 简化的视口计算测试
    const correctedBounds = correctionResult.corrected.correctedBounds;

    // 计算基于校正边界的视口窗口
    const padding = 20;
    const windowBounds = {
      left: correctedBounds.x - padding,
      top: correctedBounds.y - padding,
      right: correctedBounds.x + correctedBounds.width + padding,
      bottom: correctedBounds.y + correctedBounds.height + padding,
      width: correctedBounds.width + 2 * padding,
      height: correctedBounds.height + 2 * padding,
    };

    console.log("🎯 计算的视口:", windowBounds);

    // 验证视口是否完全包含目标元素
    const targetBounds = {
      left: 13,
      top: 1158,
      right: 534,
      bottom: 2023,
    };

    const containsTarget = isElementFullyContained(targetBounds, windowBounds);

    console.log("✅ 目标元素完全包含:", containsTarget);

    return {
      windowBounds,
      targetBounds,
      containsTarget,
      correctedBounds: correctionResult.corrected.correctedBounds,
    };
  }

  return null;
}

/**
 * 检查是否需要边界校正
 */
function shouldCorrectBounds(stepCardData: unknown, elementTreeData: unknown): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stepCard = stepCardData as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const treeData = elementTreeData as any;
  
  // ID不匹配检测
  const idMismatch =
    stepCard.targetElementId !== treeData.rootElement.id;

  // 边界差异检测
  const boundsDiff = calculateBoundsDifference(
    stepCard.targetBounds,
    treeData.bounds
  );

  // 可点击性检测
  const clickabilityIssue = !treeData.rootElement.clickable;

  console.log("🔍 Correction checks:", {
    idMismatch,
    boundsDiff,
    clickabilityIssue,
    shouldCorrect: boundsDiff > 50 || clickabilityIssue,
  });

  return boundsDiff > 50 || clickabilityIssue;
}

/**
 * 计算边界差异
 */
function calculateBoundsDifference(bounds1: { left: number; top: number; right: number; bottom: number }, bounds2: { left: number; top: number; right: number; bottom: number }): number {
  const width1 = bounds1.right - bounds1.left;
  const height1 = bounds1.bottom - bounds1.top;
  const width2 = bounds2.right - bounds2.left;
  const height2 = bounds2.bottom - bounds2.top;

  const widthDiff = Math.abs(width1 - width2);
  const heightDiff = Math.abs(height1 - height2);

  return Math.max(widthDiff, heightDiff);
}

/**
 * 检查元素是否完全包含在视口中
 */
function isElementFullyContained(
  elementBounds: { left: number; top: number; right: number; bottom: number },
  viewportBounds: { left: number; top: number; right: number; bottom: number }
): boolean {
  return (
    elementBounds.left >= viewportBounds.left &&
    elementBounds.top >= viewportBounds.top &&
    elementBounds.right <= viewportBounds.right &&
    elementBounds.bottom <= viewportBounds.bottom
  );
}

/**
 * 运行完整测试套件
 */
export function runElement43TestSuite() {
  console.log("🚀 Running element_43 test suite...");
  console.log('📍 Target: Left-bottom card with "小何老师" author');
  console.log("❌ Problem: Using outer non-clickable container");
  console.log("✅ Solution: Detect and use first clickable child");
  console.log("");

  // 测试1: 边界校正
  const correctionResult = testElementBoundsCorrection();

  // 测试2: 视口对齐
  const viewportResult = testViewportAlignment();

  // 测试3: 文本提取验证
  testTextExtraction();

  console.log("");
  console.log("📊 Test Results Summary:");
  console.log(
    "- Bounds correction:",
    correctionResult.needsCorrection !== false ? "✅" : "❌"
  );
  console.log("- Viewport alignment:", viewportResult ? "✅" : "❌");
  console.log(
    '- Expected to see: Complete "小何老师" card, not 1/4 of parent container'
  );

  return {
    boundsCorrection: correctionResult,
    viewportAlignment: viewportResult,
  };
}

/**
 * 测试文本提取正确性
 */
function testTextExtraction() {
  console.log("🧪 Testing text extraction...");

  // 检查错误的文本提取
  // 将字符串bounds转换为对象bounds用于测试
  const targetBounds = mockUserClickedElement.position ? {
    left: mockUserClickedElement.position.x,
    top: mockUserClickedElement.position.y,
    right: mockUserClickedElement.position.x + mockUserClickedElement.position.width,
    bottom: mockUserClickedElement.position.y + mockUserClickedElement.position.height
  } : { left: 0, top: 0, right: 0, bottom: 0 };
  
  const wrongTextInTargetArea = isTextInBounds(
    mockWrongExtractedText.bounds,
    targetBounds
  );

  console.log('❌ Wrong text "147" in target area:', wrongTextInTargetArea);
  console.log('📍 "147" actual location:', mockWrongExtractedText.bounds);
  console.log("📍 Target area:", mockUserClickedElement.bounds);

  // 检查正确的文本
  const correctTexts = mockChildElements
    .filter((el) => el.text)
    .map((el) => ({ text: el.text, bounds: el.bounds }));

  console.log("✅ Correct texts in target area:", correctTexts);
}

/**
 * 检查文本是否在指定边界内
 */
function isTextInBounds(textBounds: { left: number; top: number; right: number; bottom: number }, targetBounds: { left: number; top: number; right: number; bottom: number }): boolean {
  return (
    textBounds.left >= targetBounds.left &&
    textBounds.top >= targetBounds.top &&
    textBounds.right <= targetBounds.right &&
    textBounds.bottom <= targetBounds.bottom
  );
}

// 导出测试函数供调用
export const element43TestSuite = {
  runFullTest: runElement43TestSuite,
  testBoundsCorrection: testElementBoundsCorrection,
  testViewportAlignment: testViewportAlignment,
  mockData: {
    userClickedElement: mockUserClickedElement,
    actualClickableChild: mockActualClickableChild,
    childElements: mockChildElements,
    stepCardData: mockStepCardData,
    wrongExtractedText: mockWrongExtractedText,
  },
};
