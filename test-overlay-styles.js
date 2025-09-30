/**
 * 浮层组件暗色主题测试工具
 * 专门用于测试模态框、抽屉、下拉菜单等浮层组件的暗色主题效果
 */

// 测试模态框样式
function testModalStyles() {
    console.log('🎭 开始测试模态框样式...');
    
    const modals = document.querySelectorAll('.ant-modal');
    
    if (modals.length === 0) {
        console.log('❌ 未找到模态框');
        return { found: 0, fixed: 0, issues: [] };
    }
    
    let fixedCount = 0;
    const issues = [];
    
    modals.forEach((modal, index) => {
        const modalElement = modal;
        console.log(`\n📋 模态框 ${index + 1}:`);
        
        // 检查模态框内容
        const content = modalElement.querySelector('.ant-modal-content');
        if (content) {
            const computedStyle = window.getComputedStyle(content);
            const bgColor = computedStyle.backgroundColor;
            const textColor = computedStyle.color;
            
            console.log(`   内容背景: ${bgColor}`);
            console.log(`   文字颜色: ${textColor}`);
            
            // 检查是否是白底白字问题
            const isWhiteBg = bgColor.includes('255, 255, 255') || bgColor === 'white' || bgColor === 'rgb(255, 255, 255)';
            const isWhiteText = textColor.includes('255, 255, 255') || textColor === 'white' || textColor === 'rgb(255, 255, 255)';
            
            if (isWhiteBg && isWhiteText) {
                issues.push(`模态框 ${index + 1}: 白底白字问题`);
                console.log('   ⚠️  发现白底白字问题！');
            } else if (bgColor.includes('var(--dark-bg') || bgColor.includes('45, 45, 45')) {
                fixedCount++;
                console.log('   ✅ 已应用暗色主题');
            }
        }
        
        // 检查模态框中的文本元素
        const textElements = modalElement.querySelectorAll('p, div, span, li, h1, h2, h3, h4, h5, h6');
        let whiteTextCount = 0;
        
        textElements.forEach(element => {
            const el = element;
            const style = window.getComputedStyle(el);
            const color = style.color;
            
            if (color === 'rgb(255, 255, 255)' || color === 'white') {
                whiteTextCount++;
            }
        });
        
        if (whiteTextCount > 0) {
            console.log(`   ⚠️  发现 ${whiteTextCount} 个白色文本元素（可能有问题）`);
        }
    });
    
    const result = {
        found: modals.length,
        fixed: fixedCount,
        issues: issues
    };
    
    console.log(`\n📊 模态框测试结果:`);
    console.log(`   找到: ${result.found} 个`);
    console.log(`   已修复: ${result.fixed} 个`);
    console.log(`   问题: ${result.issues.length} 个`);
    
    if (result.issues.length > 0) {
        console.log('   问题详情:', result.issues);
    }
    
    return result;
}

// 测试抽屉样式
function testDrawerStyles() {
    console.log('🗄️ 开始测试抽屉样式...');
    
    const drawers = document.querySelectorAll('.ant-drawer');
    
    if (drawers.length === 0) {
        console.log('❌ 未找到抽屉');
        return { found: 0, fixed: 0, issues: [] };
    }
    
    let fixedCount = 0;
    const issues = [];
    
    drawers.forEach((drawer, index) => {
        const drawerElement = drawer;
        console.log(`\n📋 抽屉 ${index + 1}:`);
        
        const content = drawerElement.querySelector('.ant-drawer-content');
        if (content) {
            const computedStyle = window.getComputedStyle(content);
            const bgColor = computedStyle.backgroundColor;
            const textColor = computedStyle.color;
            
            console.log(`   内容背景: ${bgColor}`);
            console.log(`   文字颜色: ${textColor}`);
            
            if (bgColor.includes('var(--dark-bg') || bgColor.includes('45, 45, 45')) {
                fixedCount++;
                console.log('   ✅ 已应用暗色主题');
            } else if (bgColor.includes('255, 255, 255')) {
                issues.push(`抽屉 ${index + 1}: 白色背景问题`);
                console.log('   ⚠️  发现白色背景问题！');
            }
        }
    });
    
    return {
        found: drawers.length,
        fixed: fixedCount,
        issues: issues
    };
}

// 测试下拉菜单样式
function testDropdownStyles() {
    console.log('📋 开始测试下拉菜单样式...');
    
    const dropdowns = document.querySelectorAll('.ant-dropdown');
    
    if (dropdowns.length === 0) {
        console.log('❌ 未找到下拉菜单');
        return { found: 0, fixed: 0, issues: [] };
    }
    
    let fixedCount = 0;
    const issues = [];
    
    dropdowns.forEach((dropdown, index) => {
        const dropdownElement = dropdown;
        console.log(`\n📋 下拉菜单 ${index + 1}:`);
        
        const menu = dropdownElement.querySelector('.ant-dropdown-menu');
        if (menu) {
            const computedStyle = window.getComputedStyle(menu);
            const bgColor = computedStyle.backgroundColor;
            
            console.log(`   菜单背景: ${bgColor}`);
            
            if (bgColor.includes('var(--dark-bg') || bgColor.includes('45, 45, 45')) {
                fixedCount++;
                console.log('   ✅ 已应用暗色主题');
            } else if (bgColor.includes('255, 255, 255')) {
                issues.push(`下拉菜单 ${index + 1}: 白色背景问题`);
                console.log('   ⚠️  发现白色背景问题！');
            }
        }
    });
    
    return {
        found: dropdowns.length,
        fixed: fixedCount,
        issues: issues
    };
}

