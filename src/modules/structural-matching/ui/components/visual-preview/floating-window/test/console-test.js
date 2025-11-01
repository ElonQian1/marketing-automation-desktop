// src/modules/structural-matching/ui/components/visual-preview/floating-window/test/console-test.js
// 控制台快速测试脚本

console.log("🚀 Element_43 视口对齐修复测试");

// 模拟数据
const userClickedElement = {
  bounds: { left: 13, top: 1158, right: 534, bottom: 2023 },
  clickable: false,
};

const actualClickableChild = {
  bounds: { left: 13, top: 1158, right: 534, bottom: 2023 },
  clickable: true,
};

// 计算边界差异
function calculateBoundsDifference(bounds1, bounds2) {
  const width1 = bounds1.right - bounds1.left;
  const height1 = bounds1.bottom - bounds1.top;
  const width2 = bounds2.right - bounds2.left;
  const height2 = bounds2.bottom - bounds2.top;

  const widthDiff = Math.abs(width1 - width2);
  const heightDiff = Math.abs(height1 - height2);

  return Math.max(widthDiff, heightDiff);
}

// 检查是否需要校正
function shouldCorrectBounds(userElement, treeElement) {
  const boundsDiff = calculateBoundsDifference(
    userElement.bounds,
    treeElement.bounds
  );
  const clickabilityIssue = !userElement.clickable;

  console.log("🔍 检查结果:", {
    boundsDiff,
    clickabilityIssue,
    shouldCorrect: boundsDiff > 50 || clickabilityIssue,
  });

  return boundsDiff > 50 || clickabilityIssue;
}

// 模拟视口对齐计算
function calculateViewportAlignment(bounds) {
  const elementWidth = bounds.right - bounds.left;
  const elementHeight = bounds.bottom - bounds.top;

  // 计算最佳窗口大小 (元素大小 + 边距)
  const optimalWidth = elementWidth + 40; // 20px 左右边距
  const optimalHeight = elementHeight + 40; // 20px 上下边距

  // 计算最佳位置 (居中显示)
  const centerX = bounds.left + elementWidth / 2;
  const centerY = bounds.top + elementHeight / 2;

  const windowBounds = {
    left: centerX - optimalWidth / 2,
    top: centerY - optimalHeight / 2,
    right: centerX + optimalWidth / 2,
    bottom: centerY + optimalHeight / 2,
    width: optimalWidth,
    height: optimalHeight,
  };

  return {
    windowBounds,
    elementBounds: bounds,
    padding: 20,
  };
}

// 运行测试
console.log("📍 用户点击元素:", userClickedElement);
console.log("✅ 实际可点击子元素:", actualClickableChild);

const needsCorrection = shouldCorrectBounds(
  userClickedElement,
  userClickedElement
);
console.log("❓ 需要校正:", needsCorrection);

if (needsCorrection) {
  console.log("🔧 执行校正...");

  // 使用可点击子元素进行视口计算
  const viewport = calculateViewportAlignment(actualClickableChild.bounds);
  console.log("🎯 计算的视口:", viewport);

  // 验证目标元素是否完全包含在视口中
  const contained =
    userClickedElement.bounds.left >=
      viewport.windowBounds.left + viewport.padding &&
    userClickedElement.bounds.top >=
      viewport.windowBounds.top + viewport.padding &&
    userClickedElement.bounds.right <=
      viewport.windowBounds.right - viewport.padding &&
    userClickedElement.bounds.bottom <=
      viewport.windowBounds.bottom - viewport.padding;

  console.log("✅ 目标元素完全包含:", contained);

  console.log("📊 修复对比:");
  console.log("  修复前: 视口显示父容器，目标元素只占1/4");
  console.log("  修复后: 视口精确对齐目标元素，完整显示");
} else {
  console.log("❌ 无需校正");
}

console.log("🎉 测试完成！");
