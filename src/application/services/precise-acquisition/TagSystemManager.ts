/**
 * 标签系统管理服务
 * 
 * 基于统一错误处理、配置管理和依赖注入的标签系统管理实现
 * 提供标签的创建、更新、删除、查询和关联管理功能
 */

import { 
  ITagManagementService, 
  TagEntity, 
  TagCategory, 
  CreateTagDto, 
  UpdateTagDto, 
  UserEntity,
  EntityId,
  OperationResult,
  BatchOperationResult,
  PaginationParams,
  PaginatedResult
} from '../shared/SharedInterfaces';
import { 
  PreciseAcquisitionError, 
  ValidationError, 
  BusinessLogicError, 
  DataIntegrityError,
  createErrorContext,
  ErrorHandler 
} from '../shared/ErrorHandlingSystem';
import { 
  validateObjectStructure, 
  generateUniqueId, 
  sanitizeString, 
  deepClone,
  groupBy,
  PerformanceTimer 
} from '../shared/CommonUtils';
import { getConfigManager } from '../shared/ConfigurationManager';
import { IService } from '../shared/DependencyContainer';
import { Platform } from '../../../constants/precise-acquisition-enums';

// ==================== 标签验证规则 ====================

const TAG_VALIDATION_RULES = {
  name: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/,
    message: '标签名称必须是1-50个字符，只能包含字母、数字、中文、下划线和短横线'
  },
  description: {
    required: false,
    type: 'string',
    maxLength: 200,
    message: '描述不能超过200个字符'
  },
  category: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 30,
    message: '分类名称必须是1-30个字符'
  },
  color: {
    required: false,
    type: 'string',
    pattern: /^#[0-9A-Fa-f]{6}$/,
    message: '颜色必须是有效的十六进制颜色值（如：#FF0000）'
  }
} as const;

const CATEGORY_VALIDATION_RULES = {
  name: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 30,
    message: '分类名称必须是1-30个字符'
  },
  description: {
    required: false,
    type: 'string',
    maxLength: 100,
    message: '描述不能超过100个字符'
  }
} as const;

// ==================== 标签系统管理器 ====================

export class TagSystemManager implements ITagManagementService, IService {
  readonly serviceName = 'TagSystemManager';
  
  private errorHandler: ErrorHandler;
  private isInitialized = false;
  private tags = new Map<EntityId, TagEntity>();
  private categories = new Map<EntityId, TagCategory>();
  private userTagMappings = new Map<EntityId, Set<EntityId>>();
  private tagUserMappings = new Map<EntityId, Set<EntityId>>();

  constructor() {
    this.errorHandler = ErrorHandler.getInstance();
  }

  // ==================== 服务生命周期 ====================

  async initialize(): Promise<void> {
    const timer = new PerformanceTimer();
    timer.start();

    try {
      console.log('[TagSystemManager] Initializing tag system...');
      
      // 加载默认标签分类
      await this.loadDefaultCategories();
      
      // 加载系统预置标签
      await this.loadSystemTags();
      
      // 从持久化存储加载用户数据（暂时跳过，需要数据库支持）
      // await this.loadPersistedData();
      
      this.isInitialized = true;
      
      const elapsed = timer.stop();
      console.log(`[TagSystemManager] Initialized successfully in ${elapsed}ms`);
      
    } catch (error) {
      const context = createErrorContext('tag_system', 'initialize');
      throw this.errorHandler.handle(error, context);
    }
  }

