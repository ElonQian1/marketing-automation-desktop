# 联系人管理数据库重新设计方案 V2.0

## 🎯 设计目标

1. **简化字段**：去除冗余字段，保留核心业务字段
2. **统一命名**：使用一致的命名规范
3. **清晰关系**：明确表之间的关联关系
4. **易于扩展**：为未来功能预留扩展空间

---

## 📊 核心表设计

### 1. `contact_numbers` - 联系人号码池

**用途**：存储所有从 TXT 文件导入的联系人号码

```sql
CREATE TABLE contact_numbers (
    -- 主键
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 联系人信息
    phone TEXT NOT NULL,                    -- 手机号
    name TEXT NOT NULL DEFAULT '',          -- 姓名（可为空）
    
    -- 来源信息
    source_file TEXT NOT NULL,              -- 来源文件路径
    txt_import_id INTEGER,                  -- 关联的TXT导入记录ID
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    -- 业务状态
    status TEXT NOT NULL DEFAULT 'available',  -- available, assigned, imported
    industry TEXT,                             -- 行业分类（可选）
    
    -- 分配与使用
    assigned_batch_id TEXT,                 -- 分配的VCF批次ID
    assigned_at TEXT,                       -- 分配时间
    
    imported_device_id TEXT,                -- 已导入的设备ID
    imported_session_id INTEGER,            -- 关联的导入会话ID
    imported_at TEXT,                       -- 导入时间
    
    -- 唯一约束
    UNIQUE(phone, source_file)
);

-- 索引
CREATE INDEX idx_contact_numbers_status ON contact_numbers(status);
CREATE INDEX idx_contact_numbers_phone ON contact_numbers(phone);
CREATE INDEX idx_contact_numbers_batch ON contact_numbers(assigned_batch_id);
CREATE INDEX idx_contact_numbers_industry ON contact_numbers(industry);
```

**字段说明**：
- `status` 状态流转：`available`(可用) → `assigned`(已分配到批次) → `imported`(已导入设备)
- `txt_import_id`: 外键，关联到 `txt_import_records.id`
- `assigned_batch_id`: 外键，关联到 `vcf_batches.batch_id`
- `imported_session_id`: 外键，关联到 `import_sessions.id`

---

### 2. `vcf_batches` - VCF 批次管理

**用途**：记录生成的 VCF 文件批次信息

```sql
CREATE TABLE vcf_batches (
    -- 主键
    batch_id TEXT PRIMARY KEY,              -- UUID 格式
    batch_name TEXT NOT NULL,               -- 批次名称
    
    -- 生成信息
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    vcf_file_path TEXT,                     -- 生成的VCF文件路径
    
    -- 号码来源
    source_type TEXT NOT NULL DEFAULT 'manual',  -- manual, txt_import, auto
    contact_count INTEGER NOT NULL DEFAULT 0,    -- 包含的号码数量
    
    -- 批次状态
    status TEXT NOT NULL DEFAULT 'pending',      -- pending, generated, importing, completed
    
    -- 元数据
    industry TEXT,                          -- 行业分类
    description TEXT,                       -- 描述
    notes TEXT                              -- 备注
);

-- 索引
CREATE INDEX idx_vcf_batches_status ON vcf_batches(status);
CREATE INDEX idx_vcf_batches_created_at ON vcf_batches(created_at);
CREATE INDEX idx_vcf_batches_industry ON vcf_batches(industry);
```

**字段说明**：
- 移除了 `source_start_id/source_end_id`（通过 contact_numbers 的 assigned_batch_id 关联）
- 移除了 `is_completed`（改用 `status` 统一管理）
- 移除了 `generation_method`（简化为 `source_type`）

---

### 3. `txt_import_records` - TXT 导入记录

**用途**：记录每次 TXT 文件导入的详细信息

```sql
CREATE TABLE txt_import_records (
    -- 主键
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 文件信息
    file_path TEXT NOT NULL UNIQUE,         -- 文件完整路径
    file_name TEXT NOT NULL,                -- 文件名
    file_size INTEGER NOT NULL DEFAULT 0,   -- 文件大小（字节）
    
    -- 导入统计
    total_lines INTEGER NOT NULL DEFAULT 0,     -- 文件总行数
    valid_numbers INTEGER NOT NULL DEFAULT 0,   -- 有效号码数
    imported_numbers INTEGER NOT NULL DEFAULT 0,-- 成功导入数
    duplicate_numbers INTEGER NOT NULL DEFAULT 0,-- 重复号码数
    invalid_numbers INTEGER NOT NULL DEFAULT 0, -- 无效号码数
    
    -- 导入状态
    status TEXT NOT NULL DEFAULT 'success', -- success, empty, all_duplicates, partial, failed
    error_message TEXT,                     -- 错误信息
    
    -- 时间记录
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    imported_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    -- 元数据
    industry TEXT,                          -- 行业分类
    notes TEXT                              -- 备注
);

-- 索引
CREATE INDEX idx_txt_import_status ON txt_import_records(status);
CREATE INDEX idx_txt_import_created_at ON txt_import_records(created_at);
CREATE INDEX idx_txt_import_industry ON txt_import_records(industry);
```

