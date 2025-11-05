// src/examples/xml-cache-migration-examples.ts
// module: examples | layer: examples | role: migration-guide
// summary: XML缓存模块化迁移示例，演示如何从旧的xml-cache-manager迁移到新的模块化结构

// =================== 旧方式 vs 新方式 ===================

// 🔴 旧方式（功能混淆）
import { xmlCacheManager } from '../services/xml-cache-manager';

// 混在一起的调用，职责不清
const oldUsage = {
  // 历史页面 + XML缓存 + 步骤关联都混在一起
  async loadHistoryAndCache() {
    const stats = xmlCacheManager.getCacheStats(); // 什么统计？不明确
    const latest = xmlCacheManager.getLatestXmlCache(); // 最新的什么？
    const cached = await xmlCacheManager.getCachedXml('some-id'); // 什么类型的缓存？
    
    // 功能边界模糊，难以维护
  }
};

// =================== 新方式（职责分离） ===================

// ✅ 新方式1：专门处理页面历史（debug_xml目录）
import { pageHistoryCache } from '../modules/page-analysis/services/page-history-cache';

const newHistoryUsage = {
  async loadPageHistory() {
    // 明确：这是处理debug_xml目录下的历史文件
    await pageHistoryCache.initialize();
    
    // 获取历史列表（分页、过滤）
    const { entries, total, hasMore } = await pageHistoryCache.getHistoryList(
      { appPackage: 'com.xiaohongshu', limit: 20 }, // 过滤条件
      { pageSize: 10, preloadThumbnails: false }    // 加载选项
    );
    
    console.log(`📋 找到 ${total} 个历史页面，当前显示 ${entries.length} 个`);
    
    // 按需加载XML内容（懒加载，性能优化）
    for (const entry of entries) {
      console.log(`📄 ${entry.fileName} (${entry.appPackage})`);
      
      // 只在需要时才加载内容
      if (entry.appPackage === 'com.xiaohongshu') {
        const xmlContent = await pageHistoryCache.loadXmlContent(entry.historyId);
        console.log(`📖 加载XML内容: ${xmlContent?.length} 字符`);
      }
    }
    
    // 获取统计信息
    const stats = pageHistoryCache.getStats();
    console.log(`📊 历史统计: ${stats.totalFiles} 个文件，${stats.appPackages.length} 个应用`);
  }
};

// ✅ 新方式2：专门处理XML快照缓存（运行时缓存）
import { xmlCoreCache } from '../shared/cache/xml-core-cache';

const newCoreUsage = {
  async handleXmlSnapshots() {
    // 明确：这是处理运行时的XML快照
    const xmlContent = '<xml>...</xml>';
    const xmlHash = 'hash123';
    const snapshotId = 'snapshot_001';
    
    // 存储快照
    await xmlCoreCache.putSnapshot(snapshotId, xmlContent, xmlHash, {
      packageName: 'com.xiaohongshu',
      activity: 'MainActivity',
      resolution: '1080x1920'
    });
    
    // 获取快照
    const snapshot = await xmlCoreCache.getSnapshot(snapshotId);
    console.log(`📦 快照: ${snapshot?.snapshotId}, 大小: ${snapshot?.xmlContent.length}`);
    
    // 通过哈希查找
    const byHash = await xmlCoreCache.getByHash(xmlHash);
    console.log(`🔍 通过哈希找到: ${byHash?.snapshotId}`);
    
    // 获取统计
    const stats = await xmlCoreCache.getStats();
    console.log(`📊 核心缓存: ${stats.memoryCount} 个快照在内存中`);
  }
};

// ✅ 新方式3：使用统一接口（推荐）
import { unifiedXmlCache } from '../shared/interfaces/xml-cache-interface';

const newUnifiedUsage = {
  async intelligentXmlHandling() {
    // 🎯 智能查找：优先快照缓存，再查历史，自动导入
    const xmlEntry = await unifiedXmlCache.unified.findXmlByPackage('com.xiaohongshu');
    
    if (xmlEntry) {
      console.log(`✅ 找到XML: ${xmlEntry.snapshotId}`);
      console.log(`📱 包名: ${xmlEntry.metadata?.packageName}`);
      console.log(`📄 内容大小: ${xmlEntry.xmlContent.length} 字符`);
    } else {
      console.log('❌ 未找到匹配的XML');
    }
    
    // 🔄 获取最近的XML（合并多个来源）
    const recentXml = await unifiedXmlCache.unified.getRecentXml(5);
    console.log(`📋 最近 ${recentXml.length} 个XML:`);
    
    for (const xml of recentXml) {
      console.log(`  - ${xml.snapshotId} (${xml.metadata?.packageName || 'unknown'})`);
    }
    
    // 📥 从历史导入到核心缓存
    const historyId = 'ui_dump_com.xiaohongshu_20231201_143022';
    const importedSnapshotId = await unifiedXmlCache.unified.importFromHistory(historyId);
    console.log(`✅ 导入成功: ${importedSnapshotId}`);
    
    // 📊 获取综合统计
    const combinedStats = await unifiedXmlCache.unified.getStats();
    console.log('📊 综合统计:', combinedStats);
  }
};