  async dispose(): Promise<void> {
    try {
      console.log('[TagSystemManager] Disposing tag system...');
      
      // 清理内存数据
      this.tags.clear();
      this.categories.clear();
      this.userTagMappings.clear();
      this.tagUserMappings.clear();
      
      this.isInitialized = false;
      console.log('[TagSystemManager] Disposed successfully');
      
    } catch (error) {
      console.error('[TagSystemManager] Error during disposal:', error);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      // 检查服务是否已初始化
      if (!this.isInitialized) {
        return false;
      }
      
      // 检查基本功能
      const testTag = await this.getTag('system_test');
      
      // 检查内存数据一致性
      const totalUserMappings = Array.from(this.userTagMappings.values())
        .reduce((sum, tagSet) => sum + tagSet.size, 0);
      const totalTagMappings = Array.from(this.tagUserMappings.values())
        .reduce((sum, userSet) => sum + userSet.size, 0);
      
      if (totalUserMappings !== totalTagMappings) {
        console.warn('[TagSystemManager] Data consistency check failed');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('[TagSystemManager] Health check failed:', error);
      return false;
    }
  }

  // ==================== 标签CRUD操作 ====================

  async createTag(dto: CreateTagDto): Promise<TagEntity> {
    const timer = new PerformanceTimer();
    timer.start();

    try {
      this.ensureInitialized();
      
      // 验证输入数据
      const validation = this.validateTagDto(dto);
      if (!validation.valid) {
        throw new ValidationError(
          `Invalid tag data: ${validation.errors.map(e => e.message).join(', ')}`,
          'tag_data',
          dto,
          createErrorContext('tag_system', 'create_tag', { dto, errors: validation.errors })
        );
      }

      // 检查名称唯一性
      const existingTag = Array.from(this.tags.values())
        .find(tag => tag.name.toLowerCase() === dto.name.toLowerCase());
      
      if (existingTag) {
        throw new BusinessLogicError(
          `Tag with name '${dto.name}' already exists`,
          'tag_name_duplicate',
          createErrorContext('tag_system', 'create_tag', { dto, existingTag })
        );
      }

      // 验证分类是否存在
      const categoryExists = Array.from(this.categories.values())
        .some(cat => cat.name === dto.category);
      
      if (!categoryExists) {
        // 自动创建分类
        await this.createCategory(dto.category, `自动创建的分类：${dto.category}`);
      }

      // 创建标签实体
      const tagId = generateUniqueId();
      const now = new Date();
      
      const tag: TagEntity = {
        id: tagId,
        name: sanitizeString(dto.name),
        description: dto.description ? sanitizeString(dto.description) : undefined,
        color: dto.color || this.generateRandomColor(),
        category: dto.category,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        usageCount: 0,
        metadata: dto.metadata ? deepClone(dto.metadata) : {}
      };

      // 保存到内存
      this.tags.set(tagId, tag);

      // 更新分类计数
      await this.updateCategoryTagCount(dto.category);

      const elapsed = timer.stop();
      console.log(`[TagSystemManager] Created tag '${tag.name}' in ${elapsed}ms`);

      return deepClone(tag);

    } catch (error) {
      if (error instanceof PreciseAcquisitionError) {
        throw error;
      }
      
      const context = createErrorContext('tag_system', 'create_tag', { dto });
      throw this.errorHandler.handleError(
        new PreciseAcquisitionError(
          'Failed to create tag',
          'tag_creation_failed',
          context
        ),
        error
      );
    }
  }

  async updateTag(id: EntityId, dto: UpdateTagDto): Promise<TagEntity> {
    const timer = new PerformanceTimer();
    timer.start();

    try {
      this.ensureInitialized();
      
      const existingTag = this.tags.get(id);
      if (!existingTag) {
        throw new BusinessLogicError(
          `Tag with ID '${id}' not found`,
          'tag_not_found',
          createErrorContext('tag_system', 'update_tag', { id, dto })
        );
      }

      // 验证更新数据
      if (dto.name || dto.description || dto.category || dto.color) {
        const validation = this.validateTagDto({
          name: dto.name || existingTag.name,
          description: dto.description !== undefined ? dto.description : existingTag.description,
          category: dto.category || existingTag.category,
          color: dto.color !== undefined ? dto.color : existingTag.color
        });

        if (!validation.valid) {
          throw new ValidationError(
            `Invalid tag update data: ${validation.errors.map(e => e.message).join(', ')}`,
            'tag_update_validation_failed',
            createErrorContext('tag_system', 'update_tag', { id, dto, errors: validation.errors })
          );
        }
      }

      // 检查名称唯一性（如果更改了名称）
      if (dto.name && dto.name.toLowerCase() !== existingTag.name.toLowerCase()) {
        const duplicateTag = Array.from(this.tags.values())
          .find(tag => tag.id !== id && tag.name.toLowerCase() === dto.name.toLowerCase());
        
        if (duplicateTag) {
          throw new BusinessLogicError(
            `Tag with name '${dto.name}' already exists`,
            'tag_name_duplicate',
            createErrorContext('tag_system', 'update_tag', { id, dto, duplicateTag })
          );
        }
      }

      // 更新标签
      const oldCategory = existingTag.category;
      const updatedTag: TagEntity = {
        ...existingTag,
        name: dto.name ? sanitizeString(dto.name) : existingTag.name,
        description: dto.description !== undefined ? 
          (dto.description ? sanitizeString(dto.description) : undefined) : 
          existingTag.description,
        color: dto.color !== undefined ? dto.color : existingTag.color,
        category: dto.category || existingTag.category,
        isActive: dto.isActive !== undefined ? dto.isActive : existingTag.isActive,
        updatedAt: new Date(),
        metadata: dto.metadata ? { ...existingTag.metadata, ...dto.metadata } : existingTag.metadata
      };

      this.tags.set(id, updatedTag);

      // 如果分类发生了变化，更新分类计数
      if (dto.category && dto.category !== oldCategory) {
        await this.updateCategoryTagCount(oldCategory);
        await this.updateCategoryTagCount(dto.category);
      }

      const elapsed = timer.stop();
      console.log(`[TagSystemManager] Updated tag '${updatedTag.name}' in ${elapsed}ms`);

      return deepClone(updatedTag);

    } catch (error) {
      if (error instanceof PreciseAcquisitionError) {
        throw error;
      }
      
      const context = createErrorContext('tag_system', 'update_tag', { id, dto });
      throw this.errorHandler.handleError(
        new PreciseAcquisitionError(
          'Failed to update tag',
          'tag_update_failed',
          context
        ),
        error
      );
    }
  }

  async deleteTag(id: EntityId): Promise<void> {
    const timer = new PerformanceTimer();
    timer.start();

    try {
      this.ensureInitialized();
      
      const tag = this.tags.get(id);
      if (!tag) {
        throw new BusinessLogicError(
          `Tag with ID '${id}' not found`,
          'tag_not_found',
          createErrorContext('tag_system', 'delete_tag', { id })
        );
      }

      // 检查是否有用户关联
      const associatedUsers = this.tagUserMappings.get(id);
      if (associatedUsers && associatedUsers.size > 0) {
        throw new BusinessLogicError(
          `Cannot delete tag '${tag.name}' because it is associated with ${associatedUsers.size} users`,
          'tag_in_use',
          createErrorContext('tag_system', 'delete_tag', { 
            id, 
            tag, 
            associatedUserCount: associatedUsers.size 
          })
        );
      }

      // 删除标签
      this.tags.delete(id);
      this.tagUserMappings.delete(id);

      // 更新分类计数
      await this.updateCategoryTagCount(tag.category);

      const elapsed = timer.stop();
      console.log(`[TagSystemManager] Deleted tag '${tag.name}' in ${elapsed}ms`);

    } catch (error) {
      if (error instanceof PreciseAcquisitionError) {
        throw error;
      }
      
      const context = createErrorContext('tag_system', 'delete_tag', { id });
      throw this.errorHandler.handleError(
        new PreciseAcquisitionError(
          'Failed to delete tag',
          'tag_deletion_failed',
          context
        ),
        error
      );
    }
  }

  async getTag(id: EntityId): Promise<TagEntity | null> {
    try {
      this.ensureInitialized();
      
      const tag = this.tags.get(id);
      return tag ? deepClone(tag) : null;
      
    } catch (error) {
      console.error(`[TagSystemManager] Error getting tag ${id}:`, error);
      return null;
    }
  }

  async listTags(filters?: Partial<TagEntity>): Promise<TagEntity[]> {
    const timer = new PerformanceTimer();
    timer.start();

    try {
      this.ensureInitialized();
      
      let tags = Array.from(this.tags.values());

      // 应用过滤器
      if (filters) {
        if (filters.isActive !== undefined) {
          tags = tags.filter(tag => tag.isActive === filters.isActive);
        }
        
        if (filters.category) {
          tags = tags.filter(tag => tag.category === filters.category);
        }
        
        if (filters.name) {
          const searchTerm = filters.name.toLowerCase();
          tags = tags.filter(tag => 
            tag.name.toLowerCase().includes(searchTerm) ||
            (tag.description && tag.description.toLowerCase().includes(searchTerm))
          );
        }
      }

      // 按名称排序
      tags.sort((a, b) => a.name.localeCompare(b.name));

      const elapsed = timer.stop();
      console.log(`[TagSystemManager] Listed ${tags.length} tags in ${elapsed}ms`);

      return tags.map(tag => deepClone(tag));

    } catch (error) {
      console.error('[TagSystemManager] Error listing tags:', error);
      return [];
    }
  }

  // ==================== 标签分类管理 ====================

  async createCategory(name: string, description?: string): Promise<TagCategory> {
    try {
      this.ensureInitialized();
      
      // 验证分类数据
      const validation = this.validateCategoryDto({ name, description });
      if (!validation.valid) {
        throw new ValidationError(
          `Invalid category data: ${validation.errors.map(e => e.message).join(', ')}`,
          'category_validation_failed',
          createErrorContext('tag_system', 'create_category', { name, description, errors: validation.errors })
        );
      }

      // 检查名称唯一性
      const existingCategory = Array.from(this.categories.values())
        .find(cat => cat.name.toLowerCase() === name.toLowerCase());
      
      if (existingCategory) {
        return existingCategory; // 如果已存在，直接返回
      }

      // 创建分类
      const categoryId = generateUniqueId();
      const category: TagCategory = {
        id: categoryId,
        name: sanitizeString(name),
        description: description ? sanitizeString(description) : undefined,
        sortOrder: this.categories.size + 1,
        isActive: true,
        tagCount: 0
      };

      this.categories.set(categoryId, category);
      
      console.log(`[TagSystemManager] Created category '${category.name}'`);
      return deepClone(category);

    } catch (error) {
      if (error instanceof PreciseAcquisitionError) {
        throw error;
      }
      
      const context = createErrorContext('tag_system', 'create_category', { name, description });
      throw this.errorHandler.handleError(
        new PreciseAcquisitionError(
          'Failed to create category',
          'category_creation_failed',
          context
        ),
        error
      );
    }
  }

  async updateCategory(id: EntityId, updates: Partial<TagCategory>): Promise<TagCategory> {
    try {
      this.ensureInitialized();
      
      const existingCategory = this.categories.get(id);
      if (!existingCategory) {
        throw new BusinessLogicError(
          `Category with ID '${id}' not found`,
          'category_not_found',
          createErrorContext('tag_system', 'update_category', { id, updates })
        );
      }

      // 验证更新数据
      if (updates.name || updates.description !== undefined) {
        const validation = this.validateCategoryDto({
          name: updates.name || existingCategory.name,
          description: updates.description !== undefined ? updates.description : existingCategory.description
        });

        if (!validation.valid) {
          throw new ValidationError(
            `Invalid category update data: ${validation.errors.map(e => e.message).join(', ')}`,
            'category_update_validation_failed',
            createErrorContext('tag_system', 'update_category', { id, updates, errors: validation.errors })
          );
        }
      }

      // 更新分类
      const updatedCategory: TagCategory = {
        ...existingCategory,
        name: updates.name ? sanitizeString(updates.name) : existingCategory.name,
        description: updates.description !== undefined ? 
          (updates.description ? sanitizeString(updates.description) : undefined) : 
          existingCategory.description,
        sortOrder: updates.sortOrder !== undefined ? updates.sortOrder : existingCategory.sortOrder,
        isActive: updates.isActive !== undefined ? updates.isActive : existingCategory.isActive
      };

      this.categories.set(id, updatedCategory);
      
      console.log(`[TagSystemManager] Updated category '${updatedCategory.name}'`);
      return deepClone(updatedCategory);

    } catch (error) {
      if (error instanceof PreciseAcquisitionError) {
        throw error;
      }
      
      const context = createErrorContext('tag_system', 'update_category', { id, updates });
      throw this.errorHandler.handleError(
        new PreciseAcquisitionError(
          'Failed to update category',
          'category_update_failed',
          context
        ),
        error
      );
    }
  }

  async deleteCategory(id: EntityId): Promise<void> {
    try {
      this.ensureInitialized();
      
      const category = this.categories.get(id);
      if (!category) {
        throw new BusinessLogicError(
          `Category with ID '${id}' not found`,
          'category_not_found',
          createErrorContext('tag_system', 'delete_category', { id })
        );
      }

      // 检查是否有标签使用该分类
      const tagsInCategory = Array.from(this.tags.values())
        .filter(tag => tag.category === category.name);

      if (tagsInCategory.length > 0) {
        throw new BusinessLogicError(
          `Cannot delete category '${category.name}' because it contains ${tagsInCategory.length} tags`,
          'category_in_use',
          createErrorContext('tag_system', 'delete_category', { 
            id, 
            category, 
            tagCount: tagsInCategory.length 
          })
        );
      }

      this.categories.delete(id);
      
      console.log(`[TagSystemManager] Deleted category '${category.name}'`);

    } catch (error) {
      if (error instanceof PreciseAcquisitionError) {
        throw error;
      }
      
      const context = createErrorContext('tag_system', 'delete_category', { id });
      throw this.errorHandler.handleError(
        new PreciseAcquisitionError(
          'Failed to delete category',
          'category_deletion_failed',
          context
        ),
        error
      );
    }
  }

  async listCategories(): Promise<TagCategory[]> {
    try {
      this.ensureInitialized();
      
      const categories = Array.from(this.categories.values())
        .filter(cat => cat.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder);

      return categories.map(cat => deepClone(cat));

    } catch (error) {
      console.error('[TagSystemManager] Error listing categories:', error);
      return [];
    }
  }

  // ==================== 标签关联管理 ====================

  async applyTagsToUser(userId: EntityId, tagIds: EntityId[]): Promise<void> {
    const timer = new PerformanceTimer();
    timer.start();

    try {
      this.ensureInitialized();
      
      if (tagIds.length === 0) {
        return;
      }

      // 验证标签是否存在
      const invalidTags = tagIds.filter(tagId => !this.tags.has(tagId));
      if (invalidTags.length > 0) {
        throw new BusinessLogicError(
          `Invalid tag IDs: ${invalidTags.join(', ')}`,
          'invalid_tag_ids',
          createErrorContext('tag_system', 'apply_tags_to_user', { userId, tagIds, invalidTags })
        );
      }

      // 获取或创建用户标签集合
      if (!this.userTagMappings.has(userId)) {
        this.userTagMappings.set(userId, new Set());
      }
      
      const userTags = this.userTagMappings.get(userId)!;
      let addedCount = 0;

      // 添加标签关联
      for (const tagId of tagIds) {
        if (!userTags.has(tagId)) {
          userTags.add(tagId);
          addedCount++;

          // 更新反向映射
          if (!this.tagUserMappings.has(tagId)) {
            this.tagUserMappings.set(tagId, new Set());
          }
          this.tagUserMappings.get(tagId)!.add(userId);

          // 更新标签使用计数
          const tag = this.tags.get(tagId)!;
          tag.usageCount++;
          tag.updatedAt = new Date();
        }
      }

      const elapsed = timer.stop();
      console.log(`[TagSystemManager] Applied ${addedCount} tags to user ${userId} in ${elapsed}ms`);

    } catch (error) {
      if (error instanceof PreciseAcquisitionError) {
        throw error;
      }
      
      const context = createErrorContext('tag_system', 'apply_tags_to_user', { userId, tagIds });
      throw this.errorHandler.handleError(
        new PreciseAcquisitionError(
          'Failed to apply tags to user',
          'tag_application_failed',
          context
        ),
        error
      );
    }
  }

  async removeTagsFromUser(userId: EntityId, tagIds: EntityId[]): Promise<void> {
    const timer = new PerformanceTimer();
    timer.start();

    try {
      this.ensureInitialized();
      
      if (tagIds.length === 0) {
        return;
      }

      const userTags = this.userTagMappings.get(userId);
      if (!userTags) {
        return; // 用户没有任何标签
      }

      let removedCount = 0;

      // 移除标签关联
      for (const tagId of tagIds) {
        if (userTags.has(tagId)) {
          userTags.delete(tagId);
          removedCount++;

          // 更新反向映射
          const tagUsers = this.tagUserMappings.get(tagId);
          if (tagUsers) {
            tagUsers.delete(userId);
            if (tagUsers.size === 0) {
              this.tagUserMappings.delete(tagId);
            }
          }

          // 更新标签使用计数
          const tag = this.tags.get(tagId);
          if (tag && tag.usageCount > 0) {
            tag.usageCount--;
            tag.updatedAt = new Date();
          }
        }
      }

      // 如果用户没有标签了，移除映射
      if (userTags.size === 0) {
        this.userTagMappings.delete(userId);
      }

      const elapsed = timer.stop();
      console.log(`[TagSystemManager] Removed ${removedCount} tags from user ${userId} in ${elapsed}ms`);

    } catch (error) {
      console.error('[TagSystemManager] Error removing tags from user:', error);
    }
  }

  async getUserTags(userId: EntityId): Promise<TagEntity[]> {
    try {
      this.ensureInitialized();
      
      const userTagIds = this.userTagMappings.get(userId);
      if (!userTagIds) {
        return [];
      }

      const tags = Array.from(userTagIds)
        .map(tagId => this.tags.get(tagId))
        .filter((tag): tag is TagEntity => tag !== undefined)
        .sort((a, b) => a.name.localeCompare(b.name));

      return tags.map(tag => deepClone(tag));

    } catch (error) {
      console.error(`[TagSystemManager] Error getting user tags for ${userId}:`, error);
      return [];
    }
  }

  async getTagUsers(tagId: EntityId): Promise<UserEntity[]> {
    try {
      this.ensureInitialized();
      
      // 注意：这里返回用户ID列表，实际的用户信息需要通过用户管理服务获取
      // 这是为了避免循环依赖和保持职责分离
      console.warn('[TagSystemManager] getTagUsers returns empty array - implement user service integration');
      return [];

    } catch (error) {
      console.error(`[TagSystemManager] Error getting tag users for ${tagId}:`, error);
      return [];
    }
  }

  // ==================== 统计和分析 ====================

  /**
   * 获取标签统计信息
   */
  async getTagStatistics(): Promise<{
    totalTags: number;
    activeTags: number;
    totalCategories: number;
    totalAssociations: number;
    topUsedTags: Array<{ tag: TagEntity; usageCount: number }>;
    categoriesStats: Array<{ category: TagCategory; tagCount: number }>;
  }> {
    try {
      this.ensureInitialized();

      const allTags = Array.from(this.tags.values());
      const activeTags = allTags.filter(tag => tag.isActive);
      const totalAssociations = Array.from(this.userTagMappings.values())
        .reduce((sum, tagSet) => sum + tagSet.size, 0);

      // 最常用的标签（前10个）
      const topUsedTags = activeTags
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 10)
        .map(tag => ({ tag: deepClone(tag), usageCount: tag.usageCount }));

      // 分类统计
      const categoriesStats = Array.from(this.categories.values())
        .map(category => ({
          category: deepClone(category),
          tagCount: activeTags.filter(tag => tag.category === category.name).length
        }))
        .sort((a, b) => b.tagCount - a.tagCount);

      return {
        totalTags: allTags.length,
        activeTags: activeTags.length,
        totalCategories: this.categories.size,
        totalAssociations,
        topUsedTags,
        categoriesStats
      };

    } catch (error) {
      console.error('[TagSystemManager] Error getting statistics:', error);
      throw error;
    }
  }

