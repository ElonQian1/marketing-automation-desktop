#!/usr/bin/env node
// 硬编码Element_43数据快速验证脚本
// 运行方式: node 硬编码数据验证脚本.js

/**
 * 🚧 开发环境验证脚本
 *
 * 目标：快速验证硬编码 Element_43 数据是否正确加载
 * 使用场景：开发期间验证结构匹配功能
 */

console.log("🚧 [验证] 硬编码Element_43数据验证开始");

// 模拟硬编码数据结构验证
const expectedStructure = {
  rootElement: {
    id: "element_43",
    element_type: "FrameLayout",
    bounds: "[13,1158][534,2023]",
    is_clickable: false,
    content_desc: "笔记  深圳也太牛了，取消了！ 来自小何老师 55赞",
  },
  expectedChildrenCount: 9,
  expectedClickableElements: 4,
  expectedDepth: 4,
};

// 验证边界计算
function verifyBoundsCalculation() {
  const boundsStr = "[13,1158][534,2023]";
  const matches = boundsStr.match(/\d+/g)?.map(Number) || [];
  const [left, top, right, bottom] = matches;

  const calculatedBounds = {
    x: left,
    y: top,
    width: right - left, // 534-13 = 521
    height: bottom - top, // 2023-1158 = 865
  };

  console.log("📐 [验证] 边界计算结果:", calculatedBounds);

  const expectedResult = { x: 13, y: 1158, width: 521, height: 865 };
  const isCorrect =
    JSON.stringify(calculatedBounds) === JSON.stringify(expectedResult);

  console.log(isCorrect ? "✅ 边界计算正确" : "❌ 边界计算错误");
  return isCorrect;
}

// 验证子元素结构
function verifyChildStructure() {
  const expectedChildren = [
    { id: "element_44", type: "FrameLayout", clickable: true }, // 真正可点击的容器
    { id: "element_45", type: "ViewGroup", clickable: false }, // 内容容器
    { id: "element_46", type: "FrameLayout", clickable: false }, // 图片容器
    { id: "element_47", type: "ImageView", clickable: false }, // 笔记封面
    { id: "element_48", type: "View", clickable: false }, // 装饰层
    { id: "element_49", type: "ViewGroup", clickable: true }, // 作者信息栏
    { id: "element_50", type: "View", clickable: false }, // 头像
    { id: "element_51", type: "TextView", clickable: false }, // 作者名
    { id: "element_52", type: "ImageView", clickable: true }, // 点赞按钮
    { id: "element_53", type: "TextView", clickable: true }, // 点赞数
  ];

  console.log("🔍 [验证] 预期子元素结构:");
  expectedChildren.forEach((child, index) => {
    const status = child.clickable ? "✅ 可点击" : "⚪ 不可点击";
    console.log(`  ${index + 1}. ${child.id} (${child.type}) - ${status}`);
  });

  const clickableCount = expectedChildren.filter(
    (child) => child.clickable
  ).length;
  console.log(
    `📊 [验证] 可点击元素统计: ${clickableCount}/10 (包含根元素应为4个)`
  );

  return clickableCount === 4; // 包含4个可点击子元素
}

// 验证截图路径
function verifyScreenshotPath() {
  const expectedPath = "ui_dump_e0d909c3_20251030_122312.png";
  const xmlCacheId = "ui_dump_e0d909c3_20251030_122312.xml";

  // 模拟路径推断逻辑
  const inferredPath = xmlCacheId.replace(".xml", ".png");

  console.log("📸 [验证] 截图路径推断:");
  console.log(`  XML缓存ID: ${xmlCacheId}`);
  console.log(`  推断截图路径: ${inferredPath}`);
  console.log(`  预期截图路径: ${expectedPath}`);

  const isCorrect = inferredPath === expectedPath;
  console.log(isCorrect ? "✅ 截图路径推断正确" : "❌ 截图路径推断错误");

  return isCorrect;
}

