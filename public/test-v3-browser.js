// V3 参数提取测试工具
// 在浏览器开发者工具中运行

// 测试 V3 参数提取修复
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
        
        const { invoke } = await import('@tauri-apps/api/core')
        const result = await invoke('plugin:execution_v3|execute_chain_test_v3', { 
            envelope: realEnvelope,
            spec: v3Spec 
        })
        
        console.log('✅ V3 执行结果：')
        console.log(JSON.stringify(result, null, 2))
        
        // 检查是否成功提取参数
        if (result.status === 'executed') {
            console.log('🎉 参数提取成功！V3 系统正确处理了嵌套的 smartSelection 结构')
        } else if (result.status === 'failed') {
            console.log('⚠️  执行失败，但参数提取成功')
            console.log('失败原因:', result.message)
        } else {
            console.log('⚠️  状态:', result.status)
            console.log('消息:', result.message)
        }
        
        return result
        
    } catch (error) {
        console.error('❌ 测试失败:', error)
        
        // 检查是否是参数提取错误
        if (error.message?.includes('SmartSelection步骤缺少targetText参数')) {
            console.log('🔍 参数提取仍有问题，需要进一步调试')
        }
        
        throw error
    }
}

// 运行测试函数
window.testV3ParameterExtraction = testV3ParameterExtraction

console.log('✨ V3 参数提取测试工具已加载')
console.log('使用方法: await testV3ParameterExtraction()')