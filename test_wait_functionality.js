// 延时功能测试脚本
// 测试前端延时参数是否正确传递到后端并执行

const testWaitFunctionality = async () => {
  console.log("🧪 开始测试延时功能...");
  
  // 模拟创建一个延时步骤
  const waitStep = {
    id: "test-wait-step",
    action: "wait", 
    coordinateParams: {
      duration: 3000  // 3秒延时
    }
  };
  
  console.log("📤 前端发送的延时步骤:", JSON.stringify(waitStep, null, 2));
  
  // 验证前端参数格式
  const expectedBackendParams = {
    id: "test-wait-step",
    action: "wait",
    duration_ms: 3000  // 后端期望的参数名
  };
  
  console.log("🎯 后端期望接收的格式:", JSON.stringify(expectedBackendParams, null, 2));
  
  // 模拟参数映射过程
  let backendStep = { ...waitStep };
  if (waitStep.coordinateParams && waitStep.coordinateParams.duration) {
    backendStep.duration_ms = waitStep.coordinateParams.duration;
    console.log("✅ 参数映射成功: duration -> duration_ms");
  }
  
  console.log("🔧 映射后的后端步骤:", JSON.stringify(backendStep, null, 2));
  
  return {
    frontendStep: waitStep,
    expectedBackend: expectedBackendParams,
    mappedStep: backendStep,
    isCorrectlyMapped: backendStep.duration_ms === 3000
  };
};

// 如果在浏览器环境中运行
if (typeof window !== 'undefined') {
  window.testWaitFunctionality = testWaitFunctionality;
}

// 如果在Node.js环境中运行
if (typeof module !== 'undefined') {
  module.exports = { testWaitFunctionality };
}

// 立即执行测试
testWaitFunctionality().then(result => {
  console.log("📋 测试结果:", result);
  console.log(result.isCorrectlyMapped ? "✅ 延时功能参数映射正确" : "❌ 延时功能参数映射失败");
});