# XML 缓存系统 Phase 3：版本控制系统设计方案

## 📋 设计概述

基于 Phase 1（基础缓存）和 Phase 2（引用计数管理）的成果，Phase 3 将实现完整的版本控制系统，提供 XML 快照的版本化管理、差异化存储、历史追踪和回滚能力。

## 🎯 核心目标

### 主要功能
1. **快照版本管理** - 对 XML 快照进行语义化版本控制
2. **差异化存储** - 智能增量存储，节省磁盘空间
3. **历史记录追踪** - 完整的变更历史和血缘关系
4. **回滚机制** - 支持任意版本回退和分支管理
5. **压缩优化** - 使用 zstd 压缩和 CBOR 序列化

### 性能指标
- **存储效率**：相比全量存储节省 60-80% 空间
- **检索性能**：版本查询 < 10ms
- **差异计算**：大型 XML diff < 100ms
- **回滚速度**：任意版本重建 < 50ms

## 🏗️ 技术架构设计

### 1. 核心数据结构

```rust
// 版本控制核心类型
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct XmlVersion {
    pub id: String,                    // 版本唯一标识
    pub parent_id: Option<String>,     // 父版本ID（支持分支）
    pub snapshot_id: String,           // 关联的快照ID
    pub timestamp: DateTime<Utc>,      // 创建时间戳
    pub version_type: VersionType,     // 版本类型
    pub delta: Option<XmlDelta>,       // 增量变更（非根版本）
    pub metadata: VersionMetadata,     // 版本元数据
    pub compression: CompressionInfo,  // 压缩信息
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum VersionType {
    Root,           // 根版本（完整快照）
    Incremental,    // 增量版本（基于父版本的变更）
    Milestone,      // 里程碑版本（周期性完整快照）
    Branch,         // 分支版本
    Tag,           // 标记版本
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct XmlDelta {
    pub added_nodes: Vec<DeltaNode>,      // 新增节点
    pub removed_nodes: Vec<String>,       // 删除节点路径
    pub modified_nodes: Vec<NodeChange>,   // 修改节点
    pub moved_nodes: Vec<NodeMove>,       // 移动节点
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DeltaNode {
    pub xpath: String,           // 节点XPath
    pub content: String,         // 节点内容
    pub attributes: HashMap<String, String>,  // 属性
    pub parent_xpath: String,    // 父节点路径
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct NodeChange {
    pub xpath: String,                    // 节点路径
    pub old_content: Option<String>,      // 原内容
    pub new_content: Option<String>,      // 新内容
    pub attribute_changes: HashMap<String, AttributeChange>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct AttributeChange {
    pub old_value: Option<String>,
    pub new_value: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct VersionMetadata {
    pub author: String,          // 创建者
    pub message: String,         // 版本描述
    pub tags: Vec<String>,       // 标签
    pub branch: String,          // 所属分支
    pub size_bytes: usize,       // 版本大小
    pub node_count: usize,       // 节点数量
}
```

### 2. 存储架构

```
version_control/
├── versions/           # 版本索引和元数据
│   ├── index.cbor     # 全局版本索引
│   └── {version_id}.cbor  # 各版本元数据
├── snapshots/         # 完整快照存储
│   └── {snapshot_id}.zst  # zstd压缩的完整XML
├── deltas/           # 增量变更存储
│   └── {version_id}.cbor  # CBOR序列化的增量数据
├── branches/         # 分支管理
│   └── {branch_name}.cbor # 分支元数据
└── cache/           # 重建缓存
    └── {version_id}.zst   # 重建后的完整快照缓存
```

### 3. 核心算法

#### XML Diff 算法
```rust
pub struct XmlDiffEngine {
    // 基于树结构的智能比较算法
    // 1. 首先比较节点结构变化
    // 2. 然后比较内容和属性变化
    // 3. 识别节点移动（而非删除+新增）
    // 4. 优化大文件的比较性能
}

impl XmlDiffEngine {
    pub fn compute_delta(&self, old_xml: &str, new_xml: &str) -> Result<XmlDelta> {
        // 1. 解析两个XML为节点树
        // 2. 构建XPath到节点的映射
        // 3. 识别结构变化（增删改移）
        // 4. 计算最小变更集
    }
    
    pub fn apply_delta(&self, base_xml: &str, delta: &XmlDelta) -> Result<String> {
        // 将增量变更应用到基础XML，重建完整内容
    }
}
```

#### 版本重建算法
```rust
pub struct VersionRebuilder {
    // 高效的版本重建机制
    // 1. 找到最近的完整快照
    // 2. 顺序应用增量变更
    // 3. 缓存重建结果
    // 4. 支持并行重建多个版本
}

impl VersionRebuilder {
    pub async fn rebuild_version(&self, version_id: &str) -> Result<String> {
        // 1. 查找重建路径（最短路径算法）
        // 2. 加载基础快照
        // 3. 按序应用增量变更
        // 4. 缓存重建结果
    }
}
```

## 🔄 工作流程设计

### 1. 版本创建流程
```
新XML快照 → XML Diff → 增量计算 → 压缩存储 → 版本索引更新
    ↓
检查是否需要里程碑版本 → 创建完整快照（可选）→ 清理旧缓存
```

### 2. 版本检索流程
```
版本ID → 查询索引 → 确定重建路径 → 加载基础快照 → 应用增量 → 返回完整XML
    ↓
缓存重建结果 → 更新访问统计 → LRU缓存管理
```

### 3. 分支管理流程
```
创建分支 → 基于父版本 → 独立版本线 → 支持合并 → 冲突解决
```

## 📊 API 接口设计

