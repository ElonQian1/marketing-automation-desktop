// contact-import/domain/entities | Contact | 联系人核心实体定义
// 包含联系人的基本属性、标签、分组等业务概念

/**
 * 联系人核心实体
 * 代表小红书营销系统中的目标联系人
 */
export interface Contact {
  /** 联系人唯一标识 */
  id: string;
  
  /** 联系人姓名 */
  name: string;
  
  /** 联系人昵称（可选） */
  nickname?: string;
  
  /** 手机号码 */
  phone?: string;
  
  /** 头像URL */
  avatar?: string;
  
  /** 联系人标签列表 */
  tags: ContactTag[];
  
  /** 所属分组ID */
  groupId?: string;
  
  /** 联系人来源 */
  source: ContactSource;
  
  /** 联系人备注信息 */
  notes?: string;
  
  /** 创建时间 */
  createdAt: Date;
  
  /** 最后更新时间 */
  updatedAt: Date;
  
  /** 最后互动时间 */
  lastInteraction?: Date;
  
  /** 自定义属性扩展 */
  customFields?: Record<string, any>;
}

/**
 * 联系人标签
 * 用于分类和筛选联系人
 */
export interface ContactTag {
  /** 标签ID */
  id: string;
  
  /** 标签名称 */
  name: string;
  
  /** 标签颜色 */
  color?: string;
  
  /** 标签分类 */
  category?: string;
}

/**
 * 联系人来源枚举
 * 标记联系人的获取渠道
 */
export enum ContactSource {
  /** 手动添加 */
  MANUAL = "manual",
  
  /** 文件导入 */
  FILE_IMPORT = "file_import",
  
  /** 设备同步 */
  DEVICE_SYNC = "device_sync",
  
  /** API导入 */
  API_IMPORT = "api_import",
  
  /** 批量导入 */
  BATCH_IMPORT = "batch_import",
}

/**
 * 联系人分组
 * 组织和管理联系人的逻辑容器
 */
export interface ContactGroup {
  /** 分组ID */
  id: string;
  
  /** 分组名称 */
  name: string;
  
  /** 分组描述 */
  description?: string;
  
  /** 分组颜色 */
  color?: string;
  
  /** 父分组ID（支持层级结构） */
  parentId?: string;
  
  /** 分组内联系人数量 */
  contactCount: number;
  
  /** 创建时间 */
  createdAt: Date;
  
  /** 最后更新时间 */
  updatedAt: Date;
}