**字段说明**：
- 移除了 `file_modified_at`（不重要）
- 移除了 `updated_at`（简化）
- 统计字段更清晰：`total_lines`, `valid_numbers`, `imported_numbers`, `duplicate_numbers`, `invalid_numbers`
- `status` 值更明确：`success`(成功), `empty`(空文件), `all_duplicates`(全部重复), `partial`(部分成功), `failed`(失败)

---

### 4. `import_sessions` - 导入会话记录

**用途**：记录每次向设备导入联系人的会话信息

```sql
CREATE TABLE import_sessions (
    -- 主键
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL UNIQUE,        -- UUID 格式
    
    -- 关联信息
    device_id TEXT NOT NULL,                -- 设备ID
    batch_id TEXT NOT NULL,                 -- VCF批次ID
    
    -- 导入信息
    target_app TEXT NOT NULL,               -- 目标应用（如"小红书"）
    industry TEXT,                          -- 行业分类
    
    -- 导入统计
    total_count INTEGER NOT NULL DEFAULT 0, -- 计划导入数
    success_count INTEGER NOT NULL DEFAULT 0,-- 成功导入数
    failed_count INTEGER NOT NULL DEFAULT 0, -- 失败导入数
    
    -- 会话状态
    status TEXT NOT NULL DEFAULT 'pending', -- pending, running, success, failed, partial
    error_message TEXT,                     -- 错误信息
    
    -- 时间记录
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    started_at TEXT,                        -- 开始时间
    finished_at TEXT,                       -- 完成时间
    
    -- 元数据
    description TEXT,                       -- 描述
    notes TEXT                              -- 备注
);

-- 索引
CREATE INDEX idx_import_sessions_device_id ON import_sessions(device_id);
CREATE INDEX idx_import_sessions_batch_id ON import_sessions(batch_id);
CREATE INDEX idx_import_sessions_status ON import_sessions(status);
CREATE INDEX idx_import_sessions_created_at ON import_sessions(created_at);
CREATE INDEX idx_import_sessions_industry ON import_sessions(industry);
```

**字段说明**：
- 移除了 `session_description`（改用 `description`）
- 移除了 `completed_at`（改用 `finished_at`）
- 统一命名：`imported_count` → `success_count`, `failed_count` 保持

---

## 🔗 表关系说明

```
txt_import_records (1) ──→ (N) contact_numbers
    └─ txt_import_records.id → contact_numbers.txt_import_id

vcf_batches (1) ──→ (N) contact_numbers
    └─ vcf_batches.batch_id → contact_numbers.assigned_batch_id

import_sessions (1) ──→ (N) contact_numbers
    └─ import_sessions.id → contact_numbers.imported_session_id

vcf_batches (1) ──→ (N) import_sessions
    └─ vcf_batches.batch_id → import_sessions.batch_id
```

---

## 📈 业务流程与状态流转

### TXT 导入流程
1. 用户选择 TXT 文件 → 创建 `txt_import_records` 记录
2. 解析文件，导入号码 → 创建 `contact_numbers` 记录（status = 'available'）
3. 更新 `txt_import_records` 统计字段

### VCF 生成流程
1. 用户选择号码池中的号码 → 创建 `vcf_batches` 记录
2. 更新选中号码的 `assigned_batch_id` → status = 'assigned'
3. 生成 VCF 文件 → 更新 `vcf_batches.vcf_file_path`, status = 'generated'

### 设备导入流程
1. 用户选择 VCF 批次和设备 → 创建 `import_sessions` 记录
2. 开始导入 → status = 'running'
3. 导入成功的号码 → 更新 `contact_numbers` status = 'imported', 记录 `imported_session_id`
4. 完成导入 → 更新 `import_sessions` status, 统计字段

---

## 🎯 关键改进点

### 1. 字段简化
- ❌ 移除：`used`, `used_at`, `used_batch` (contact_numbers)
- ✅ 改用：`status`, `assigned_batch_id`, `assigned_at`

### 2. 统一命名
- `imported_count` → `success_count`
- `successful_imports` → `imported_numbers`
- `is_completed` → `status`

### 3. 状态管理
所有表都有明确的 `status` 字段，使用枚举值管理状态流转

### 4. 时间字段
- 统一使用 `created_at`, `started_at`, `finished_at`
- 移除 `updated_at`（简化，按需加触发器）

---

## 🚀 迁移策略

### 选项 1：完全重置（推荐开发阶段）
```sql
-- 1. 删除旧表
DROP TABLE IF EXISTS contact_numbers;
DROP TABLE IF EXISTS vcf_batches;
DROP TABLE IF EXISTS import_sessions;
DROP TABLE IF EXISTS txt_import_records;

-- 2. 使用新 schema.rs 重新创建
```

### 选项 2：迁移数据（保留历史）
如果需要保留 395 条历史数据，可以编写数据迁移脚本

---

## ✅ 下一步行动

1. **确认设计**：Review 新表结构是否符合业务需求
2. **更新 schema.rs**：使用新的 DDL
3. **更新 DTO 和 Repository**：修改代码以匹配新字段
4. **数据迁移**：决定是重置还是迁移历史数据
5. **测试验证**：完整测试所有流程

---

**问题**：
1. 是否需要保留 395 条历史数据？
2. 是否有其他业务字段需要添加？
3. 是否需要外键约束（SQLite 默认不启用）？
