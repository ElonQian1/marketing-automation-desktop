// src/test/v3-chainspec-test.ts
// module: test | layer: test | role: ChainSpecV3格式测试
// summary: 测试V3链式执行参数格式的正确性

import { invoke } from '@tauri-apps/api/core';
import { buildEnvelope } from '../protocol/v3/envelope-builder';

/**
 * 测试ChainSpecV3::ByRef格式是否正确
 */
export async function testChainSpecV3Format(): Promise<void> {
  console.log('🧪 开始测试ChainSpecV3格式...');
  
  try {
    // 构建测试参数 - 使用统一的 envelope-builder
    const envelope = buildEnvelope({
      deviceId: 'test_device',
      analysisId: 'test_analysis',
      xmlContent: null,
      executionMode: 'relaxed'
    });

    const spec = {
      analysisId: 'step_execution_test_123',
      threshold: 0.7,
      mode: 'dryrun' as const
    };

    console.log('📋 测试参数:', { 
      envelope, 
      spec, 
      specType: 'ChainSpecV3::ByRef' 
    });

    // 尝试调用V3执行命令
    const result = await invoke('execute_chain_test_v3', {
      envelope,
      spec
    });

    console.log('✅ ChainSpecV3格式测试成功！', result);
    
  } catch (error) {
    console.error('❌ ChainSpecV3格式测试失败:', error);
    
    // 分析错误类型
    if (error && typeof error === 'string' && error.includes('data did not match any variant')) {
      console.log('🔍 分析：这是枚举变体匹配错误，可能的原因:');
      console.log('1. 字段名称不匹配（应该使用camelCase）');
      console.log('2. 字段类型不匹配');
      console.log('3. 缺少必需字段');
      console.log('4. 枚举值不正确');
    }
    
    throw error;
  }
}

// 测试不同的ChainMode值
export async function testChainModeValues(): Promise<void> {
  console.log('🧪 测试不同的ChainMode值...');
  
  const modes = ['dryrun', 'execute'] as const;
  
  for (const mode of modes) {
    try {
      console.log(`📝 测试mode: ${mode}`);
      
      const envelope = buildEnvelope({
        deviceId: 'test_device',
        analysisId: `test_${mode}`,
        xmlContent: null,
        executionMode: 'relaxed'
      });

      const spec = {
        analysisId: `test_analysis_${mode}`,
        threshold: 0.7,
        mode: mode
      };

      await invoke('execute_chain_test_v3', { envelope, spec });
      console.log(`✅ Mode "${mode}" 测试成功`);
      
    } catch (error) {
      console.error(`❌ Mode "${mode}" 测试失败:`, error);
    }
  }
}

// 如果直接运行此文件
if (typeof window !== 'undefined') {
  (window as any).testChainSpecV3Format = testChainSpecV3Format;
  (window as any).testChainModeValues = testChainModeValues;
  console.log('📋 V3测试函数已挂载到window');
}