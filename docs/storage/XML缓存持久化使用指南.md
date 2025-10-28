# XML缓存持久化系统 - 使用指南

## 📚 概述

本系统提供了完整的XML缓存持久化解决方案，解决了页面刷新后数据丢失的问题。

### 核心特性

- ✅ **双层缓存**：内存（快速）+ IndexedDB（持久）
- ✅ **自动恢复**：页面刷新后自动从IndexedDB恢复所有缓存
- ✅ **自动清理**：定时清理过期数据（30天）和超量数据（500条）
- ✅ **存储统计**：实时监控存储使用情况
- ✅ **无感知使用**：开发者无需关心持久化细节，自动同步

---

## 🚀 快速开始

### 1. 基本使用

```typescript
import XmlCacheManager from '@/services/xml-cache-manager';

// 获取单例实例（自动初始化IndexedDB）
const manager = XmlCacheManager.getInstance();

// 保存XML快照（自动同步到IndexedDB）
manager.putXml(
  'xml_hash123_1234567890',  // cacheId
  xmlContent,                 // 完整XML内容
  'hash123...',              // XML哈希值
  new Date().toISOString()   // 创建时间（可选）
);

// 读取XML快照（优先从内存，未命中则从IndexedDB恢复）
const entry = await manager.getCachedXml('xml_hash123_1234567890');
if (entry) {
  console.log('找到缓存:', entry.cacheId);
  console.log('XML内容:', entry.xmlContent);
  console.log('创建时间:', new Date(entry.timestamp).toISOString());
}

// 通过hash查询
const entryByHash = await manager.getByHash('hash123...');
```

### 2. 页面刷新测试

```typescript
// Step 1: 保存一些数据
manager.putXml('test_1', '<xml>test1</xml>', 'hash1');
manager.putXml('test_2', '<xml>test2</xml>', 'hash2');
manager.putXml('test_3', '<xml>test3</xml>', 'hash3');

// Step 2: 刷新页面（Ctrl+R 或 F5）
// IndexedDB中的数据不会丢失

// Step 3: 页面加载后自动恢复
// XmlCacheManager初始化时会自动调用 restoreFromPersistentStorage()
// 所有数据已恢复到内存

// 验证
const entry1 = await manager.getCachedXml('test_1');
console.log('恢复成功:', entry1 !== null);  // ✅ true
```

---

## 📊 存储统计和监控

### 获取存储统计

```typescript
const stats = await manager.getStorageStats();

console.log('=== 存储统计 ===');
console.log('内存缓存:', stats.memory.count, '条');
console.log('持久化存储:', stats.persistent.count, '条');
console.log('总大小:', (stats.persistent.totalSizeBytes / 1024 / 1024).toFixed(2), 'MB');
console.log('平均大小:', (stats.persistent.avgSizeBytes / 1024).toFixed(2), 'KB');

// 示例输出:
// === 存储统计 ===
// 内存缓存: 127 条
// 持久化存储: 127 条
// 总大小: 15.32 MB
// 平均大小: 123.45 KB
```

### 获取详细统计（仅持久化存储）

```typescript
import { getPersistentStorage } from '@/services/storage/xml-persistent-storage';

const storage = getPersistentStorage();
await storage.initialize();

const detailedStats = await storage.getStats();

console.log('=== 详细统计 ===');
console.log('总条目数:', detailedStats.totalEntries);
console.log('最旧条目:', detailedStats.oldestEntry);
console.log('最新条目:', detailedStats.newestEntry);
console.log('总大小:', detailedStats.totalSizeBytes, '字节');
console.log('平均大小:', detailedStats.avgEntrySizeBytes, '字节');

// 示例输出:
// === 详细统计 ===
// 总条目数: 127
// 最旧条目: { cacheId: 'xml_abc123...', timestamp: 1704067200000 }
// 最新条目: { cacheId: 'xml_def456...', timestamp: 1706745600000 }
// 总大小: 16056320 字节
// 平均大小: 126425 字节
```

---

## 🧹 清理机制

### 自动清理（推荐）

系统会自动执行清理，无需手动干预：

- **触发时机**：每1小时自动执行一次
- **清理策略**：
  1. 删除超过30天的数据
  2. 如果总数 > 500条，删除最旧的数据

```typescript
// 自动清理会在后台执行，无需手动调用
// 如果需要修改清理配置，可以在初始化时设置：

import { getPersistentStorage } from '@/services/storage/xml-persistent-storage';

const storage = getPersistentStorage({
  maxEntries: 1000,          // 最大1000条（默认500）
  maxAgeDays: 60,            // 最大60天（默认30）
  autoCleanup: true,         // 启用自动清理（默认true）
  cleanupIntervalMs: 7200000 // 每2小时清理一次（默认1小时）
});
```