  // ==================== 私有辅助方法 ====================

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new PreciseAcquisitionError(
        'TagSystemManager is not initialized',
        'service_not_initialized',
        createErrorContext('tag_system', 'ensure_initialized')
      );
    }
  }

  private validateTagDto(dto: any): { valid: boolean; errors: Array<{ field: string; message: string }> } {
    return validateObjectStructure(dto, TAG_VALIDATION_RULES);
  }

  private validateCategoryDto(dto: any): { valid: boolean; errors: Array<{ field: string; message: string }> } {
    return validateObjectStructure(dto, CATEGORY_VALIDATION_RULES);
  }

  private generateRandomColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
      '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F1A',
      '#C44569', '#F8B500', '#3742FA', '#2F3542', '#57606F'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  private async updateCategoryTagCount(categoryName: string): Promise<void> {
    try {
      const category = Array.from(this.categories.values())
        .find(cat => cat.name === categoryName);
      
      if (category) {
        const tagCount = Array.from(this.tags.values())
          .filter(tag => tag.category === categoryName && tag.isActive).length;
        
        category.tagCount = tagCount;
      }
    } catch (error) {
      console.error(`[TagSystemManager] Error updating tag count for category ${categoryName}:`, error);
    }
  }

  private async loadDefaultCategories(): Promise<void> {
    const defaultCategories = [
      { name: '行业', description: '用户所属行业分类' },
      { name: '兴趣', description: '用户兴趣爱好标签' },
      { name: '行为', description: '用户行为特征标签' },
      { name: '地域', description: '用户地理位置标签' },
      { name: '活跃度', description: '用户活跃程度标签' },
      { name: '价值', description: '用户价值评估标签' },
      { name: '风险', description: '用户风险等级标签' },
      { name: '状态', description: '用户状态类标签' }
    ];

    for (const categoryData of defaultCategories) {
      try {
        await this.createCategory(categoryData.name, categoryData.description);
      } catch (error) {
        // 如果分类already exists，继续创建其他分类
        console.debug(`[TagSystemManager] Category '${categoryData.name}' already exists`);
      }
    }
  }

  private async loadSystemTags(): Promise<void> {
    const systemTags = [
      // 行业标签
      { name: '电商', category: '行业', description: '电子商务相关用户' },
      { name: '教育', category: '行业', description: '教育培训相关用户' },
      { name: '科技', category: '行业', description: '科技互联网相关用户' },
      { name: '金融', category: '行业', description: '金融投资相关用户' },
      { name: '娱乐', category: '行业', description: '娱乐传媒相关用户' },
      
      // 活跃度标签
      { name: '高活跃', category: '活跃度', description: '高度活跃用户', color: '#4ECDC4' },
      { name: '中活跃', category: '活跃度', description: '中等活跃用户', color: '#FECA57' },
      { name: '低活跃', category: '活跃度', description: '低活跃用户', color: '#FF6B6B' },
      
      // 价值标签
      { name: '高价值', category: '价值', description: '高价值用户', color: '#4ECDC4' },
      { name: '潜在价值', category: '价值', description: '潜在价值用户', color: '#FECA57' },
      { name: '一般价值', category: '价值', description: '一般价值用户', color: '#96CEB4' },
      
      // 状态标签
      { name: '新用户', category: '状态', description: '新注册用户' },
      { name: '老用户', category: '状态', description: '长期用户' },
      { name: '活跃用户', category: '状态', description: '近期活跃用户' },
      { name: '沉默用户', category: '状态', description: '长期不活跃用户' }
    ];

    for (const tagData of systemTags) {
      try {
        await this.createTag(tagData as CreateTagDto);
      } catch (error) {
        // 如果标签已存在，继续创建其他标签
        console.debug(`[TagSystemManager] Tag '${tagData.name}' already exists`);
      }
    }
  }
}