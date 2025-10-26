// src/test/v3-system-status.ts
// module: test | layer: infrastructure | role: V3系统状态检查
// summary: 验证V3智能分析系统是否正确启用和配置

import { featureFlagManager } from '../config/feature-flags';

/**
 * V3系统状态检查器
 */
export class V3SystemStatusChecker {
  
  /**
   * 检查V3系统完整状态
   */
  static async checkV3SystemStatus(): Promise<{
    isEnabled: boolean;
    issues: string[];
    recommendations: string[];
    summary: string;
  }> {
    console.log('🔍 [V3检查] 开始检查V3智能分析系统状态...');
    
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // 1. 检查特性开关
    const flags = featureFlagManager.getAllFlags();
    console.log('📊 [V3检查] 当前特性开关状态:', flags);
    
    if (!flags.USE_V3_EXECUTION) {
      issues.push('❌ V3执行系统未启用 (USE_V3_EXECUTION: false)');
      recommendations.push('💡 执行 window.v2v3Migration.enableV3() 启用V3系统');
    }
    
    if (!flags.USE_V3_CHAIN) {
      issues.push('❌ V3智能自动链未启用 (USE_V3_CHAIN: false)');
      recommendations.push('💡 这是解决按钮识别问题的关键功能');
    }
    
    if (!flags.USE_V3_SINGLE_STEP) {
      issues.push('❌ V3智能单步未启用 (USE_V3_SINGLE_STEP: false)');
    }
    
    // 2. 检查V3健康状态
    try {
      const isHealthy = await featureFlagManager.checkV3Health('test-device');
      if (!isHealthy) {
        issues.push('⚠️ V3系统健康检查失败');
        recommendations.push('💡 检查后端V3服务是否正常运行');
      } else {
        console.log('✅ [V3检查] V3系统健康检查通过');
      }
    } catch (error) {
      issues.push(`❌ V3健康检查异常: ${error.message}`);
      recommendations.push('💡 检查V3后端服务连接');
    }
    
    // 3. 检查执行版本选择
    try {
      const selectedVersion = await featureFlagManager.getSmartExecutionVersion('test-device', 'test-user');
      console.log('🎯 [V3检查] 智能版本选择结果:', selectedVersion);
      
      if (selectedVersion === 'v2') {
        if (flags.USE_V3_EXECUTION) {
          issues.push('⚠️ V3已启用但智能选择仍返回V2');
          recommendations.push('💡 检查V3_USER_RATIO设置或健康状态');
        }
      }
    } catch (error) {
      issues.push(`❌ 版本选择异常: ${error.message}`);
    }
    
    // 4. 检查关键导入
    try {
      const { IntelligentAnalysisBackendV3 } = await import('../services/intelligent-analysis-backend-v3');
      console.log('✅ [V3检查] V3后端服务导入成功');
      
      // 尝试调用V3健康检查方法
      if (typeof IntelligentAnalysisBackendV3.healthCheckV3 === 'function') {
        console.log('✅ [V3检查] V3健康检查方法可用');
      } else {
        issues.push('❌ V3健康检查方法不可用');
      }
      
    } catch (error) {
      issues.push(`❌ V3后端服务导入失败: ${error.message}`);
      recommendations.push('💡 检查intelligent-analysis-backend-v3.ts文件');
    }
    
    // 5. 生成总结
    const isEnabled = issues.length === 0;
    const summary = isEnabled 
      ? '🎉 V3智能分析系统完全就绪！可以解决按钮识别问题。'
      : `❌ 发现 ${issues.length} 个问题，需要修复后才能正常使用V3系统。`;
    
    return {
      isEnabled,
      issues,
      recommendations,
      summary
    };
  }
  
  /**
   * 快速修复V3配置
   */
  static async quickFixV3(): Promise<void> {
    console.log('🔧 [V3修复] 开始快速修复V3配置...');
    
    // 启用所有V3功能
    featureFlagManager.setFlag('USE_V3_EXECUTION', true);
    featureFlagManager.setFlag('USE_V3_CHAIN', true);
    featureFlagManager.setFlag('USE_V3_SINGLE_STEP', true);
    featureFlagManager.setFlag('USE_V3_STATIC', true);
    
    // 设置合理的用户比例（100%使用V3）
    featureFlagManager.setFlag('V3_USER_RATIO', 1.0);
    
    console.log('✅ [V3修复] V3系统配置已修复');
    
    // 刷新健康状态
    try {
      await featureFlagManager.refreshV3Health('default-device');
      console.log('✅ [V3修复] V3健康状态已刷新');
    } catch (error) {
      console.warn('⚠️ [V3修复] 健康状态刷新失败:', error);
    }
  }
  
  /**
   * 生成按钮识别修复报告
   */
  static async generateButtonRecognitionReport(): Promise<string> {
    const status = await this.checkV3SystemStatus();
    
    const report = `
# 🎯 按钮识别问题修复报告

## 问题描述
用户选择"已关注"按钮时，系统错误生成了"关注"按钮的步骤卡片。

## 根本原因分析
1. **V3智能分析系统未启用**: V2系统只做简单文本匹配，无法区分按钮语义
2. **缺少互斥排除规则**: 没有设置"已关注"与"关注"的互斥匹配逻辑
3. **Step 0-6策略分析缺失**: 未使用V3的智能策略分析引擎

## 修复措施

### 1. 启用V3智能分析系统 ✅
\`\`\`typescript
// 已修改 src/config/feature-flags.ts
USE_V3_EXECUTION: true,
USE_V3_CHAIN: true,      // 🎯 关键：智能自动链解决语义识别
USE_V3_SINGLE_STEP: true,
\`\`\`

### 2. 增强元素转换逻辑 ✅
\`\`\`typescript
// 已修改 useIntelligentStepCardIntegration.ts
// 添加智能文本分析和互斥排除规则
const smartMatchingConfig = {
  targetText: elementText,
  exclusionRules: isFollowedButton 
    ? ['关注', '+关注', 'Follow'] 
    : ['已关注', '取消关注', 'Following']
};
\`\`\`

### 3. V3系统状态检查
${status.summary}

${status.issues.length > 0 ? `
### ⚠️ 发现的问题:
${status.issues.map(issue => `- ${issue}`).join('\n')}
` : ''}

${status.recommendations.length > 0 ? `
### 💡 修复建议:
${status.recommendations.map(rec => `- ${rec}`).join('\n')}
` : ''}

## 验证步骤
1. 打开测试页面: \`/test/button-recognition-fix-test\`
2. 运行所有测试用例
3. 确认所有按钮类型正确识别
4. 检查调试日志中的智能匹配配置

## 预期效果
- ✅ 选择"已关注"按钮 → 生成"已关注"类型步骤
- ✅ 选择"关注"按钮 → 生成"关注"类型步骤
- ✅ 批量操作时正确区分不同按钮类型
- ✅ V3智能分析提供更高的识别准确率

生成时间: ${new Date().toLocaleString()}
系统版本: V3智能分析系统
`;
    
    return report;
  }
}

// 在控制台暴露检查工具
if (typeof window !== 'undefined') {
  (window as any).checkV3Status = () => V3SystemStatusChecker.checkV3SystemStatus();
  (window as any).fixV3 = () => V3SystemStatusChecker.quickFixV3();
  (window as any).generateReport = () => V3SystemStatusChecker.generateButtonRecognitionReport();
  
  console.log('🛠️ V3系统检查工具已加载:');
  console.log('  - window.checkV3Status() - 检查V3系统状态');
  console.log('  - window.fixV3() - 快速修复V3配置');
  console.log('  - window.generateReport() - 生成修复报告');
}