// 综合测试所有浮层组件
function testAllOverlayStyles() {
    console.log('🔍 开始综合测试所有浮层组件...');
    
    const modalResult = testModalStyles();
    const drawerResult = testDrawerStyles();
    const dropdownResult = testDropdownStyles();
    
    const totalResult = {
        modal: modalResult,
        drawer: drawerResult,
        dropdown: dropdownResult,
        summary: {
            totalFound: modalResult.found + drawerResult.found + dropdownResult.found,
            totalFixed: modalResult.fixed + drawerResult.fixed + dropdownResult.fixed,
            totalIssues: modalResult.issues.length + drawerResult.issues.length + dropdownResult.issues.length
        }
    };
    
    console.log('\n📊 综合测试结果:');
    console.log(`   总计找到: ${totalResult.summary.totalFound} 个浮层组件`);
    console.log(`   总计修复: ${totalResult.summary.totalFixed} 个`);
    console.log(`   总计问题: ${totalResult.summary.totalIssues} 个`);
    
    if (totalResult.summary.totalIssues === 0) {
        console.log('🎉 所有浮层组件都已正确应用暗色主题！');
    } else {
        console.log('⚠️  仍有问题需要修复');
        console.log('建议运行: fixOverlays() 来修复问题');
    }
    
    return totalResult;
}

// 检查特定的白底白字问题
function detectWhiteOnWhiteIssues() {
    console.log('🔍 检测白底白字问题...');
    
    const allElements = document.querySelectorAll('*');
    const issues = [];
    
    allElements.forEach((element, index) => {
        const el = element;
        
        // 跳过循环步骤卡片
        if (el.closest('.loop-step-card, .step-card, .white-background-allowed')) {
            return;
        }
        
        const style = window.getComputedStyle(el);
        const bgColor = style.backgroundColor;
        const textColor = style.color;
        
        // 检查是否是白底白字
        const isWhiteBg = bgColor === 'rgb(255, 255, 255)' || bgColor === 'white';
        const isWhiteText = textColor === 'rgb(255, 255, 255)' || textColor === 'white';
        
        if (isWhiteBg && isWhiteText && el.innerText && el.innerText.trim()) {
            issues.push({
                element: el,
                tagName: el.tagName,
                className: el.className,
                text: el.innerText.substring(0, 50) + (el.innerText.length > 50 ? '...' : ''),
                index: index
            });
        }
    });
    
    console.log(`🔍 发现 ${issues.length} 个白底白字问题:`);
    
    issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue.tagName}.${issue.className}: "${issue.text}"`);
        
        // 高亮显示问题元素
        issue.element.style.setProperty('outline', '2px dashed red', 'important');
        issue.element.style.setProperty('outline-offset', '2px', 'important');
    });
    
    return issues;
}

// 手动修复所有发现的白底白字问题
function fixWhiteOnWhiteIssues() {
    console.log('🔧 开始修复白底白字问题...');
    
    const issues = detectWhiteOnWhiteIssues();
    let fixedCount = 0;
    
    issues.forEach(issue => {
        const el = issue.element;
        
        // 应用暗色主题
        el.style.setProperty('background', 'var(--dark-bg-secondary)', 'important');
        el.style.setProperty('color', 'var(--dark-text-primary)', 'important');
        el.style.setProperty('border-color', 'var(--dark-border-primary)', 'important');
        
        // 移除高亮
        el.style.removeProperty('outline');
        el.style.removeProperty('outline-offset');
        
        fixedCount++;
    });
    
    console.log(`✅ 已修复 ${fixedCount} 个白底白字问题`);
    
    // 再次检测验证
    setTimeout(() => {
        const remainingIssues = detectWhiteOnWhiteIssues();
        if (remainingIssues.length === 0) {
            console.log('🎉 所有白底白字问题已解决！');
        } else {
            console.log(`⚠️  仍有 ${remainingIssues.length} 个问题需要进一步处理`);
        }
    }, 100);
}

// 导出所有测试函数到全局
window.testModalStyles = testModalStyles;
window.testDrawerStyles = testDrawerStyles;
window.testDropdownStyles = testDropdownStyles;
window.testAllOverlayStyles = testAllOverlayStyles;
window.detectWhiteOnWhiteIssues = detectWhiteOnWhiteIssues;
window.fixWhiteOnWhiteIssues = fixWhiteOnWhiteIssues;

console.log(`
🎭 浮层组件暗色主题测试工具已加载！

可用命令:
- testModalStyles()          : 测试模态框样式
- testDrawerStyles()         : 测试抽屉样式
- testDropdownStyles()       : 测试下拉菜单样式
- testAllOverlayStyles()     : 综合测试所有浮层组件
- detectWhiteOnWhiteIssues() : 检测白底白字问题
- fixWhiteOnWhiteIssues()    : 修复白底白字问题

推荐使用:
1. testAllOverlayStyles()      - 全面检测浮层组件
2. detectWhiteOnWhiteIssues()  - 检测具体问题
3. fixWhiteOnWhiteIssues()     - 一键修复问题
`);

// 自动运行初始检测
console.log('🔍 执行初始检测...');
testAllOverlayStyles();