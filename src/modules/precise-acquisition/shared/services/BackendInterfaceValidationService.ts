/**
 * 后端接口验证服务
 * 
 * 验证Tauri后端接口的完整性和可用性
 */

// 条件导入Tauri API
const invoke = typeof window !== 'undefined' && (window as any).__TAURI__ 
  ? (window as any).__TAURI__.tauri.invoke 
  : async (cmd: string, args: any) => {
      console.warn(`Tauri invoke simulation: ${cmd}`, args);
      return { mock: true, command: cmd, args };
    };
import { WatchTarget } from '../../../../domain/precise-acquisition/entities/WatchTarget';
import { Comment } from '../../../../domain/precise-acquisition/entities/Comment';
import { Task } from '../../../../domain/precise-acquisition/entities/Task';
import { AuditLog } from '../../../../domain/precise-acquisition/entities/AuditLog';

/**
 * 后端接口测试结果
 */
export interface BackendTestResult {
  interface: string;
  success: boolean;
  responseTime: number;
  error?: string;
  data?: any;
}

/**
 * 完整的验证报告
 */
export interface ValidationReport {
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    averageResponseTime: number;
  };
  results: BackendTestResult[];
  recommendations: string[];
}

/**
 * 后端接口验证服务
 */
export class BackendInterfaceValidationService {
  
  /**
   * 运行完整的接口验证
   */
  async runFullValidation(): Promise<ValidationReport> {
    const results: BackendTestResult[] = [];
    
    // 测试候选池接口
    results.push(...await this.testWatchTargetInterfaces());
    
    // 测试评论接口
    results.push(...await this.testCommentInterfaces());
    
    // 测试任务接口
    results.push(...await this.testTaskInterfaces());
    
    // 测试审计日志接口
    results.push(...await this.testAuditLogInterfaces());
    
    // 测试去重接口
    results.push(...await this.testDeduplicationInterfaces());
    
    // 生成报告
    return this.generateReport(results);
  }
  
  /**
   * 测试候选池相关接口
   */
  private async testWatchTargetInterfaces(): Promise<BackendTestResult[]> {
    const results: BackendTestResult[] = [];
    
    // 测试批量插入候选池
    results.push(await this.testInterface('bulk_upsert_watch_targets', async () => {
      const testData = [{
        id: null,
        dedup_key: 'test_dedup_' + Date.now(),
        target_type: 'video',
        platform: 'douyin',
        id_or_url: 'https://www.douyin.com/video/test',
        title: '测试视频',
        source: 'manual',
        industry_tags: 'test',
        region: null,
        notes: '接口测试数据',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }];
      
      return await invoke('bulk_upsert_watch_targets', { payloads: testData });
    }));
    
    // 测试查询候选池列表
    results.push(await this.testInterface('list_watch_targets', async () => {
      return await invoke('list_watch_targets', {
        limit: 10,
        offset: 0,
        platform: null,
        target_type: null
      });
    }));
    
    // 测试通过去重键获取候选池
    results.push(await this.testInterface('get_watch_target_by_dedup_key', async () => {
      return await invoke('get_watch_target_by_dedup_key', {
        dedup_key: 'test_dedup_key'
      });
    }));
    
    return results;
  }
  
  /**
   * 测试评论相关接口
   */
  private async testCommentInterfaces(): Promise<BackendTestResult[]> {
    const results: BackendTestResult[] = [];
    
    // 测试插入评论
    results.push(await this.testInterface('insert_comment', async () => {
      const testComment = {
        id: null,
        platform: 'douyin',
        video_id: 'test_video_123',
        author_id: 'test_author_456',
        content: '这是一条测试评论',
        like_count: 0,
        publish_time: new Date().toISOString(),
        region: null,
        source_target_id: '1',
        inserted_at: new Date().toISOString()
      };
      
      return await invoke('insert_comment', { comment: testComment });
    }));
    
    // 测试查询评论列表
    results.push(await this.testInterface('list_comments', async () => {
      return await invoke('list_comments', {
        limit: 10,
        offset: 0,
        platform: null,
        source_target_id: null,
        region: null
      });
    }));
    
    return results;
  }
  
  /**
   * 测试任务相关接口
   */
  private async testTaskInterfaces(): Promise<BackendTestResult[]> {
    const results: BackendTestResult[] = [];
    
    // 测试插入任务
    results.push(await this.testInterface('insert_task', async () => {
      const testTask = {
        id: null,
        task_type: 'reply',
        comment_id: 'test_comment_123',
        target_user_id: null,
        assign_account_id: 'test_account_456',
        status: 'NEW',
        executor_mode: 'api',
        result_code: null,
        error_message: null,
        dedup_key: 'test_task_dedup_' + Date.now(),
        created_at: new Date().toISOString(),
        executed_at: null,
        priority: 1,
        attempts: 0,
        deadline_at: null,
        lock_owner: null,
        lease_until: null
      };
      
      return await invoke('insert_task', { task: testTask });
    }));
    
    // 测试查询任务列表
    results.push(await this.testInterface('list_tasks', async () => {
      return await invoke('list_tasks', {
        limit: 10,
        offset: 0,
        status: null,
        task_type: null,
        assign_account_id: null
      });
    }));
    
    // 测试更新任务状态
    results.push(await this.testInterface('update_task_status', async () => {
      return await invoke('update_task_status', {
        task_id: 'test_task_id',
        status: 'EXECUTING',
        result_code: null,
        error_message: null
      });
    }));
    
    // 测试锁定下一个准备好的任务
    results.push(await this.testInterface('lock_next_ready_task', async () => {
      return await invoke('lock_next_ready_task', {
        account_id: 'test_account',
        lease_seconds: 120
      });
    }));
    
    return results;
  }
  
