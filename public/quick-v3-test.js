// 简单的V3参数提取测试
// 使用方法：在开发者工具控制台运行 testV3ParameterFixQuick()

async function testV3ParameterFixQuick() {
    console.log('🧪 快速测试 V3 参数提取修复...');
    
    try {
        // 使用嵌套 smartSelection 格式（这就是问题所在）
        const testSpec = {
            steps: [{
                stepId: `test-${Date.now()}`,
                stepType: "SmartSelection",
                stepName: "测试嵌套参数",
                params: {
                    smartSelection: {
                        targetText: "已关注",
                        mode: "text"
                    }
                }
            }],
            mode: "intelligent",
            threshold: 0.5,
            orderedSteps: []
        };

        const realEnvelope = {
            deviceId: "test-device",
            app: { package: "com.xingin.xhs", activity: null },
            snapshot: {},
            executionMode: "strict"
        };

        console.log('📤 测试参数结构:');
        console.log('params:', JSON.stringify(testSpec.steps[0].params, null, 2));

        if (typeof window.__TAURI__ === 'undefined') {
            console.error('❌ Tauri 环境不可用');
            return;
        }

        const { invoke } = window.__TAURI__.core;
        console.log('⏳ 调用 V3 执行引擎...');
        
        const result = await invoke('plugin:execution_v3|execute_chain_test_v3', { 
            envelope: realEnvelope,
            spec: testSpec 
        });
        
        console.log('✅ V3 执行结果:');
        console.log(result);
        
        // 检查是否成功提取了参数
        if (result.status !== 'failed' || !result.message?.includes('缺少targetText参数')) {
            console.log('🎉 参数提取修复成功！系统正确处理了嵌套参数结构');
        } else {
            console.log('❌ 参数提取仍有问题:', result.message);
        }
        
        return result;
        
    } catch (error) {
        console.error('❌ 测试异常:', error);
        
        if (error.message?.includes('SmartSelection步骤缺少targetText参数')) {
            console.log('🔍 确认：参数提取问题仍然存在');
        }
        
        return { error: error.message };
    }
}

// 挂载到全局
window.testV3ParameterFixQuick = testV3ParameterFixQuick;
console.log('🚀 V3 参数提取快速测试函数已加载');
console.log('使用方法: await testV3ParameterFixQuick()');