### 手动清理

```typescript
// 完整清理（过期 + 超量）
await manager.manualCleanup();
// 输出: ✅ 手动清理完成: 过期12条, 超量0条

// 只清理过期数据（超过30天）
await manager.cleanupExpiredCache(30 * 24 * 60 * 60 * 1000);
// 输出: 🧹 清理完成: 内存5条, 持久化7条

// 只清理过期数据（自定义天数）
await manager.cleanupExpiredCache(7 * 24 * 60 * 60 * 1000);  // 7天
```

### 清空所有缓存

```typescript
import { getPersistentStorage } from '@/services/storage/xml-persistent-storage';

const storage = getPersistentStorage();
await storage.clear();
// 输出: 🗑️ 所有XML缓存已清空

// 注意：这只会清空IndexedDB，不会清空内存缓存
// 如果需要同时清空内存，需要刷新页面或重新创建XmlCacheManager
```

---

## 🔧 高级用法

### 1. 批量保存

```typescript
import { getPersistentStorage } from '@/services/storage/xml-persistent-storage';

const storage = getPersistentStorage();

const entries: XmlCacheEntry[] = [
  {
    cacheId: 'xml_1',
    xmlContent: '<xml>...</xml>',
    xmlHash: 'hash1',
    timestamp: Date.now(),
    deviceId: 'device123',
    deviceName: 'Xiaomi 12',
    pageInfo: { ... }
  },
  // ... 更多条目
];

await storage.putBatch(entries);
// 输出: 💾 批量保存完成: 50/50条
```

### 2. 精确查询

```typescript
// 按cacheId查询
const entry1 = await manager.getCachedXml('xml_hash123_1234567890');

// 按xmlHash查询
const entry2 = await manager.getByHash('5c595fdf...');

// 列出所有cacheId
const cacheIds = manager.listCacheIds();
console.log('所有缓存ID:', cacheIds);

// 获取最新的缓存（带元数据匹配）
const latest = manager.getLatestXmlCache({
  packageName: 'com.ss.android.ugc.aweme',
  activity: '.main.MainActivity'
});
```

### 3. 步骤关联

```typescript
// 关联步骤与XML源
manager.linkStepToXml(
  'step_123',           // 步骤ID
  'xml_hash456...',     // XML缓存ID
  {
    elementPath: '//*[@resource-id="iwk"]',  // 元素XPath
    selectionContext: {
      selectedBounds: '[45,1059][249,1263]',
      searchCriteria: '通讯录',
      confidence: 0.98
    }
  }
);

// 获取步骤关联的XML数据
const stepXml = await manager.getStepXmlContext('step_123');
if (stepXml) {
  console.log('XML数据:', stepXml.xmlData);
  console.log('上下文:', stepXml.context);
}
```

---

## 🧪 测试场景

### 场景1: 页面刷新恢复

**目的**：验证页面刷新后数据不丢失

**步骤**：
```typescript
// 1. 保存测试数据
for (let i = 1; i <= 10; i++) {
  manager.putXml(
    `test_${i}`,
    `<xml>test${i}</xml>`,
    `hash${i}`
  );
}

// 2. 检查内存缓存
const beforeStats = await manager.getStorageStats();
console.log('刷新前:', beforeStats.memory.count, '条');  // 10

// 3. 刷新页面（按F5）

// 4. 检查恢复结果
const afterStats = await manager.getStorageStats();
console.log('刷新后:', afterStats.memory.count, '条');  // 10 ✅

// 5. 验证数据完整性
for (let i = 1; i <= 10; i++) {
  const entry = await manager.getCachedXml(`test_${i}`);
  console.log(`test_${i}:`, entry ? '✅' : '❌');
}
```

**预期结果**：✅ 所有数据完整恢复

---

### 场景2: 自动清理测试

**目的**：验证自动清理机制

**步骤**：
```typescript
import { getPersistentStorage } from '@/services/storage/xml-persistent-storage';

// 1. 创建超量数据（600条，超过500限制）
const storage = getPersistentStorage();
const entries: XmlCacheEntry[] = [];
for (let i = 1; i <= 600; i++) {
  entries.push({
    cacheId: `xml_${i}`,
    xmlContent: `<xml>test${i}</xml>`,
    xmlHash: `hash${i}`,
    timestamp: Date.now() - i * 60000,  // 递减时间
    // ... 其他必填字段
  });
}
await storage.putBatch(entries);

// 2. 检查总数
let count = await storage.count();
console.log('保存后:', count, '条');  // 600

// 3. 手动触发清理
await storage.cleanup();

// 4. 检查清理结果
count = await storage.count();
console.log('清理后:', count, '条');  // 500 ✅（删除了最旧的100条）
```