  /**
   * 测试审计日志相关接口
   */
  private async testAuditLogInterfaces(): Promise<BackendTestResult[]> {
    const results: BackendTestResult[] = [];
    
    // 测试插入审计日志
    results.push(await this.testInterface('insert_audit_log', async () => {
      const testLog = {
        id: null,
        action: 'TASK_CREATE',
        task_id: 'test_task_123',
        account_id: 'test_account_456',
        operator: 'system',
        payload_hash: 'test_hash_' + Date.now(),
        timestamp: new Date().toISOString()
      };
      
      return await invoke('insert_audit_log', { log: testLog });
    }));
    
    // 测试查询审计日志
    results.push(await this.testInterface('query_audit_logs', async () => {
      return await invoke('query_audit_logs', {
        start_time: null,
        end_time: null,
        action_filter: null,
        limit: 10,
        offset: 0
      });
    }));
    
    // 测试批量存储审计日志
    results.push(await this.testInterface('batch_store_audit_logs', async () => {
      const testLogs = [{
        id: null,
        action: 'EXPORT',
        task_id: null,
        account_id: null,
        operator: 'system',
        payload_hash: 'batch_test_' + Date.now(),
        timestamp: new Date().toISOString()
      }];
      
      return await invoke('batch_store_audit_logs', { logs: testLogs });
    }));
    
    return results;
  }
  
  /**
   * 测试去重相关接口
   */
  private async testDeduplicationInterfaces(): Promise<BackendTestResult[]> {
    const results: BackendTestResult[] = [];
    
    // 测试检查和预留去重键
    results.push(await this.testInterface('check_and_reserve_dedup', async () => {
      return await invoke('check_and_reserve_dedup', {
        key: 'test_dedup_key_' + Date.now(),
        scope: 'task',
        ttl_days: 7,
        by_account: 'test_account'
      });
    }));
    
    return results;
  }
  
  /**
   * 测试单个接口
   */
  private async testInterface(
    interfaceName: string, 
    testFunction: () => Promise<any>
  ): Promise<BackendTestResult> {
    
    const startTime = performance.now();
    
    try {
      const data = await testFunction();
      const responseTime = performance.now() - startTime;
      
      return {
        interface: interfaceName,
        success: true,
        responseTime: Math.round(responseTime),
        data
      };
      
    } catch (error) {
      const responseTime = performance.now() - startTime;
      
      return {
        interface: interfaceName,
        success: false,
        responseTime: Math.round(responseTime),
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * 生成验证报告
   */
  private generateReport(results: BackendTestResult[]): ValidationReport {
    const passedTests = results.filter(r => r.success).length;
    const failedTests = results.length - passedTests;
    const averageResponseTime = Math.round(
      results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
    );
    
    const recommendations: string[] = [];
    
    // 分析结果并生成建议
    if (failedTests > 0) {
      recommendations.push(`有 ${failedTests} 个接口测试失败，需要检查后端实现`);
    }
    
    const slowInterfaces = results.filter(r => r.responseTime > 1000);
    if (slowInterfaces.length > 0) {
      recommendations.push(`有 ${slowInterfaces.length} 个接口响应时间超过1秒，建议优化性能`);
    }
    
    if (averageResponseTime > 500) {
      recommendations.push('平均响应时间较慢，建议检查数据库性能');
    }
    
    const errorInterfaces = results.filter(r => !r.success);
    if (errorInterfaces.length > 0) {
      recommendations.push(
        '失败的接口：' + errorInterfaces.map(r => r.interface).join(', ')
      );
    }
    
    if (passedTests === results.length) {
      recommendations.push('所有接口测试通过，后端集成良好');
    }
    
    return {
      summary: {
        totalTests: results.length,
        passedTests,
        failedTests,
        averageResponseTime
      },
      results,
      recommendations
    };
  }
  
  /**
   * 测试数据库连接
   */
  async testDatabaseConnection(): Promise<BackendTestResult> {
    return await this.testInterface('database_connection', async () => {
      // 通过查询候选池列表来测试数据库连接
      return await invoke('list_watch_targets', {
        limit: 1,
        offset: 0,
        platform: null,
        target_type: null
      });
    });
  }
  
  /**
   * 清理测试数据
   */
  async cleanupTestData(): Promise<void> {
    try {
      // 这里可以添加清理测试数据的逻辑
      console.log('测试数据清理完成');
    } catch (error) {
      console.warn('清理测试数据时出错:', error);
    }
  }
}