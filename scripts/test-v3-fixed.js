/**
 * 测试 V3 参数提取修复
 * 验证嵌套 smartSelection 参数结构是否能正确提取
 */

import { invoke } from '@tauri-apps/api/core'

async function testV3ParameterExtraction() {
    console.log('🧪 测试 V3 参数提取修复...')
    
    try {
        // 模拟前端 V3 参数格式
        const v3Spec = {
            steps: [
                {
                    stepId: "test-smart-selection-1",
                    stepType: "SmartSelection",
                    stepName: "点击已关注按钮",
                    params: {
                        smartSelection: {
                            targetText: "已关注",
                            mode: "text",
                            minConfidence: 0.6,
                            batchConfig: null
                        }
                    }
                }
            ],
            mode: "intelligent",
            threshold: 0.7,
            orderedSteps: []
        }

        const realEnvelope = {
            deviceId: "test-device",
            app: { package: "com.xingin.xhs", activity: null },
            snapshot: {},
            executionMode: "strict"
        };

        console.log('📤 发送 V3 执行请求...')
        console.log('参数结构：', JSON.stringify(v3Spec.steps[0].params, null, 2))
        
        const result = await invoke('plugin:execution_v3|execute_chain_test_v3', { 
            envelope: realEnvelope,
            spec: v3Spec 
        })
        
        console.log('✅ V3 执行结果：')
        console.log(JSON.stringify(result, null, 2))
        
        // 检查是否成功提取参数
        if (result.status === 'executed') {
            console.log('🎉 参数提取成功！V3 系统正确处理了嵌套的 smartSelection 结构')
        } else {
            console.log('⚠️  状态:', result.status)
            console.log('消息:', result.message)
        }
        
    } catch (error) {
        console.error('❌ 测试失败:', error)
        
        // 检查是否是参数提取错误
        if (error.message?.includes('SmartSelection步骤缺少targetText参数')) {
            console.log('🔍 参数提取仍有问题，需要进一步调试')
        }
    }
}

async function testParameterExtractionFallback() {
    console.log('\n🔄 测试参数提取回退链...')
    
    const testCases = [
        {
            name: "直接 targetText",
            params: { targetText: "已关注" }
        },
        {
            name: "嵌套 smartSelection.targetText", 
            params: { smartSelection: { targetText: "已关注" } }
        },
        {
            name: "使用 contentDesc 回退",
            params: { smartSelection: { contentDesc: "已关注" } }
        },
        {
            name: "使用 text 回退",
            params: { smartSelection: { text: "已关注" } }
        }
    ]

    for (const testCase of testCases) {
        console.log(`\n📋 测试: ${testCase.name}`)
        
        try {
            const v3Spec = {
                steps: [{
                    stepId: `test-${Date.now()}`,
                    stepType: "SmartSelection", 
                    stepName: testCase.name,
                    params: testCase.params
                }],
                mode: "intelligent",
                threshold: 0.7,
                orderedSteps: []
            }

            const envelope = {
                deviceId: "test-device",
                sessionId: `test-${Date.now()}`,
                spec: v3Spec,
                constraints: {
                    timeoutMs: 10000,
                    maxRetries: 1,
                    screenChangeRequired: false
                }
            }

            const result = await invoke('execute_chain_by_inline_v3', { envelope })
            
            console.log(`✅ ${testCase.name}: ${result.status}`)
            if (result.message) {
                console.log(`   消息: ${result.message}`)
            }
            
        } catch (error) {
            console.log(`❌ ${testCase.name}: ${error.message}`)
        }
    }
}

// 运行测试
console.log('🚀 启动 V3 参数提取修复测试\n')

testV3ParameterExtraction()
    .then(() => testParameterExtractionFallback())
    .then(() => {
        console.log('\n✨ 测试完成')
        process.exit(0)
    })
    .catch(error => {
        console.error('💥 测试异常:', error)
        process.exit(1)
    })