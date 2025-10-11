// src/modules/adb/application/services/DiagnosticManagementService.ts
// module: adb | layer: application | role: app-service
// summary: 应用服务

// modules/adb/application/services | DiagnosticManagementService | 诊断管理专门服务
// 负责诊断检查、健康监控和自动修复，从巨型AdbApplicationService中拆分出来

import { DiagnosticResult, DiagnosticSummary } from '../../domain/entities/DiagnosticResult';
import { DiagnosticService } from '../../../../domain/adb/services/DiagnosticService';
import { StoreOperations } from '../../../../application/services/common';

/**
 * 诊断管理服务
 * 专门负责ADB诊断和健康检查相关的业务逻辑
 */
export class DiagnosticManagementService {
  constructor(
    private diagnosticService: DiagnosticService
  ) {}

  /**
   * 手动触发健康检查
   */
  async triggerHealthCheck(): Promise<DiagnosticSummary> {
    try {
      const summary = await this.diagnosticService.runQuickDiagnostic();
      
      // 更新存储中的诊断结果
      const diagnosticResults = this.diagnosticService.getLastDiagnosticResults();
      const store = StoreOperations.getStore();
      store.setDiagnosticResults(diagnosticResults);
      
      console.log(`🏥 [DiagnosticManagementService] 健康检查完成: ${summary.getHealthPercentage()}%`);
      return summary;
    } catch (error) {
      console.error('健康检查失败:', error);
      throw error;
    }
  }

  /**
   * 运行快速诊断
   */
  async runQuickDiagnostic(): Promise<DiagnosticSummary> {
    return await this.triggerHealthCheck();
  }

  /**
   * 运行完整诊断
   */
  async runFullDiagnostic(): Promise<DiagnosticResult[]> {
    try {
      await this.diagnosticService.runFullDiagnostic();
      
      // 从诊断服务中获取最后的结果
      const diagnosticResults = this.diagnosticService.getLastDiagnosticResults();
      const store = StoreOperations.getStore();
      store.setDiagnosticResults(diagnosticResults);
      
      console.log(`🔍 [DiagnosticManagementService] 完整诊断完成，发现 ${diagnosticResults.length} 项检查`);
      return diagnosticResults;
    } catch (error) {
      console.error('完整诊断失败:', error);
      throw error;
    }
  }

  /**
   * 执行自动修复
   */
  async executeAutoFix(): Promise<boolean> {
    try {
      // 运行诊断找到问题
      const diagnosticSummary = await this.runQuickDiagnostic();
      
      if (diagnosticSummary.hasErrors()) {
        // 执行诊断结果中的自动修复
        const results = this.getDiagnosticReport();
        let fixCount = 0;
        
        for (const result of results) {
          if (result.isAutoFixable()) {
            try {
              const fixed = await result.executeAutoFix();
              if (fixed) {
                fixCount++;
                console.log(`🔧 [DiagnosticManagementService] 已修复: ${result.name}`);
              }
            } catch (error) {
              console.error(`修复失败 ${result.name}:`, error);
            }
          }
        }
        
        console.log(`✅ [DiagnosticManagementService] 自动修复完成，修复了 ${fixCount} 个问题`);
        return fixCount > 0;
      }
      
      return false;
    } catch (error) {
      console.error('自动修复失败:', error);
      return false;
    }
  }

  /**
   * 获取诊断报告
   */
  getDiagnosticReport(): DiagnosticResult[] {
    const store = StoreOperations.getStore();
    return store.diagnosticResults;
  }

  /**
   * 获取诊断摘要
   */
  getDiagnosticSummary(): DiagnosticSummary | null {
    const results = this.getDiagnosticReport();
    if (results.length === 0) return null;
    
    return DiagnosticSummary.fromResults(results);
  }

  /**
   * 检查系统健康度
   */
  async checkSystemHealth(): Promise<number> {
    const summary = await this.runQuickDiagnostic();
    return summary.getHealthPercentage();
  }

  /**
   * 清除诊断历史
   */
  clearDiagnosticHistory(): void {
    const store = StoreOperations.getStore();
    store.setDiagnosticResults([]);
    console.log('🗑️ [DiagnosticManagementService] 诊断历史已清除');
  }
}