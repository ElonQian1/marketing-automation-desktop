# XML缓存系统快速测试指南

## 🚀 快速上手

### 1. 启动应用并打开开发者工具
```bash
npm run tauri dev
```

### 2. 在浏览器控制台运行测试
```javascript
// 运行完整测试套件
await window.testCacheSystem();

// 运行性能测试
await window.testCachePerf();
```

## 🧪 手动API测试

### 基本缓存流程测试
```javascript
// 1. 注册XML快照
const xmlContent = `<hierarchy rotation="0">
  <node index="0" text="登录" class="android.widget.Button" 
        bounds="[100,200][300,250]" clickable="true"/>
  <node index="1" text="注册" class="android.widget.TextView" 
        bounds="[100,300][300,350]" clickable="true"/>
</hierarchy>`;

const snapshotId = await window.__TAURI__.invoke('register_snapshot_cmd', {
  xmlContent: xmlContent
});
console.log('快照ID:', snapshotId);

// 2. 获取元素分析指标
const metrics = await window.__TAURI__.invoke('get_subtree_metrics_cmd', {
  snapshotId: snapshotId,
  absXpath: '//node[@text="登录"]'
});
console.log('分析指标:', metrics);

// 3. 验证缓存命中
const cached = await window.__TAURI__.invoke('try_get_subtree_metrics_cmd', {
  snapshotId: snapshotId,
  absXpath: '//node[@text="登录"]'
});
console.log('缓存结果:', cached);

// 4. 查看缓存统计
const stats = await window.__TAURI__.invoke('get_cache_stats_cmd');
console.log('缓存统计:', stats);
```

## 📊 预期输出示例

### ✅ 正常输出
```
🧪 测试1: 注册XML快照...
✅ [AnalysisCache] 注册XML快照: snapshot_20241231_abc123

🧪 测试2: 获取子树指标...
✅ [AnalysisCache] 获取指标: //node[@text="测试按钮"] -> xpath_direct

🧪 测试3: 尝试缓存命中...
🎯 [AnalysisCache] 缓存命中: //node[@text="测试按钮"]

🧪 测试4: 批量缓存操作...
✅ [AnalysisCache] 批量获取完成: 2个元素

📊 测试结果汇总:
1. ✅ XML快照注册成功
2. ✅ 子树指标获取成功
3. ✅ 缓存命中成功
4. ✅ 批量操作执行成功

🎯 测试完成: 4/4 成功
🎉 XML缓存系统工作正常!
```

### 📈 性能测试输出
```
⚡ 开始性能对比测试...
📈 性能对比结果:
   首次解析: 15.30ms
   缓存命中: 0.85ms
   提升倍数: 18.00x
```

## ❌ 故障排除

### 常见错误与解决

1. **命令未找到错误**
```
Error: Command not found: register_snapshot_cmd
```
**解决**: 确认应用已完全启动，缓存命令已注册

2. **参数类型错误**
```
Error: Invalid parameter type
```
**解决**: 检查API调用参数是否正确，参考API文档

3. **缓存未命中**
```
⚪ [AnalysisCache] 缓存未命中: //node[@text="按钮"]
```
**解决**: 这是正常现象，表示该XPath首次被查询

## 🔧 高级测试

### 压力测试
```javascript
// 大量XML注册测试
const results = [];
for (let i = 0; i < 100; i++) {
  const xml = `<hierarchy><node index="${i}" text="测试${i}"/></hierarchy>`;
  const id = await window.__TAURI__.invoke('register_snapshot_cmd', { xmlContent: xml });
  results.push(id);
}
console.log(`批量注册完成: ${results.length} 个快照`);

// 查看内存使用
const stats = await window.__TAURI__.invoke('get_cache_stats_cmd');
console.log('内存使用:', stats.total_memory_mb, 'MB');
```

### 缓存清理测试
```javascript
// 清理过期缓存
const cleaned = await window.__TAURI__.invoke('cleanup_cache_cmd', {
  maxAgeHours: 1 // 清理1小时前的缓存
});
console.log(`清理了 ${cleaned} 个过期条目`);
```

## 📝 测试检查清单

- [ ] 应用成功启动
- [ ] 控制台可以访问 `window.testCacheSystem`
- [ ] XML快照注册成功
- [ ] 子树指标计算正常
- [ ] 缓存命中机制工作
- [ ] 批量操作功能正常
- [ ] 性能提升明显 (>10x)
- [ ] 内存使用合理 (<100MB)

## 🎯 成功标准

✅ **系统正常**: 所有测试通过，性能提升>10倍  
⚠️ **部分异常**: 大部分功能正常，个别测试失败  
❌ **系统异常**: 多个核心功能失败，需要检查实现

---

**测试完成后，XML缓存系统即可投入使用！**