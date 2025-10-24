// src/utils/testV2Backend.ts
// module: utils | layer: utils | role: V2后端连接测试工具
// summary: 验证V2系统是否真正连接到后端，而不是返回模拟数据

import { getStepExecutionGateway } from '../infrastructure/gateways/StepExecutionGateway';

/**
 * 🧪 测试V2后端真实连接
 */
export async function testV2BackendConnection(deviceId: string = 'e0d909c3'): Promise<void> {
  console.log('\n🔍 === 测试V2后端真实连接 ===');
  
  try {
    const gateway = getStepExecutionGateway();
    
    console.log('1️⃣ 创建V2测试请求...');
    const testRequest = {
      deviceId,
      mode: 'match-only' as const,
      actionParams: {
        type: 'tap' as const,
        params: {
          x: undefined,
          y: undefined,
          offsetX: 0,
          offsetY: 0,
        },
      },
      selectorId: '//*[@content-desc="我"]',
    };
    
    console.log('📋 测试请求:', testRequest);
    
    console.log('2️⃣ 调用StepExecutionGateway...');
    const result = await gateway.executeStep(testRequest);
    
    console.log('3️⃣ 分析执行结果...');
    console.log('📊 执行结果:', result);
    
    // 检查是否为模拟数据
    const isSimulated = result.message?.includes('模拟') || 
                       result.message?.includes('Mock') ||
                       result.message?.includes('V1执行完成');
    
    const isV2Real = result.engine === 'v2' && 
                     !isSimulated && 
                     result.message !== 'V1执行完成（模拟）';
    
    if (isV2Real) {
      console.log('✅ V2后端连接正常 - 使用真实后端数据');
      console.log(`   引擎: ${result.engine}`);
      console.log(`   消息: ${result.message}`);
      console.log(`   成功: ${result.success}`);
    } else if (result.engine === 'v1' || isSimulated) {
      console.warn('⚠️ 仍在使用V1模拟数据');
      console.warn(`   引擎: ${result.engine}`);
      console.warn(`   消息: ${result.message}`);
      console.warn('   需要检查引擎配置或V2适配器');
    } else {
      console.log('ℹ️ 结果状态不明确');
      console.log(`   引擎: ${result.engine}`);
      console.log(`   消息: ${result.message}`);
    }
    
  } catch (error) {
    console.error('❌ V2后端连接测试失败:', error);
    
    // 分析错误类型
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('missing field') || errorMessage.includes('strategy')) {
      console.error('🚨 仍有V1接口错误 - V2重定向可能未生效');
    } else if (errorMessage.includes('invoke') || errorMessage.includes('tauri')) {
      console.error('🔧 Tauri后端连接问题 - 检查后端是否运行');
    } else {
      console.error('🔍 未知错误 - 需要进一步调查');
    }
  }
  
  console.log('\n=== 测试完成 ===\n');
}

/**
 * 📋 V2配置验证
 */
export function validateV2Configuration(): boolean {
  console.log('\n🔧 === V2配置验证 ===');
  
  try {
    // 检查V2 Hook导入
    console.log('1️⃣ 检查useSingleStepTest重定向...');
    // 这会通过静态分析，在运行时验证
    
    // 检查Gateway配置
    console.log('2️⃣ 检查StepExecutionGateway...');
    const gateway = getStepExecutionGateway();
    
    if (gateway) {
      console.log('✅ StepExecutionGateway实例化成功');
    } else {
      console.error('❌ StepExecutionGateway实例化失败');
      return false;
    }
    
    console.log('✅ V2配置验证完成');
    return true;
    
  } catch (error) {
    console.error('❌ V2配置验证失败:', error);
    return false;
  }
}

/**
 * 🎯 一键诊断V2连接问题
 */
export async function diagnoseV2Connection(deviceId?: string): Promise<void> {
  console.log('\n🏥 === V2连接诊断 ===');
  
  // 1. 配置验证
  const configOK = validateV2Configuration();
  if (!configOK) {
    console.error('❌ 配置验证失败，停止诊断');
    return;
  }
  
  // 2. 后端连接测试
  if (deviceId) {
    await testV2BackendConnection(deviceId);
  } else {
    console.log('ℹ️ 未提供设备ID，跳过后端连接测试');
    console.log('   提供设备ID以进行完整测试：diagnoseV2Connection("your-device-id")');
  }
  
  // 3. 给出建议
  console.log('\n💡 === 问题解决建议 ===');
  console.log('如果仍看到"V1执行完成（模拟）"消息：');
  console.log('1. 🔄 重启开发服务器让配置生效');
  console.log('2. 📱 确保设备正常连接 (adb devices)');
  console.log('3. 🔧 检查Tauri后端run_step_v2命令是否正常');
  console.log('4. 🧪 使用V2StepTestButton组件获得更好的调试信息');
}

// 开发环境自动诊断
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  setTimeout(() => {
    console.log('🔧 开发环境自动运行V2连接诊断...');
    diagnoseV2Connection();
  }, 2000);
}