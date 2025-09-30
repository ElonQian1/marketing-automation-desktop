/**
 * 菜单选中状态测试工具
 * 在浏览器控制台运行此脚本来测试菜单的选中状态样式
 */

// 测试菜单选中状态的样式
function testMenuSelectedState() {
    console.log('🔍 开始测试菜单选中状态...');
    
    const menuItems = document.querySelectorAll('.ant-menu-item');
    
    if (menuItems.length === 0) {
        console.log('❌ 未找到菜单项');
        return;
    }
    
    console.log(`📋 找到 ${menuItems.length} 个菜单项`);
    
    menuItems.forEach((item, index) => {
        const isSelected = item.classList.contains('ant-menu-item-selected');
        const computedStyle = window.getComputedStyle(item);
        const inlineStyle = item.getAttribute('style') || '(无内联样式)';
        
        console.log(`\n📝 菜单项 ${index + 1}:`);
        console.log(`   选中状态: ${isSelected ? '✅ 已选中' : '⚪ 未选中'}`);
        console.log(`   背景色: ${computedStyle.backgroundColor}`);
        console.log(`   文字颜色: ${computedStyle.color}`);
        console.log(`   左边框: ${computedStyle.borderLeft}`);
        console.log(`   内联样式: ${inlineStyle}`);
        
        if (isSelected) {
            console.log(`   🎯 选中项详细信息:`);
            console.log(`      CSS变量 --dark-bg-secondary: ${computedStyle.getPropertyValue('--dark-bg-secondary')}`);
            console.log(`      CSS变量 --dark-text-primary: ${computedStyle.getPropertyValue('--dark-text-primary')}`);
        }
    });
}

// 模拟点击不同菜单项来测试状态切换
function simulateMenuClicks() {
    console.log('🖱️ 开始模拟菜单点击测试...');
    
    const menuItems = document.querySelectorAll('.ant-menu-item');
    
    if (menuItems.length < 2) {
        console.log('❌ 需要至少2个菜单项来测试状态切换');
        return;
    }
    
    menuItems.forEach((item, index) => {
        setTimeout(() => {
            console.log(`\n🖱️ 点击菜单项 ${index + 1}...`);
            item.click();
            
            setTimeout(() => {
                testMenuSelectedState();
            }, 100);
        }, index * 2000);
    });
}

// 手动修复菜单样式（如果需要）
function fixMenuStyles() {
    console.log('🔧 手动修复菜单样式...');
    
    const menuItems = document.querySelectorAll('.ant-menu-item');
    
    menuItems.forEach(item => {
        // 清除内联样式，让CSS接管
        item.style.removeProperty('background');
        item.style.removeProperty('background-color');
        item.style.removeProperty('color');
        item.style.removeProperty('border-left');
        
        // 清除红色相关样式
        item.style.setProperty('box-shadow', 'none', 'important');
        item.style.setProperty('border-color', 'transparent', 'important');
    });
    
    console.log('✅ 菜单样式修复完成');
    testMenuSelectedState();
}

// 检查CSS变量
function checkCSSVariables() {
    console.log('🎨 检查CSS变量...');
    
    const root = document.documentElement;
    const style = window.getComputedStyle(root);
    
    const variables = [
        '--dark-bg-primary',
        '--dark-bg-secondary', 
        '--dark-bg-hover',
        '--dark-text-primary',
        '--dark-text-secondary',
        '--primary'
    ];
    
    variables.forEach(varName => {
        const value = style.getPropertyValue(varName);
        console.log(`   ${varName}: ${value || '(未定义)'}`);
    });
}

// 导出所有测试函数到全局
window.testMenuSelectedState = testMenuSelectedState;
window.simulateMenuClicks = simulateMenuClicks;
window.fixMenuStyles = fixMenuStyles;
window.checkCSSVariables = checkCSSVariables;

console.log(`
🎯 菜单选中状态测试工具已加载！

可用命令:
- testMenuSelectedState()     : 测试当前菜单选中状态
- simulateMenuClicks()        : 模拟点击所有菜单项
- fixMenuStyles()            : 手动修复菜单样式
- checkCSSVariables()        : 检查CSS变量定义

开始测试:
testMenuSelectedState()
`);

// 自动运行初始测试
testMenuSelectedState();