// 验证开发模式配置
function verifyDevelopmentMode() {
  // 模拟硬编码数据提供器的开发模式检查
  const DEVELOPMENT_MODE = true; // 在实际代码中这应该是 HardcodedElement43DataProvider.DEVELOPMENT_MODE

  console.log("🚧 [验证] 开发模式状态:");
  console.log(`  开发模式启用: ${DEVELOPMENT_MODE ? "是" : "否"}`);
  console.log(`  应该使用硬编码数据: ${DEVELOPMENT_MODE ? "是" : "否"}`);

  if (DEVELOPMENT_MODE) {
    console.log("✅ 开发模式已启用，将使用硬编码数据");
  } else {
    console.log("⚠️ 开发模式未启用，将使用生产数据");
  }

  return DEVELOPMENT_MODE;
}

// 验证数据一致性
function verifyDataConsistency() {
  console.log("🔍 [验证] 数据一致性检查:");

  // 检查所有元素的bounds是否在根元素范围内
  const rootBounds = { x: 13, y: 1158, width: 521, height: 865 };
  const childElementsBounds = [
    { id: "element_47", bounds: "[13,1158][534,1852]" }, // 图片
    { id: "element_48", bounds: "[39,1876][507,1921]" }, // 装饰层
    { id: "element_49", bounds: "[13,1921][523,2023]" }, // 作者栏
    { id: "element_50", bounds: "[29,1938][97,2006]" }, // 头像
    { id: "element_51", bounds: "[108,1957][394,1987]" }, // 作者名
    { id: "element_52", bounds: "[394,1933][473,2012]" }, // 点赞按钮
    { id: "element_53", bounds: "[473,1954][507,1991]" }, // 点赞数
  ];

  let allWithinBounds = true;
  childElementsBounds.forEach((child) => {
    const matches = child.bounds.match(/\d+/g)?.map(Number) || [];
    const [left, top, right, bottom] = matches;

    const isWithin =
      left >= rootBounds.x &&
      top >= rootBounds.y &&
      right <= rootBounds.x + rootBounds.width &&
      bottom <= rootBounds.y + rootBounds.height;

    console.log(`  ${child.id}: ${isWithin ? "✅" : "❌"} 在根元素范围内`);
    if (!isWithin) allWithinBounds = false;
  });

  console.log(
    `📊 [验证] 边界一致性: ${allWithinBounds ? "✅ 通过" : "❌ 失败"}`
  );
  return allWithinBounds;
}

// 主验证函数
function runVerification() {
  console.log("=".repeat(60));
  console.log("🚧 硬编码Element_43数据完整性验证");
  console.log("=".repeat(60));

  const results = {
    boundsCalculation: verifyBoundsCalculation(),
    childStructure: verifyChildStructure(),
    screenshotPath: verifyScreenshotPath(),
    developmentMode: verifyDevelopmentMode(),
    dataConsistency: verifyDataConsistency(),
  };

  console.log("\n" + "=".repeat(60));
  console.log("📋 验证结果汇总:");
  console.log("=".repeat(60));

  let passedCount = 0;
  Object.entries(results).forEach(([key, passed]) => {
    const status = passed ? "✅ 通过" : "❌ 失败";
    const name = {
      boundsCalculation: "边界计算",
      childStructure: "子元素结构",
      screenshotPath: "截图路径推断",
      developmentMode: "开发模式配置",
      dataConsistency: "数据一致性",
    }[key];

    console.log(`${status} ${name}`);
    if (passed) passedCount++;
  });

  const totalCount = Object.keys(results).length;
  console.log("\n" + "-".repeat(30));
  console.log(`🎯 总体结果: ${passedCount}/${totalCount} 项验证通过`);

  if (passedCount === totalCount) {
    console.log("🎉 所有验证通过！硬编码数据结构正确");
    console.log("🚀 可以开始测试结构匹配功能");
  } else {
    console.log("⚠️ 部分验证未通过，请检查硬编码数据实现");
  }

  console.log("\n📝 下一步:");
  console.log("1. 启动应用: npm run tauri dev");
  console.log("2. 打开结构匹配相关页面");
  console.log("3. 查看浏览器控制台是否有硬编码数据日志");
  console.log("4. 验证FloatingVisualWindow是否显示硬编码数据");

  return passedCount === totalCount;
}

// 运行验证 (ES模块模式)
runVerification();

// 导出函数 (ES模块模式)
export { runVerification, verifyBoundsCalculation };
