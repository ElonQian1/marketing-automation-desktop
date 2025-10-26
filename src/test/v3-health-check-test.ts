// src/test/v3-health-check-test.ts
// module: test | layer: test | role: V3健康检查测试脚本
// summary: 测试V3智能策略系统健康检查功能

import { IntelligentAnalysisBackendV3 } from '../services/intelligent-analysis-backend-v3';

/**
 * V3健康检查测试
 */
export async function testV3HealthCheck(): Promise<boolean> {
  console.log('🧪 开始V3健康检查测试...');
  
  try {
    const deviceId = 'test_device';
    const result = await IntelligentAnalysisBackendV3.healthCheckV3(deviceId);
    
    if (result) {
      console.log('✅ V3健康检查测试成功！系统正常');
    } else {
      console.log('❌ V3健康检查测试失败，系统不可用');
    }
    
    return result;
  } catch (error) {
    console.error('🚨 V3健康检查测试异常:', error);
    throw error;
  }
}

// 如果直接运行此文件
if (typeof window !== 'undefined') {
  (window as any).testV3HealthCheck = testV3HealthCheck;
  console.log('📋 V3健康检查测试函数已挂载到 window.testV3HealthCheck');
}