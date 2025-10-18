#!/usr/bin/env node
// scripts/collect-event-evidence.mjs
// module: ci-scripts | layer: infrastructure | role: 事件流证据收集器
// summary: 自动收集智能分析事件流，生成证据包用于CI质量验证

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

/**
 * 事件流证据收集器
 * 用于CI环境下自动验证事件流的完整性和合规性
 */
class EventEvidenceCollector {
  constructor() {
    this.evidencePath = path.join(projectRoot, 'reports', 'event-evidence');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  }

  async initialize() {
    await fs.mkdir(this.evidencePath, { recursive: true });
  }

  /**
   * 扫描源码中的事件使用情况
   */
  async scanEventUsage() {
    const srcPath = path.join(projectRoot, 'src');
    const evidence = {
      timestamp: this.timestamp,
      eventConstantsUsage: 0,
      hardcodedEvents: [],
      eventFlowFiles: [],
      summary: {}
    };

    try {
      // 递归扫描所有 .ts/.tsx 文件
      const files = await this.scanDirectory(srcPath, /\.(ts|tsx)$/);
      
      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        const relativePath = path.relative(srcPath, file);
        
        // 检查 EVENTS 常量使用
        const eventsMatches = content.match(/EVENTS\.\w+/g) || [];
        evidence.eventConstantsUsage += eventsMatches.length;
        
        // 检查潜在的硬编码事件字符串
        const hardcodedMatches = content.match(/"[a-z_-]*_(progress|completed|failed|started|error)"/g) || [];
        if (hardcodedMatches.length > 0) {
          // 排除在 EVENTS 定义文件中的合法硬编码
          if (!relativePath.includes('constants/events')) {
            evidence.hardcodedEvents.push({
              file: relativePath,
              matches: hardcodedMatches
            });
          }
        }
        
        // 识别事件流相关文件
        if (content.includes('listen') || content.includes('emit') || content.includes('intelligent_analysis')) {
          evidence.eventFlowFiles.push({
            file: relativePath,
            hasListeners: content.includes('listen'),
            hasEmitters: content.includes('emit'),
            hasAnalysisFlow: content.includes('intelligent_analysis')
          });
        }
      }
      
      // 生成汇总统计
      evidence.summary = {
        totalFiles: files.length,
        eventConstantsUsage: evidence.eventConstantsUsage,
        hardcodedEventFiles: evidence.hardcodedEvents.length,
        eventFlowFiles: evidence.eventFlowFiles.length,
        complianceScore: this.calculateComplianceScore(evidence)
      };
      
      return evidence;
    } catch (error) {
      console.error('Error scanning event usage:', error);
      return { error: error.message, timestamp: this.timestamp };
    }
  }

  /**
   * 计算事件合规性评分
   */
  calculateComplianceScore(evidence) {
    const totalEventUsage = evidence.eventConstantsUsage + evidence.hardcodedEvents.length;
    if (totalEventUsage === 0) return 100;
    
    const complianceRatio = evidence.eventConstantsUsage / totalEventUsage;
    return Math.round(complianceRatio * 100);
  }

  /**
   * 递归扫描目录
   */
  async scanDirectory(dirPath, pattern) {
    const files = [];
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          // 跳过 node_modules 和其他非源码目录
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
            files.push(...await this.scanDirectory(fullPath, pattern));
          }
        } else if (entry.isFile() && pattern.test(entry.name)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Cannot scan directory ${dirPath}:`, error.message);
    }
    
    return files;
  }

  /**
   * 分析 E2E 测试结果
   */
  async analyzeE2EResults() {
    const e2eResultsPath = path.join(projectRoot, 'test-results');
    const evidence = {
      timestamp: this.timestamp,
      testResults: [],
      eventFlowLogs: [],
      summary: {}
    };

    try {
      // 查找 E2E 测试结果文件
      const resultFiles = await this.scanDirectory(e2eResultsPath, /event-flow.*\.json$/);
      
      for (const file of resultFiles) {
        try {
          const content = await fs.readFile(file, 'utf-8');
          const data = JSON.parse(content);
          evidence.eventFlowLogs.push({
            file: path.basename(file),
            events: data,
            eventCount: Array.isArray(data) ? data.length : 0
          });
        } catch (error) {
          console.warn(`Cannot parse E2E result file ${file}:`, error.message);
        }
      }
      
      evidence.summary = {
        totalLogFiles: evidence.eventFlowLogs.length,
        totalEvents: evidence.eventFlowLogs.reduce((sum, log) => sum + log.eventCount, 0)
      };
      
    } catch (error) {
      console.warn('E2E results directory not found or empty');
      evidence.summary = { totalLogFiles: 0, totalEvents: 0 };
    }
    
    return evidence;
  }

  /**
   * 生成完整的证据包
   */
  async generateEvidencePackage() {
    await this.initialize();
    
    console.log('🔍 Collecting event flow evidence...');
    
    // 收集源码扫描证据
    const sourceEvidence = await this.scanEventUsage();
    await this.saveEvidence('source-scan', sourceEvidence);
    
    // 收集 E2E 测试证据
    const e2eEvidence = await this.analyzeE2EResults();
    await this.saveEvidence('e2e-results', e2eEvidence);
    
    // 生成汇总报告
    const summaryReport = this.generateSummaryReport(sourceEvidence, e2eEvidence);
    await this.saveEvidence('summary', summaryReport);
    
    console.log('📊 Event flow evidence collected:');
    console.log(`   - Source files scanned: ${sourceEvidence.summary?.totalFiles || 0}`);
    console.log(`   - Event constants usage: ${sourceEvidence.summary?.eventConstantsUsage || 0}`);
    console.log(`   - Hardcoded events found: ${sourceEvidence.summary?.hardcodedEventFiles || 0}`);
    console.log(`   - Compliance score: ${sourceEvidence.summary?.complianceScore || 0}%`);
    console.log(`   - E2E event logs: ${e2eEvidence.summary?.totalLogFiles || 0}`);
    console.log(`   - Total events captured: ${e2eEvidence.summary?.totalEvents || 0}`);
    
    return summaryReport;
  }

  /**
   * 生成汇总报告
   */
  generateSummaryReport(sourceEvidence, e2eEvidence) {
    return {
      timestamp: this.timestamp,
      buildInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        ci: !!process.env.CI
      },
      sourceAnalysis: sourceEvidence.summary || {},
      e2eAnalysis: e2eEvidence.summary || {},
      recommendations: this.generateRecommendations(sourceEvidence),
      qualityGate: this.evaluateQualityGate(sourceEvidence, e2eEvidence)
    };
  }

  /**
   * 生成改进建议
   */
  generateRecommendations(sourceEvidence) {
    const recommendations = [];
    
    if (sourceEvidence.summary?.complianceScore < 80) {
      recommendations.push({
        priority: 'high',
        category: 'event-constants',
        message: `事件常量化合规性较低 (${sourceEvidence.summary.complianceScore}%)，建议将硬编码事件字符串替换为 EVENTS 常量`
      });
    }
    
    if (sourceEvidence.hardcodedEvents?.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'hardcoded-events',
        message: `发现 ${sourceEvidence.hardcodedEvents.length} 个文件包含硬编码事件字符串`,
        files: sourceEvidence.hardcodedEvents.map(item => item.file)
      });
    }
    
    if (sourceEvidence.summary?.eventFlowFiles < 5) {
      recommendations.push({
        priority: 'low',
        category: 'event-coverage',
        message: '事件流覆盖较少，建议增加更多组件的事件监听和发送'
      });
    }
    
    return recommendations;
  }

  /**
   * 评估质量门控状态
   */
  evaluateQualityGate(sourceEvidence, e2eEvidence) {
    const gates = {
      eventConstants: {
        passed: (sourceEvidence.summary?.complianceScore || 0) >= 70,
        score: sourceEvidence.summary?.complianceScore || 0,
        threshold: 70
      },
      hardcodedEvents: {
        passed: (sourceEvidence.summary?.hardcodedEventFiles || 0) <= 3,
        count: sourceEvidence.summary?.hardcodedEventFiles || 0,
        threshold: 3
      },
      e2eCoverage: {
        passed: (e2eEvidence.summary?.totalEvents || 0) > 0,
        count: e2eEvidence.summary?.totalEvents || 0,
        threshold: 1
      }
    };
    
    const allPassed = Object.values(gates).every(gate => gate.passed);
    
    return {
      status: allPassed ? 'PASS' : 'FAIL',
      gates,
      overallScore: Object.values(gates).filter(gate => gate.passed).length / Object.keys(gates).length * 100
    };
  }

  /**
   * 保存证据文件
   */
  async saveEvidence(type, data) {
    const filename = `${type}-${this.timestamp}.json`;
    const filepath = path.join(this.evidencePath, filename);
    
    await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`📝 Evidence saved: ${filename}`);
  }
}

// 主执行逻辑
async function main() {
  const collector = new EventEvidenceCollector();
  
  try {
    const summary = await collector.generateEvidencePackage();
    
    // 输出到 stdout 供 CI 使用
    console.log('\n=== QUALITY GATE RESULT ===');
    console.log(JSON.stringify(summary.qualityGate, null, 2));
    
    // 根据质量门控结果决定退出码
    if (summary.qualityGate.status === 'FAIL') {
      console.error('\n❌ Quality gate FAILED');
      process.exit(1);
    } else {
      console.log('\n✅ Quality gate PASSED');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Evidence collection failed:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { EventEvidenceCollector };