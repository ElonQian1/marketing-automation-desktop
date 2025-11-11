好的，我直接给你讲清楚 XML 缓存的完整生命周期：

## 📦 **1. XML 如何被缓存（页面分析时）**

**入口**：用户点击"页面分析"按钮

**流程**：
```
VisualPageAnalyzerContent.tsx (handleElementSelect)
  ↓
1. 获取设备 XML: invoke('get_current_ui_xml', { device_id })
2. 生成哈希: generateXmlHash(xmlContent) 
3. 创建缓存ID: `xml_${hash前16位}_${时间戳}`
4. 存入缓存管理器:
   xmlCacheManager.putXml(xmlCacheId, xmlContent, `sha256:${hash}`)
   
   内部存储:
   - 内存: Map<cacheId, XmlCacheEntry>
   - 哈希索引: Map<xmlHash, XmlCacheEntry>  
   - 持久化: IndexedDB (异步同步)
```

**关键代码位置**：
- VisualPageAnalyzerContent.tsx 第 178-196 行
- xml-cache-manager.ts 第 237-268 行 (`putXml` 方法)

---

## 🎯 **2. 步骤卡片如何使用缓存**

**保存步骤时**：
```
页面分析 → 选择元素 → onElementSelected
  ↓ 传递增强元素信息
{
  xmlCacheId: "xml_abc123..._1699999999",  // 缓存ID
  xmlContent: "<hierarchy>...</hierarchy>", // 完整XML（备份）
  xmlHash: "sha256:abc123...",
  xpath: "//android.widget.Button[@text='登录']",
  bounds: "[100,200][300,400]"
}
  ↓ 保存到步骤参数
step.parameters = {
  xmlSnapshot: {
    xmlCacheId: "xml_abc123...",   // 🔑 核心：缓存引用
    xmlContent: "<hierarchy>...",  // 内嵌备份
    xmlHash: "sha256:abc123...",
    deviceInfo: {...},
    pageInfo: {...}
  },
  elementContext: {
    xpath: "//android.widget.Button[@text='登录']",
    bounds: {...}
  }
}
```

**读取步骤时（如 Step7/Step8 三路评分）**：
```
CompactStrategyMenu.tsx (我刚实现的代码)
  ↓
1. 获取步骤卡片: cardStore.cards[stepId]
2. 提取 xmlSnapshot: card.xmlSnapshot
3. 优先从缓存恢复:
   if (card.xmlSnapshot.xmlCacheId) {
     cacheManager.getCachedXml(xmlCacheId)
   }
4. 降级使用内嵌备份:
   if (!cached) {
     xmlContent = card.xmlSnapshot.xmlContent
   }
5. 解析 XML → 查找元素 → 执行评分
```

**关键代码位置**：
- 保存：useStepForm.tsx 第 140-160 行
- 读取：CompactStrategyMenu.tsx 第 485-545 行（我刚加的）

---

## 🧹 **3. 缓存如何被清理**

### **自动清理机制**：

**A. LRU 内存淘汰**（`addToMemoryCache` 方法）：
```typescript
// 当内存缓存超过 100 条时
if (this.cache.size >= 100) {
  // 找出访问频率最低的条目
  let minFreq = Infinity;
  let lruCacheId = '';
  
  this.accessFrequency.forEach((freq, cacheId) => {
    if (freq < minFreq) {
      minFreq = freq;
      lruCacheId = cacheId;
    }
  });
  
  // 删除最少使用的
  this.cache.delete(lruCacheId);
  this.hashIndex.delete(entry.xmlHash);
}
```

**B. 定时过期清理**（启动时自动运行）：
```typescript
constructor() {
  this.config = {
    autoCleanup: true,
    cleanupIntervalMs: 60 * 60 * 1000  // 每小时清理一次
  };
  
  // 默认清理 30 天前的数据
  setInterval(() => {
    this.cleanupExpiredCache(30 * 24 * 60 * 60 * 1000);
  }, this.config.cleanupIntervalMs);
}
```

**C. 持久化存储清理**（IndexedDB）：
```typescript
async cleanupExpiredCache(maxAgeMs) {
  // 1. 清理内存
  this.cache.forEach((entry, cacheId) => {
    if (now - entry.timestamp > maxAgeMs) {
      this.cache.delete(cacheId);
    }
  });
  
  // 2. 清理 IndexedDB
  await this.persistentStorage.cleanupExpired(maxAgeDays);
}
```

### **手动清理**：
```typescript
// 可通过调用触发
await xmlCacheManager.manualCleanup();
```

**清理策略**：
- **内存缓存**：最多 100 条，超出按 LRU 淘汰
- **过期时间**：30 天
- **检查频率**：每 1 小时
- **持久化**：IndexedDB 同步清理

**关键代码位置**：
- xml-cache-manager.ts 第 385-418 行（`cleanupExpiredCache`）
- xml-cache-manager.ts 第 573-602 行（`addToMemoryCache` LRU 逻辑）

---

## 💡 **关键设计要点**

1. **双重保障**：步骤既存 `xmlCacheId`（引用），又存 `xmlContent`（备份），防止缓存丢失
2. **三层存储**：内存 Map → 哈希索引 → IndexedDB 持久化
3. **性能优化**：访问频率跟踪 + 智能预加载
4. **数据安全**：即使缓存被清理，步骤仍可用内嵌 XML 恢复

这就是完整的缓存生命周期！有任何疑问直接问我。