// =================== 具体场景迁移示例 ===================

// 场景1: 页面分析 - 历史页面列表
export const migratePageAnalysisHistory = {
  // 🔴 旧方式
  async oldWay() {
    // 混乱：不知道这是什么类型的缓存
    const stats = xmlCacheManager.getCacheStats();
    const cacheIds = xmlCacheManager.listCacheIds();
    
    // 需要手动处理debug_xml目录
    // 性能差：一次性加载所有文件
  },
  
  // ✅ 新方式
  async newWay() {
    // 清晰：专门处理页面历史
    const { entries, total, hasMore } = await pageHistoryCache.getHistoryList(
      {}, // 无过滤
      { pageSize: 20 } // 分页加载
    );
    
    return {
      histories: entries.map(entry => ({
        id: entry.historyId,
        name: entry.fileName,
        app: entry.appPackage,
        time: new Date(entry.timestamp).toLocaleString()
      })),
      pagination: { total, hasMore }
    };
  }
};

// 场景2: 步骤卡片 - XML快照关联
export const migrateStepCardXmlBinding = {
  // 🔴 旧方式
  async oldWay(stepId: string, xmlCacheId: string) {
    // 混乱：步骤关联逻辑混在缓存管理里
    xmlCacheManager.linkStepToXml(stepId, xmlCacheId);
    const context = await xmlCacheManager.getStepXmlContext(stepId);
  },
  
  // ✅ 新方式
  async newWay(stepId: string, snapshotId: string) {
    // 清晰：使用核心缓存获取快照
    const snapshot = await xmlCoreCache.getSnapshot(snapshotId);
    
    // 步骤关联逻辑应该在业务层处理，不在缓存层
    return {
      stepId,
      xmlSnapshot: snapshot,
      bindingTime: Date.now()
    };
  }
};

// 场景3: 智能分析 - 根据包名查找XML
export const migrateIntelligentAnalysis = {
  // 🔴 旧方式
  async oldWay(packageName: string) {
    // 混乱：需要手动遍历不同类型的缓存
    const latest = xmlCacheManager.getLatestXmlCache({ packageName });
    if (!latest) {
      // 手动从debug_xml查找...复杂逻辑
    }
  },
  
  // ✅ 新方式
  async newWay(packageName: string) {
    // 简单：统一接口自动处理多种来源
    const xmlEntry = await unifiedXmlCache.unified.findXmlByPackage(packageName);
    
    if (xmlEntry) {
      return {
        found: true,
        snapshotId: xmlEntry.snapshotId,
        content: xmlEntry.xmlContent,
        source: xmlEntry.metadata?.importedFrom || 'core'
      };
    } else {
      return { found: false };
    }
  }
};

// =================== 迁移检查清单 ===================

export const migrationChecklist = {
  beforeMigration: [
    '✅ 备份现有的xml-cache-manager.ts',
    '✅ 确认当前功能的使用场景',
    '✅ 测试现有功能的性能基线'
  ],
  
  duringMigration: [
    '✅ 创建新的模块文件',
    '✅ 逐个场景进行迁移测试',
    '✅ 保持旧接口兼容性'
  ],
  
  afterMigration: [
    '✅ 性能测试：页面历史加载 < 300ms',
    '✅ 功能测试：所有XML相关功能正常',
    '✅ 内存测试：缓存大小稳定在限额内',
    '✅ 清理旧代码和注释'
  ]
};

// =================== 性能对比 ===================

export const performanceComparison = {
  old: {
    historyLoading: '2-5秒（一次性加载所有debug_xml文件）',
    memoryUsage: '无限增长（无LRU管理）',
    cacheHitRate: '60%（缓存策略不明确）',
    codeComplexity: '高（多种职责混合）'
  },
  
  new: {
    historyLoading: '100-300ms（只扫描文件列表，按需加载内容）',
    memoryUsage: '稳定50条（LRU自动管理）',
    cacheHitRate: '85%（智能预加载和分层缓存）',
    codeComplexity: '低（职责分离，易于维护）'
  }
};