### Rust 核心 API
```rust
pub trait VersionControlService {
    // 版本管理
    async fn create_version(&self, snapshot_id: &str, metadata: VersionMetadata) -> Result<String>;
    async fn get_version(&self, version_id: &str) -> Result<XmlVersion>;
    async fn list_versions(&self, branch: Option<&str>) -> Result<Vec<XmlVersion>>;
    async fn delete_version(&self, version_id: &str) -> Result<()>;
    
    // 内容操作
    async fn get_version_content(&self, version_id: &str) -> Result<String>;
    async fn compare_versions(&self, v1: &str, v2: &str) -> Result<XmlDelta>;
    async fn revert_to_version(&self, version_id: &str) -> Result<String>;
    
    // 分支管理
    async fn create_branch(&self, name: &str, base_version: &str) -> Result<String>;
    async fn list_branches(&self) -> Result<Vec<String>>;
    async fn merge_branch(&self, source: &str, target: &str) -> Result<String>;
    
    // 维护操作
    async fn prune_old_versions(&self, keep_count: usize) -> Result<usize>;
    async fn optimize_storage(&self) -> Result<StorageStats>;
    async fn validate_integrity(&self) -> Result<IntegrityReport>;
}
```

### Tauri 命令接口
```rust
// 新增 Phase 3 Tauri 命令（计划 8 个）
#[tauri::command]
async fn create_xml_version(snapshot_id: String, metadata: VersionMetadata) -> Result<String>;

#[tauri::command] 
async fn get_xml_version(version_id: String) -> Result<XmlVersion>;

#[tauri::command]
async fn list_xml_versions(branch: Option<String>) -> Result<Vec<XmlVersion>>;

#[tauri::command]
async fn get_version_content(version_id: String) -> Result<String>;

#[tauri::command]
async fn compare_xml_versions(v1: String, v2: String) -> Result<XmlDelta>;

#[tauri::command]
async fn revert_to_xml_version(version_id: String) -> Result<String>;

#[tauri::command]
async fn create_xml_branch(name: String, base_version: String) -> Result<String>;

#[tauri::command]
async fn optimize_version_storage() -> Result<StorageStats>;
```

### TypeScript 前端 API
```typescript
// React Hook 设计
export const useXmlVersions = () => {
  const [versions, setVersions] = useState<XmlVersion[]>([]);
  const [loading, setLoading] = useState(false);
  
  const createVersion = async (snapshotId: string, metadata: VersionMetadata) => {
    return await invoke('create_xml_version', { snapshotId, metadata });
  };
  
  const getVersionContent = async (versionId: string) => {
    return await invoke('get_version_content', { versionId });
  };
  
  // ... 其他方法
  
  return {
    versions,
    createVersion,
    getVersionContent,
    compareVersions,
    revertToVersion,
    loading
  };
};
```

## 🎛️ 配置和优化

### 存储配置
```rust
#[derive(Clone, Debug, Deserialize)]
pub struct VersionControlConfig {
    pub max_versions_per_branch: usize,     // 每分支最大版本数
    pub milestone_interval: usize,          // 里程碑版本间隔
    pub compression_level: i32,             // zstd 压缩级别
    pub cache_size_mb: usize,              // 重建缓存大小
    pub enable_parallel_rebuild: bool,      // 并行重建
    pub auto_prune_enabled: bool,          // 自动清理
    pub diff_algorithm: DiffAlgorithm,     // Diff算法选择
}

pub enum DiffAlgorithm {
    Fast,      // 快速算法，适合小文件
    Precise,   // 精确算法，适合大文件  
    Adaptive,  // 自适应选择
}
```

### 性能优化策略
1. **懒加载**：按需加载版本内容
2. **缓存策略**：LRU缓存重建结果  
3. **并行处理**：多版本并行重建
4. **压缩优化**：自适应压缩级别
5. **索引优化**：B+树索引加速查询

## 📈 测试和验证

### 单元测试计划
- XML Diff 算法正确性测试
- 版本重建完整性测试
- 分支合并冲突处理测试
- 压缩和序列化性能测试
- 并发安全性测试

### 性能基准测试
- 不同大小XML的Diff性能
- 版本重建速度测试
- 存储空间压缩比测试
- 高并发访问压力测试

### 集成测试场景
```javascript
// Phase 3 集成测试脚本
async function testVersionControl() {
    // 1. 创建基础版本
    // 2. 创建增量版本
    // 3. 分支操作测试
    // 4. 版本比较测试
    // 5. 回滚功能测试
    // 6. 存储优化测试
    // 7. 完整性验证测试
}
```

## 🗓️ 实施计划

### 第一阶段（1-2周）：核心数据结构和存储
- [ ] 定义核心数据结构
- [ ] 实现存储层（文件系统 + 压缩）
- [ ] 基础版本管理功能

### 第二阶段（1-2周）：Diff算法和重建
- [ ] 实现XML Diff算法
- [ ] 版本重建机制
- [ ] 缓存和性能优化

### 第三阶段（1周）：分支管理和高级功能
- [ ] 分支创建和管理
- [ ] 版本比较和合并
- [ ] 自动清理和维护

### 第四阶段（1周）：Tauri集成和前端API
- [ ] 扩展Tauri命令接口
- [ ] React Hooks实现
- [ ] 完整测试和文档

## 🎯 成功标准

1. **功能完整性**：支持完整的版本控制操作
2. **性能达标**：满足设计的性能指标
3. **存储效率**：相比全量存储节省 > 60% 空间  
4. **稳定性**：通过所有单元和集成测试
5. **易用性**：前端API简洁易用

---

**Phase 3 设计方案已完成，准备开始实施！** 🚀