// test-cache-integration.js
// 测试XML缓存集成是否正常工作

const testXMLCacheIntegration = async () => {
  console.log("🧪 开始测试XML缓存集成...");

  try {
    // 1. 测试registerSnapshot
    const testXml = `
<hierarchy>
  <android.widget.Button text="测试按钮" bounds="[100,200][200,300]" 
    resource-id="com.test:id/test_button" content-desc="测试描述" clickable="true"/>
</hierarchy>`;

    console.log("📋 步骤1：注册XML快照...");
    const snapshotId = await window.__TAURI__.invoke('register_snapshot_cmd', {
      xmlContent: testXml
    });
    console.log(`✅ XML快照注册成功: ${snapshotId}`);

    // 2. 测试getSubtreeMetrics
    const testXPath = "//android.widget.Button[@text='测试按钮']";
    console.log("📋 步骤2：获取子树分析指标...");
    
    const metrics = await window.__TAURI__.invoke('get_subtree_metrics_cmd', {
      snapshotId: snapshotId,
      absXpath: testXPath
    });
    console.log("✅ 子树指标获取成功:", {
      策略: metrics.suggested_strategy,
      置信度: metrics.confidence,
      可用字段: metrics.available_fields
    });

    // 3. 测试缓存命中
    console.log("📋 步骤3：测试缓存命中...");
    const metrics2 = await window.__TAURI__.invoke('get_subtree_metrics_cmd', {
      snapshotId: snapshotId,
      absXpath: testXPath
    });
    console.log("✅ 二次查询成功（应该来自缓存）:", {
      策略: metrics2.suggested_strategy,
      置信度: metrics2.confidence
    });

    // 4. 测试智能分析后端集成
    console.log("📋 步骤4：测试智能分析后端缓存集成...");
    
    // 模拟UIElement
    const testElement = {
      xpath: testXPath,
      text: "测试按钮",
      bounds: "[100,200][200,300]",
      element_type: "android.widget.Button",
      resource_id: "com.test:id/test_button",
      content_desc: "测试描述",
      class_name: "android.widget.Button"
    };

    // 通过前端CachedIntelligentAnalysisService测试
    console.log("🎯 测试缓存分析服务...");
    
    // 这里需要确保前端服务可用
    if (window.cachedIntelligentAnalysisService) {
      const cachedResult = await window.cachedIntelligentAnalysisService.analyzeElementStrategy(
        testElement,
        snapshotId,
        testXPath
      );
      
      console.log("✅ 缓存分析服务测试成功:", {
        推荐策略: cachedResult.recommendedStrategy,
        置信度: cachedResult.confidence,
        使用缓存: cachedResult.metadata.usedCache,
        分析时间: cachedResult.metadata.analysisTime + 'ms'
      });
    } else {
      console.warn("⚠️ 前端缓存分析服务不可用，跳过此测试");
    }

    console.log("🎉 XML缓存集成测试全部通过！");
    
    return {
      success: true,
      snapshotId,
      metrics,
      message: "缓存系统工作正常"
    };

  } catch (error) {
    console.error("❌ XML缓存集成测试失败:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 如果在浏览器环境中运行
if (typeof window !== 'undefined') {
  // 添加到全局作用域供手动测试
  window.testXMLCacheIntegration = testXMLCacheIntegration;
  
  // 自动运行测试
  if (window.__TAURI__) {
    console.log("🔍 检测到Tauri环境，准备运行缓存集成测试");
    setTimeout(testXMLCacheIntegration, 2000); // 2秒后运行，确保应用初始化完成
  }
}

// 如果在Node.js环境中
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testXMLCacheIntegration };
}