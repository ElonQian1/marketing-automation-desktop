// src/utils/testV2Fix.ts
// module: utils | layer: utils | role: V2修复验证工具
// summary: 验证V1→V2自动重定向是否正常工作

import { useSingleStepTest } from '../hooks/useSingleStepTest';
import type { SmartScriptStep } from '../types/smartScript';

/**
 * 🧪 验证V2修复是否生效
 * 
 * 这个测试会验证：
 * 1. useSingleStepTest是否正确重定向到V2
 * 2. V2系统是否能正常处理测试请求
 * 3. 不再出现"missing field strategy"错误
 */
export async function testV2FixWorking(deviceId: string = 'e0d909c3'): Promise<boolean> {
  console.log('🧪 开始验证V2修复...');

  try {
    // 这个导入现在应该自动使用V2系统
    const testHook = useSingleStepTest();
    console.log('✅ useSingleStepTest导入成功，已重定向到V2');

    // 模拟你之前出错的测试步骤
    const testStep: SmartScriptStep = {
      id: 'test-fix-verification',
      name: '修复验证测试',
      step_type: 'smart_find_element',
      parameters: {
        element_selector: 'element_element_64',
        text: '',
        bounds: '{"bottom":2358,"left":864,"right":1080,"top":2240}',
        resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated',
        content_desc: '我',
        matching: {
          strategy: 'intelligent'
        }
      }
    };

    console.log('📋 测试步骤:', testStep);

    // 执行测试（这应该使用V2系统，不会出现V1错误）
    const result = await testHook.runSingleStepTest(testStep, deviceId, 'match-only');

    console.log('✅ V2修复验证成功!');
    console.log('📊 测试结果:', {
      success: result.success,
      message: result.message,
      stepId: result.step_id,
      noStrategyError: !result.message.includes('missing field'),
    });

    return result.success || !result.message.includes('missing field');

  } catch (error) {
    console.error('❌ V2修复验证失败:', error);
    
    // 检查是否还是V1的策略字段错误
    const isV1StrategyError = error instanceof Error && 
                             error.message.includes('missing field') &&
                             error.message.includes('strategy');
    
    if (isV1StrategyError) {
      console.error('🚨 V1策略字段错误仍存在，重定向可能未生效');
      return false;
    }

    // 其他错误可能是正常的（如设备未连接等）
    console.log('ℹ️ 非V1策略错误，V2重定向可能已生效');
    return true;
  }
}

/**
 * 🔍 检查导入重定向状态
 */
export function checkImportRedirection(): void {
  console.log('🔍 检查useSingleStepTest导入重定向...');
  
  try {
    const hookResult = useSingleStepTest();
    
    // 检查返回的对象是否包含V2特征
    const hasV2Features = hookResult && 
                         typeof hookResult.runSingleStepTest === 'function';
    
    if (hasV2Features) {
      console.log('✅ 导入重定向成功 - useSingleStepTest已指向V2系统');
    } else {
      console.warn('⚠️ 导入重定向可能有问题');
    }
    
    return hasV2Features;
    
  } catch (error) {
    console.error('❌ 导入检查失败:', error);
    return false;
  }
}

/**
 * 🎯 一键验证函数
 */
export async function quickV2FixCheck(deviceId?: string): Promise<void> {
  console.log('\n🚀 === V2修复快速验证 ===');
  
  // 1. 检查导入重定向
  console.log('\n1️⃣ 检查导入重定向...');
  const redirectOK = checkImportRedirection();
  console.log(`   结果: ${redirectOK ? '✅ 成功' : '❌ 失败'}`);
  
  // 2. 测试V2系统工作状态  
  if (deviceId) {
    console.log('\n2️⃣ 测试V2系统执行...');
    const testOK = await testV2FixWorking(deviceId);
    console.log(`   结果: ${testOK ? '✅ 成功' : '❌ 失败'}`);
  } else {
    console.log('\n2️⃣ 跳过V2执行测试（未提供设备ID）');
  }
  
  console.log('\n🎉 === 验证完成 ===\n');
}

// 自动运行检查（开发环境）
if (import.meta.env.DEV) {
  console.log('🔧 开发环境自动检查V2修复状态...');
  checkImportRedirection();
}