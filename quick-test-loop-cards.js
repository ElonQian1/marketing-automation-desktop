/**
 * 快速测试循环卡片修复功能
 * 可以在浏览器控制台直接运行
 */

console.log('🔧 开始测试循环卡片修复功能...');

// 1. 创建测试卡片容器
function createTestEnvironment() {
    // 移除现有的测试容器
    const existing = document.getElementById('loop-card-test-container');
    if (existing) {
        existing.remove();
    }
    
    // 创建新的测试容器
    const container = document.createElement('div');
    container.id = 'loop-card-test-container';
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 400px;
        max-height: 80vh;
        overflow-y: auto;
        background: #f0f0f0;
        border: 2px solid #1890ff;
        border-radius: 8px;
        padding: 20px;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;
    
    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3 style="margin: 0; color: #1890ff;">🎨 循环卡片测试</h3>
            <button onclick="document.getElementById('loop-card-test-container').remove()" 
                    style="background: #ff4d4f; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                关闭
            </button>
        </div>
        
        <div id="test-status" style="padding: 10px; margin-bottom: 15px; border-radius: 4px; background: #e6f7ff; color: #1890ff;">
            准备开始测试...
        </div>
        
        <div style="margin-bottom: 15px;">
            <button onclick="runQuickTest()" style="background: #1890ff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-right: 5px;">
                运行测试
            </button>
            <button onclick="createProblemCard()" style="background: #ff4d4f; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-right: 5px;">
                创建问题卡片
            </button>
            <button onclick="showStats()" style="background: #52c41a; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                查看统计
            </button>
        </div>
        
        <div id="test-results" style="max-height: 200px; overflow-y: auto; background: white; padding: 10px; border-radius: 4px; font-size: 12px; font-family: monospace;">
            等待测试结果...
        </div>
        
        <div id="test-cards-container" style="margin-top: 15px;">
            <!-- 测试卡片将插入这里 -->
        </div>
    `;
    
    document.body.appendChild(container);
    console.log('✅ 测试环境已创建');
}

// 2. 更新测试状态
function updateTestStatus(message, type = 'info') {
    const status = document.getElementById('test-status');
    if (status) {
        const colors = {
            info: { bg: '#e6f7ff', color: '#1890ff' },
            success: { bg: '#f6ffed', color: '#52c41a' },
            error: { bg: '#fff2f0', color: '#ff4d4f' },
            warning: { bg: '#fffbe6', color: '#faad14' }
        };
        
        const style = colors[type] || colors.info;
        status.style.backgroundColor = style.bg;
        status.style.color = style.color;
        status.textContent = message;
    }
}

// 3. 添加测试结果
function addTestResult(message) {
    const results = document.getElementById('test-results');
    if (results) {
        const timestamp = new Date().toLocaleTimeString();
        results.innerHTML += `[${timestamp}] ${message}\n`;
        results.scrollTop = results.scrollHeight;
    }
    console.log(`🔍 ${message}`);
}

// 4. 创建问题卡片（用于测试修复功能）
function createProblemCard() {
    const container = document.getElementById('test-cards-container');
    if (!container) return;
    
    const cardId = `problem-card-${Date.now()}`;
    const card = document.createElement('div');
    card.id = cardId;
    card.className = 'loop-step-card problem-card';
    card.style.cssText = `
        background: black !important;
        color: black !important;
        padding: 15px;
        margin: 10px 0;
        border: 1px solid #333;
        border-radius: 6px;
    `;
    
    card.innerHTML = `
        <h4 style="margin: 0 0 10px 0; color: inherit;">问题卡片 #${cardId.split('-')[2]}</h4>
        <p style="margin: 0 0 10px 0; color: inherit;">这是黑底黑字的问题卡片，应该被修复为白底黑字</p>
        <button class="ant-btn" style="background: black; color: black; border: 1px solid #333; padding: 4px 8px; border-radius: 4px;">
            问题按钮
        </button>
        <span class="ant-tag" style="background: black; color: black; border: 1px solid #333; padding: 2px 6px; border-radius: 3px; margin-left: 5px;">
            问题标签
        </span>
    `;
    
    container.appendChild(card);
    addTestResult(`创建问题卡片: ${cardId}`);
    
    // 触发修复（如果可用）
    setTimeout(() => {
        if (typeof window.fixLoopCardsEmergency === 'function') {
            window.fixLoopCardsEmergency();
            addTestResult('触发紧急修复');
        } else if (typeof window.fixLoopCards === 'function') {
            window.fixLoopCards();
            addTestResult('触发主题系统修复');
        }
    }, 500);
}

// 5. 运行完整测试
function runQuickTest() {
    updateTestStatus('正在运行测试...', 'info');
    addTestResult('=== 开始循环卡片修复测试 ===');
    
    // 检查修复方法可用性
    const hasEmergencyFix = typeof window.fixLoopCardsEmergency === 'function';
    const hasThemeFix = typeof window.fixLoopCards === 'function';
    const hasStats = typeof window.getLoopCardStats === 'function';
    
    addTestResult(`紧急修复方法: ${hasEmergencyFix ? '✅ 可用' : '❌ 不可用'}`);
    addTestResult(`主题修复方法: ${hasThemeFix ? '✅ 可用' : '❌ 不可用'}`);
    addTestResult(`统计方法: ${hasStats ? '✅ 可用' : '❌ 不可用'}`);
    
    // 查找现有的循环卡片
    const loopCards = document.querySelectorAll('.loop-step-card, .step-card, .white-background-allowed, [data-loop-badge]');
    addTestResult(`发现 ${loopCards.length} 个循环卡片`);
    
    // 分析每个卡片的样式
    let problematicCards = 0;
    let fixedCards = 0;
    
    loopCards.forEach((card, index) => {
        const computed = window.getComputedStyle(card);
        const isFixed = card.getAttribute('data-white-theme-forced') === 'true';
        const bgColor = computed.backgroundColor;
        const textColor = computed.color;
        
        addTestResult(`卡片 ${index + 1}: bg=${bgColor}, color=${textColor}, 已修复=${isFixed}`);
        
        // 检查是否有问题
        const hasBlackBg = bgColor.includes('0, 0, 0') || bgColor === 'black' || bgColor.includes('45, 45, 45');
        const hasBlackText = textColor.includes('0, 0, 0') || textColor === 'black';
        const hasWhiteText = textColor.includes('255, 255, 255') || textColor === 'white';
        
        if ((hasBlackBg && hasBlackText) || hasWhiteText) {
            problematicCards++;
            addTestResult(`  ⚠️  卡片 ${index + 1} 有样式问题`);
        } else {
            fixedCards++;
            addTestResult(`  ✅  卡片 ${index + 1} 样式正常`);
        }
    });
    
    // 尝试运行修复
    if (problematicCards > 0) {
        addTestResult(`发现 ${problematicCards} 个问题卡片，尝试修复...`);
        
        if (hasEmergencyFix) {
            const result = window.fixLoopCardsEmergency();
            addTestResult(`紧急修复执行完成，修复了 ${result} 个卡片`);
        } else if (hasThemeFix) {
            window.fixLoopCards();
            addTestResult('主题系统修复执行完成');
        } else {
            addTestResult('❌ 没有可用的修复方法');
        }
        
        // 重新检查
        setTimeout(() => {
            const afterLoopCards = document.querySelectorAll('.loop-step-card, .step-card, .white-background-allowed, [data-loop-badge]');
            const afterFixedCards = document.querySelectorAll('[data-white-theme-forced="true"]');
            addTestResult(`修复后: 总卡片 ${afterLoopCards.length}, 已修复标记 ${afterFixedCards.length}`);
        }, 1000);
    }
    
    // 显示统计信息
    if (hasStats) {
        try {
            const stats = window.getLoopCardStats();
            addTestResult(`主题系统统计: ${JSON.stringify(stats)}`);
        } catch (e) {
            addTestResult(`统计获取失败: ${e.message}`);
        }
    }
    
    addTestResult('=== 测试完成 ===');
    updateTestStatus(`测试完成: ${fixedCards} 正常, ${problematicCards} 问题`, problematicCards > 0 ? 'warning' : 'success');
}

// 6. 显示统计信息
function showStats() {
    addTestResult('=== 统计信息 ===');
    
    // 基础统计
    const loopCards = document.querySelectorAll('.loop-step-card, .step-card, .white-background-allowed, [data-loop-badge]');
    const fixedCards = document.querySelectorAll('[data-white-theme-forced="true"]');
    const problemCards = document.querySelectorAll('.problem-card');
    
    addTestResult(`循环卡片总数: ${loopCards.length}`);
    addTestResult(`已修复标记: ${fixedCards.length}`);
    addTestResult(`问题卡片: ${problemCards.length}`);
    
    // 主题系统统计
    if (typeof window.getThemeStats === 'function') {
        try {
            const themeStats = window.getThemeStats();
            addTestResult('主题系统统计:');
            Object.entries(themeStats).forEach(([key, value]) => {
                addTestResult(`  ${key}: ${JSON.stringify(value)}`);
            });
        } catch (e) {
            addTestResult(`主题统计获取失败: ${e.message}`);
        }
    }
    
    // CSS规则检查
    const emergencyCSS = document.getElementById('loop-card-emergency-fix');
    addTestResult(`紧急修复CSS: ${emergencyCSS ? '✅ 已加载' : '❌ 未加载'}`);
    
    addTestResult('=== 统计结束 ===');
}

// 7. 将方法绑定到全局
window.createTestEnvironment = createTestEnvironment;
window.runQuickTest = runQuickTest;
window.createProblemCard = createProblemCard;
window.showStats = showStats;

// 8. 自动创建测试环境
createTestEnvironment();
updateTestStatus('测试环境已准备就绪', 'success');

console.log('✅ 循环卡片测试工具已加载！');
console.log('使用方法:');
console.log('  runQuickTest() - 运行完整测试');
console.log('  createProblemCard() - 创建问题卡片');
console.log('  showStats() - 显示统计信息');
console.log('  createTestEnvironment() - 重新创建测试环境');