**预期结果**：✅ 只保留最新的500条

---

### 场景3: 过期数据清理

**目的**：验证过期数据清理

**步骤**：
```typescript
import { getPersistentStorage } from '@/services/storage/xml-persistent-storage';

const storage = getPersistentStorage();

// 1. 创建过期数据（31天前）
const oldTimestamp = Date.now() - 31 * 24 * 60 * 60 * 1000;
const oldEntries: XmlCacheEntry[] = [
  {
    cacheId: 'old_1',
    timestamp: oldTimestamp,
    // ... 其他字段
  },
  {
    cacheId: 'old_2',
    timestamp: oldTimestamp,
    // ... 其他字段
  }
];
await storage.putBatch(oldEntries);

// 2. 创建新数据
manager.putXml('new_1', '<xml>new</xml>', 'hash_new', new Date().toISOString());

// 3. 手动触发清理
const result = await storage.cleanup();

console.log('清理过期:', result.expired, '条');  // 2 ✅
console.log('清理超量:', result.oldest, '条');  // 0

// 4. 验证过期数据已删除
const old1 = await storage.get('old_1');
console.log('old_1:', old1 ? '存在' : '已删除');  // 已删除 ✅

const new1 = await manager.getCachedXml('new_1');
console.log('new_1:', new1 ? '存在' : '已删除');  // 存在 ✅
```

**预期结果**：✅ 过期数据被清理，新数据保留

---

## ⚠️ 注意事项

### 1. 异步方法

部分方法从同步改为异步，需要使用 `await`：

```typescript
// ❌ 错误（旧代码）
const entry = manager.getCachedXml('xml_123');

// ✅ 正确（新代码）
const entry = await manager.getCachedXml('xml_123');
```

**受影响的方法**：
- `getCachedXml()` → `async`
- `getByHash()` → `async`
- `getStepXmlContext()` → `async`
- `cleanupExpiredCache()` → `async`
- `manualCleanup()` → `async`
- `getStorageStats()` → `async`

### 2. 构造函数私有化

`XmlCacheManager` 构造函数现在是私有的，必须使用 `getInstance()`：

```typescript
// ❌ 错误
const manager = new XmlCacheManager();

// ✅ 正确
const manager = XmlCacheManager.getInstance();
```

### 3. 浏览器兼容性

IndexedDB 在以下环境中不可用：
- 服务器端渲染（SSR）
- Node.js环境
- 隐私模式/无痕模式（部分浏览器）

系统会自动检测并降级到纯内存缓存：

```typescript
// 自动处理，无需手动检测
if (typeof window === 'undefined' || !window.indexedDB) {
  console.warn('⚠️ IndexedDB不可用，持久化存储将被禁用');
  // 自动降级到纯内存缓存
}
```

### 4. 性能考虑

- **内存优先**：优先从内存读取（O(1)），未命中才访问IndexedDB（O(log n)）
- **异步同步**：写入内存后立即返回，异步同步到IndexedDB（不阻塞）
- **批量操作**：使用 `putBatch()` 批量保存可以提高性能

---

## 🐛 故障排查

### 问题1: 页面刷新后数据丢失

**可能原因**：
1. IndexedDB未初始化
2. 浏览器隐私模式
3. 存储空间不足

**排查步骤**：
```typescript
// 1. 检查初始化状态
const stats = await manager.getStorageStats();
console.log('内存:', stats.memory.count);
console.log('持久化:', stats.persistent.count);

// 2. 检查IndexedDB
if (!window.indexedDB) {
  console.error('❌ IndexedDB不可用');
}

// 3. 检查存储空间
if (navigator.storage && navigator.storage.estimate) {
  const estimate = await navigator.storage.estimate();
  console.log('已使用:', (estimate.usage / 1024 / 1024).toFixed(2), 'MB');
  console.log('配额:', (estimate.quota / 1024 / 1024).toFixed(2), 'MB');
}
```

### 问题2: 自动清理不工作

**可能原因**：
1. 自动清理被禁用
2. 清理间隔太长
3. 定时器被意外清除

