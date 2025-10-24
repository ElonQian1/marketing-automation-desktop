// test-v2-command.mjs
// 测试V2命令注册和基本功能
import { invoke } from '@tauri-apps/api/core';

async function testV2Command() {
  console.log('🚀 开始测试V2执行命令...');

  // 测试1: Static执行链
  console.log('\n1. 测试Static执行链');
  try {
    const staticResult = await invoke('run_step_v2', {
      request: {
        engine: 'v2',
        flow: 'static',
        mode: 'match_and_execute',
        dry_run: false,
        allow_exec: true,
        device_id: 'emulator-5554',
        step: {
          action_type: 'tap',
          coordinates: { x: 100, y: 100 }
        }
      }
    });
    console.log('✅ Static执行成功:', JSON.stringify(staticResult, null, 2));
  } catch (error) {
    console.log('❌ Static执行失败:', error);
  }

  // 测试2: Step执行链
  console.log('\n2. 测试Step执行链');
  try {
    const stepResult = await invoke('run_step_v2', {
      request: {
        engine: 'v2',
        flow: 'step',
        mode: 'match_and_execute',
        dry_run: true, // 模拟运行，避免真实操作
        allow_exec: true,
        device_id: 'emulator-5554',
        step: {
          action_type: 'tap',
          coordinates: { x: 200, y: 200 }
        }
      }
    });
    console.log('✅ Step执行成功:', JSON.stringify(stepResult, null, 2));
  } catch (error) {
    console.log('❌ Step执行失败:', error);
  }

  // 测试3: Chain执行链
  console.log('\n3. 测试Chain执行链');
  try {
    const chainResult = await invoke('run_step_v2', {
      request: {
        engine: 'v2',
        flow: 'chain',
        mode: 'match_only', // 仅匹配，不执行
        dry_run: false,
        allow_exec: true,
        device_id: 'emulator-5554',
        plan: {
          steps: [
            {
              action_type: 'tap',
              coordinates: { x: 300, y: 300 }
            }
          ]
        }
      }
    });
    console.log('✅ Chain执行成功:', JSON.stringify(chainResult, null, 2));
  } catch (error) {
    console.log('❌ Chain执行失败:', error);
  }

  console.log('\n🎯 V2命令测试完成！');
}

// 如果在浏览器环境，等待Tauri准备就绪
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', testV2Command);
} else {
  testV2Command();
}

export { testV2Command };