**排查步骤**：
```typescript
import { getPersistentStorage } from '@/services/storage/xml-persistent-storage';

// 1. 检查配置
const storage = getPersistentStorage();
// 查看初始化日志
// ⏰ 启动自动清理定时器（间隔: 60分钟）

// 2. 手动触发清理
const result = await storage.cleanup();
console.log('清理结果:', result);

// 3. 停止并重新启动
storage.stopAutoCleanup();
// ... 修改配置
// 重新初始化会自动启动
```

### 问题3: 存储空间不足

**解决方案**：

```typescript
// 1. 查看当前使用情况
const stats = await storage.getStats();
console.log('总大小:', (stats.totalSizeBytes / 1024 / 1024).toFixed(2), 'MB');

// 2. 手动清理
await storage.cleanup();

// 3. 如果仍然不足，降低限制
const newStorage = getPersistentStorage({
  maxEntries: 200,   // 降低到200条
  maxAgeDays: 7      // 只保留7天
});
```

---

## 📚 API参考

### XmlCacheManager

| 方法 | 说明 | 返回值 |
|-----|------|--------|
| `getInstance()` | 获取单例实例 | `XmlCacheManager` |
| `putXml(id, content, hash, time?)` | 保存XML快照 | `void` |
| `getCachedXml(id)` | 获取XML快照 | `Promise<XmlCacheEntry \| null>` |
| `getByHash(hash)` | 按hash查询 | `Promise<XmlCacheEntry \| null>` |
| `linkStepToXml(stepId, xmlId, context?)` | 关联步骤 | `void` |
| `getStepXmlContext(stepId)` | 获取步骤XML | `Promise<{ xmlData, context } \| null>` |
| `cleanupExpiredCache(maxAge)` | 清理过期数据 | `Promise<void>` |
| `manualCleanup()` | 手动完整清理 | `Promise<void>` |
| `getStorageStats()` | 获取存储统计 | `Promise<{ memory, persistent }>` |
| `listCacheIds()` | 列出所有ID | `string[]` |
| `getLatestXmlCache(metadata?)` | 获取最新缓存 | `XmlCacheEntry \| null` |

### XmlPersistentStorage

| 方法 | 说明 | 返回值 |
|-----|------|--------|
| `initialize()` | 初始化IndexedDB | `Promise<void>` |
| `put(entry)` | 保存条目 | `Promise<void>` |
| `putBatch(entries)` | 批量保存 | `Promise<void>` |
| `get(id)` | 获取条目 | `Promise<XmlCacheEntry \| null>` |
| `getByHash(hash)` | 按hash查询 | `Promise<XmlCacheEntry \| null>` |
| `getAll()` | 获取所有条目 | `Promise<XmlCacheEntry[]>` |
| `delete(id)` | 删除条目 | `Promise<void>` |
| `clear()` | 清空所有 | `Promise<void>` |
| `cleanupExpired(days)` | 清理过期 | `Promise<number>` |
| `cleanupOldest()` | 清理超量 | `Promise<number>` |
| `cleanup()` | 完整清理 | `Promise<{ expired, oldest }>` |
| `getStats()` | 获取统计 | `Promise<StorageStats>` |
| `count()` | 获取总数 | `Promise<number>` |
| `close()` | 关闭连接 | `void` |

---

## 🎓 最佳实践

### 1. 使用单例模式

```typescript
// ✅ 推荐：使用单例
const manager = XmlCacheManager.getInstance();

// ❌ 不推荐：多次创建实例（会报错）
const manager1 = new XmlCacheManager();  // Error: 构造函数是私有的
```

### 2. 批量操作优化性能

```typescript
// ❌ 性能差：循环单次保存
for (const entry of entries) {
  await storage.put(entry);
}

// ✅ 性能好：批量保存
await storage.putBatch(entries);
```

### 3. 异步处理不阻塞UI

```typescript
// ✅ 正确：保存是异步的，不阻塞UI
manager.putXml('xml_1', content, hash);
// 立即返回，后台同步到IndexedDB

// ❌ 错误：等待同步完成（不必要）
await manager.putXml('xml_1', content, hash);  // putXml不是async
```

### 4. 定期检查存储使用

```typescript
// 在开发工具中添加监控
setInterval(async () => {
  const stats = await manager.getStorageStats();
  console.log('存储使用:', stats.persistent.totalSizeBytes / 1024 / 1024, 'MB');
  
  if (stats.persistent.totalSizeBytes > 50 * 1024 * 1024) {  // 超过50MB
    console.warn('⚠️ 存储使用过高，考虑清理');
    await manager.manualCleanup();
  }
}, 5 * 60 * 1000);  // 每5分钟检查一次
```

---

**文档版本**: 1.0  
**最后更新**: 2025年1月28日
