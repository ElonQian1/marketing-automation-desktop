// src/modules/structural-matching/services/structural-snapshot-generator.ts
// module: structural-matching | layer: services | role: 结构快照自动生成器
// summary: 从选中元素自动学习并生成完整的结构匹配快照，实现"空/非空"默认策略

/**
 * 🏗️ 结构快照完整数据结构
 */
export interface StructuralSnapshot {
  container: {
    xpath: string;
    fingerprint: {
      role: string;
      scrollable?: boolean;
      bounds_hint?: number[];
    };
  };
  card_root: {
    role: string;
    class_contains?: string;
    clickable_parent_path?: string;
  };
  click?: {
    strategy: 'element' | 'clickable_parent' | 'region';
    inset_ratio?: number;
    allow_clickable_parent?: boolean;
    require_convertible?: boolean;
  };
  skeleton_rules: {
    require_image_above_text?: boolean;
    allow_depth_flex?: number;
    layout_patterns?: string[];
  };
  field_rules: {
    rules: Array<{
      class_contains?: string;
      resource_id?: string;
      content_desc?: string;
      text?: string;
      presence_only?: boolean;  // 空/非空策略的核心标记
      must_be_empty?: boolean;
      must_equal_text?: string;
      position_hint?: string;
    }>;
  };
  geometry: {
    use: boolean;
    expected_layout?: string[];
  };
  template_signature: {
    use: boolean;
    refreshable?: boolean;
    topk?: any[];
  };
  mode: 'Default' | 'Strict' | 'Flexible';
  thresholds: {
    min_confidence: number;
    top_gap: number;
  };
  completeness_score?: number;
}

/**
 * 🎯 结构快照生成器
 * 实现用户描述的"空/非空"默认策略和自动学习功能
 */
export class StructuralSnapshotGenerator {
  
  /**
   * 🤖 自动生成结构快照
   * @param selectedElement 用户选中的元素
   * @param options 生成选项
   */
  generateSnapshot(
    selectedElement: Record<string, unknown>, 
    options: {
      enableGeometry?: boolean;
      enableTemplate?: boolean;
      mode?: 'Default' | 'Strict' | 'Flexible';
    } = {}
  ): StructuralSnapshot {
    console.log('🤖 [StructuralSnapshotGenerator] 开始自动学习生成结构快照');
    console.log('📊 [Generator] 选中元素数据:', {
      elementKeys: Object.keys(selectedElement),
      hasChildren: !!selectedElement.children,
      childrenCount: Array.isArray(selectedElement.children) ? selectedElement.children.length : 0
    });
    
    console.log('🔥 [Critical Debug] 完整selectedElement原始对象:');
    console.log(selectedElement);
    console.log('🔥 [Critical Debug] selectedElement.constructor.name:', selectedElement.constructor.name);
    console.log('🔥 [Critical Debug] JSON.stringify(selectedElement):');
    console.log(JSON.stringify(selectedElement, null, 2));

    // 1. 🏗️ 自动分析容器锚点
    const container = this.analyzeContainer(selectedElement);
    
    // 2. 🎯 自动分析卡片根节点
    const cardRoot = this.analyzeCardRoot(selectedElement);
    
    // 3. 🦴 自动分析骨架规则
    const skeletonRules = this.analyzeSkeletonRules(selectedElement);
    
    // 4. 📝 【核心】自动生成字段规则（空/非空策略）
    const fieldRules = this.generateFieldRulesWithEmptyStrategy(selectedElement);
    
    // 5. 📐 几何配置（默认关闭）
    const geometry = {
      use: options.enableGeometry || false,
      expected_layout: this.inferLayoutPattern(selectedElement)
    };
    
    // 6. 🔖 模板签名配置（默认关闭）
    const templateSignature = {
      use: options.enableTemplate || false,
      refreshable: true,
      topk: []
    };
    
    // 7. 📊 计算完整性评分
    const completenessScore = this.calculateCompletenessScore({
      hasContainer: !!container.xpath,
      hasCardRoot: !!cardRoot.role,
      hasFieldRules: fieldRules.rules.length > 0,
      hasSkeletonRules: Object.keys(skeletonRules).length > 0,
      enableGeometry: geometry.use,
      enableTemplate: templateSignature.use
    });

    // 8. 🎯 点击策略配置（实现用户约定：区域点击）
    const clickStrategy = {
      strategy: 'region' as const,          // 直接区域点击，不需要UIElement转换
      inset_ratio: 0.08,                    // 安全内缩8%防止点到边缘
      allow_clickable_parent: false,        // 用户约定：不需要找可点击父元素
      require_convertible: false            // 关键：不强制要求UIElement转换成功
    };

    const snapshot: StructuralSnapshot = {
      container,
      card_root: cardRoot,
      click: clickStrategy,  // 🎯 新增：区域点击策略
      skeleton_rules: skeletonRules,
      field_rules: fieldRules,
      geometry,
      template_signature: templateSignature,
      mode: options.mode || 'Default',
      thresholds: {
        min_confidence: 0.7,
        top_gap: 0.15
      },
      completeness_score: completenessScore
    };

    console.log('✅ [StructuralSnapshotGenerator] 结构快照生成完成:', {
      completeness_score: completenessScore,
      field_rules_count: fieldRules.rules.length,
      container_xpath: container.xpath,
      card_root_role: cardRoot.role
    });

    return snapshot;
  }

  /**
   * 🏗️ 分析容器锚点 - 改进版：不再瞎猜，提供提示让后端容器限域模块解析
   */
  private analyzeContainer(element: Record<string, unknown>) {
    console.log('🏗️ [Generator] 容器分析 - 使用后端容器限域模块');
    
    // 解析选中元素的bounds
    let boundsHint: number[] = [0, 0, 1080, 2280]; // 默认手机屏幕
    if (element.bounds) {
      try {
        const boundsStr = element.bounds.toString();
        const matches = boundsStr.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
        if (matches) {
          boundsHint = [
            parseInt(matches[1]), parseInt(matches[2]),
            parseInt(matches[3]), parseInt(matches[4])
          ];
        }
      } catch {
        console.warn('⚠️ [Generator] 解析bounds失败，使用默认值');
      }
    }

    const className = (element.class_name || element.className) as string;
    const elementId = (element.id || element.node_id) as string | number;

    // 🔥 关键改进：不再直接生成 xpath，而是提供 hints 让后端的 container_gate 模块解析
    return {
      xpath: null,  // 不填写，让后端容器限域模块自动识别
      fingerprint: {
        role: 'AUTO_DETECT',  // 标记为自动检测模式
        // 提供提示信息供后端 container_gate 使用
        hints: {
          selected_element_id: elementId?.toString(),
          selected_element_bounds: boundsHint,
          selected_element_class: className,
          strategy: 'scrollable_ancestor'  // 使用"向上查找滚动祖先"策略
        }
      }
    };
  }

  /**
   * 🎯 分析卡片根节点
   */
  private analyzeCardRoot(element: Record<string, unknown>) {
    const className = (element.class_name || element.className) as string;
    const isClickable = element.is_clickable || element.clickable;
    
    let role = 'FrameLayout';
    let classContains: string | undefined;
    
    if (className) {
      const simpleName = className.split('.').pop() || className;
      role = simpleName;
      
      // 检测是否是卡片类型
      const cardKeywords = ['Card', 'Item', 'Cell', 'Entry'];
      const foundKeyword = cardKeywords.find(keyword => 
        simpleName.toLowerCase().includes(keyword.toLowerCase())
      );
      if (foundKeyword) {
        classContains = foundKeyword.toLowerCase();
      }
    }

    return {
      role,
      ...(classContains && { class_contains: classContains }),
      ...(isClickable && { clickable_parent_path: '↑1' })
    };
  }

  /**
   * 🦴 分析骨架规则
   */
  private analyzeSkeletonRules(element: Record<string, unknown>) {
    const rules: Record<string, unknown> = {};
    
    // 检测是否有图片和文字的层级关系
    if (this.hasImageAndText(element)) {
      rules.require_image_above_text = true;
    }
    
    // 允许层级弹性
    rules.allow_depth_flex = 1;
    
    // 检测布局模式
    const layoutPattern = this.inferLayoutPattern(element);
    if (layoutPattern.length > 0) {
      rules.layout_patterns = layoutPattern;
    }
    
    return rules;
  }

  /**
   * 📝 【核心】生成字段规则 - 实现"空/非空"策略
   * 这是用户要求的核心功能：空则匹配空，非空则匹配非空
   */
  private generateFieldRulesWithEmptyStrategy(element: Record<string, unknown>) {
    const rules: Array<{
      class_contains?: string;
      resource_id?: string;
      content_desc?: string;
      text?: string;
      presence_only?: boolean;
      must_be_empty?: boolean;
      must_equal_text?: string;
      position_hint?: string;
    }> = [];

    // 🎯 【用户约定】从选中的外层容器开始分析，不论是否可点击
    // 用户约定：不可点父容器与可点子元素bounds完全重合，使用区域点击策略
    const targetElement = element; // 直接使用用户选择的元素，不做智能转换
    console.log('🎯 [FieldRulesGenerator] 按用户约定分析选中元素:', {
      elementId: element.id || 'unknown',
      clickable: this.isElementClickable(element),
      bounds: element.bounds || 'no-bounds',
      elementKeys: Object.keys(element),
      text: element.text,
      content_desc: element.content_desc,
      contentDesc: element.contentDesc,
      resource_id: element.resource_id,
      resourceId: element.resourceId,
      strategy: '从外层容器开始，分析整个子树的字段特征'
    });

    // 🎯 核心策略：扫描元素的各个字段，按"空/非空"原则生成规则
    
    // 🔍 智能字段检测：遍历所有字段找到有内容的字段
    const elementFields = Object.keys(element);
    console.log('🔍 [FieldRulesGenerator] 元素字段分析:', {
      allFields: elementFields,
      fieldValues: elementFields.reduce((acc, field) => {
        acc[field] = element[field];
        return acc;
      }, {} as Record<string, unknown>)
    });

    // 🔍 详细展开所有字段内容
    console.log('📋 [详细字段展开] element完整数据结构:');
    elementFields.forEach(field => {
      console.log(`  ${field}:`, element[field]);
    });
    
    // 🔍 特别关注的字段详细检查
    const keyFields = ['resource_id', 'resourceId', 'resource-id', 'content_desc', 'contentDesc', 'content-desc', 'text', 'elementText', 'class_name', 'className', 'bounds', 'clickable'];
    console.log('🎯 [关键字段检查] 重点字段详情:');
    keyFields.forEach(field => {
      if (element.hasOwnProperty(field) || element[field] !== undefined) {
        console.log(`  ✓ ${field}:`, element[field], `(type: ${typeof element[field]})`);
      } else {
        console.log(`  ✗ ${field}: undefined`);
      }
    });

    // 1. resource_id 规则
    const resourceId = (targetElement.resource_id || targetElement.resourceId || targetElement['resource-id'] || '').toString().trim();
    console.log('🔍 [Debug] resource_id字段详细分析:');
    console.log('  原始字段值:');
    console.log('    targetElement.resource_id:', targetElement.resource_id);
    console.log('    targetElement.resourceId:', targetElement.resourceId);
    console.log('    targetElement["resource-id"]:', targetElement['resource-id']);
    console.log('  计算结果:');
    console.log('    computed_resourceId:', resourceId);
    console.log('    resourceId_length:', resourceId.length);
    console.log('    includes_obfuscated:', resourceId.includes('obfuscated'));
    
    if (resourceId) {
      // 🔧 [Bug修复] obfuscated的resource_id也是有效字段，不应该被排除
      if (resourceId.includes('obfuscated')) {
        console.log('✅ [Debug] 检测到obfuscated resource_id，生成presence_only规则');
        // obfuscated的ID用存在性匹配，不要求精确等值
        rules.push({
          resource_id: resourceId,
          presence_only: true // 有obfuscated ID就匹配，不要求完全相等
        });
      } else {
        console.log('✅ [Debug] 检测到普通resource_id，生成presence_only规则');
        // 非obfuscated的ID可以精确匹配
        rules.push({
          resource_id: resourceId,
          presence_only: true // 有值就匹配
        });
      }
    } else {
      console.log('❌ [Debug] resource_id为空，生成must_be_empty规则');
      rules.push({
        resource_id: '',
        must_be_empty: true // 原来为空，要求继续为空
      });
    }

    // 2. content_desc 规则（尝试多种字段名）
    const contentDesc = (
      targetElement.content_desc || 
      targetElement.contentDesc || 
      targetElement.content_description ||
      targetElement.contentDescription ||
      targetElement.description ||
      targetElement['content-desc'] ||
      ''
    ).toString().trim();
    
    console.log('🔍 [Debug] content_desc字段详细分析:');
    console.log('  原始字段值:');
    console.log('    targetElement.content_desc:', targetElement.content_desc);
    console.log('    targetElement.contentDesc:', targetElement.contentDesc);
    console.log('    targetElement["content-desc"]:', targetElement['content-desc']);
    console.log('    targetElement.content_description:', targetElement.content_description);
    console.log('    targetElement.description:', targetElement.description);
    console.log('  计算结果:');
    console.log('    computed_contentDesc:', contentDesc);
    console.log('    contentDesc_length:', contentDesc.length);
    
    if (contentDesc) {
      console.log('✅ [Debug] 检测到content_desc内容，生成presence_only规则');
      rules.push({
        content_desc: contentDesc,
        presence_only: true // 有内容描述就算匹配
      });
    } else {
      console.log('❌ [Debug] content_desc为空，生成must_be_empty规则');
      rules.push({
        content_desc: '',
        must_be_empty: true // 原来无描述，要求继续无描述
      });
    }

    // 3. text 规则（尝试多种字段名）
    const text = (
      targetElement.text || 
      targetElement.elementText || 
      targetElement.textContent ||
      targetElement.innerText ||
      ''
    ).toString().trim();
    if (text) {
      if (text.length <= 10) {
        // 短文本精确匹配
        rules.push({
          text: text,
          must_equal_text: text
        });
      } else {
        // 长文本只要求存在
        rules.push({
          text: text,
          presence_only: true
        });
      }
    } else {
      rules.push({
        text: '',
        must_be_empty: true // 原来无文本，要求继续无文本
      });
    }

    // 4. 🌳 【增强】递归分析整个子树结构（实现用户需求：学习整个骨架）
    const allDescendantRules = this.analyzeDescendantFields(targetElement, '', 0, 5); // 最多5层深度
    rules.push(...allDescendantRules);

    console.log('📝 [Generator] 字段规则生成完成（空/非空策略）:', {
      total_rules: rules.length,
      presence_only_rules: rules.filter(r => r.presence_only).length,
      must_be_empty_rules: rules.filter(r => r.must_be_empty).length,
      exact_match_rules: rules.filter(r => r.must_equal_text).length
    });

    return { rules };
  }

  /**
   * 🔍 检测是否有图片和文字
   */
  private hasImageAndText(element: Record<string, unknown>): boolean {
    if (!Array.isArray(element.children)) return false;
    
    let hasImage = false;
    let hasText = false;
    
    for (const child of element.children) {
      const className = (child.class_name || child.className || '').toString();
      const text = (child.text || child.elementText || '').toString();
      
      if (className.includes('Image') || className.includes('Icon')) {
        hasImage = true;
      }
      if (text.trim()) {
        hasText = true;
      }
    }
    
    return hasImage && hasText;
  }

  /**
   * 📐 推断布局模式
   */
  private inferLayoutPattern(element: Record<string, unknown>): string[] {
    const patterns: string[] = [];
    
    if (Array.isArray(element.children) && element.children.length > 2) {
      patterns.push('Multi-Item');
    }
    
    // 更多布局推断逻辑可以在这里添加
    return patterns;
  }

  /**
   * 📊 计算完整性评分
   */
  private calculateCompletenessScore(metrics: {
    hasContainer: boolean;
    hasCardRoot: boolean;
    hasFieldRules: boolean;
    hasSkeletonRules: boolean;
    enableGeometry: boolean;
    enableTemplate: boolean;
  }): number {
    let score = 0;
    
    if (metrics.hasContainer) score += 0.30;
    if (metrics.hasCardRoot) score += 0.25;
    if (metrics.hasFieldRules) score += 0.20;
    if (metrics.hasSkeletonRules) score += 0.15;
    if (metrics.enableGeometry) score += 0.05;
    if (metrics.enableTemplate) score += 0.05;
    
    return Math.round(score * 100) / 100;
  }

  /**
   * 🎯 【关键修复】查找可点击元素
   * 当用户选择的元素不可点击时，递归查找第一个可点击的子元素
   */
  private findClickableElement(element: Record<string, unknown>): Record<string, unknown> {
    // 1. 如果当前元素可点击，直接返回
    if (this.isElementClickable(element)) {
      return element;
    }

    // 2. 如果不可点击，查找第一个可点击的子元素
    if (Array.isArray(element.children) && element.children.length > 0) {
      for (const child of element.children) {
        const clickableChild = this.findClickableElement(child);
        if (this.isElementClickable(clickableChild)) {
          return clickableChild;
        }
      }
    }

    // 3. 如果没有找到可点击的子元素，返回原元素（让后续逻辑处理）
    return element;
  }

  /**
   * 🔍 检查元素是否可点击
   */
  private isElementClickable(element: Record<string, unknown>): boolean {
    // 检查多种可能的clickable字段名称
    const clickable = element.clickable ?? element.isClickable ?? element.click;
    
    // 处理字符串形式的boolean值
    if (typeof clickable === 'string') {
      return clickable.toLowerCase() === 'true';
    }
    
    // 处理boolean值
    return Boolean(clickable);
  }

  /**
   * 🌳 【核心】递归分析子孙元素字段特征
   * 实现用户需求：学习整个树结构的字段有值/无值特征
   */
  private analyzeDescendantFields(
    element: Record<string, unknown>, 
    pathPrefix: string, 
    currentDepth: number, 
    maxDepth: number
  ): Array<{
    class_contains?: string;
    resource_id?: string;
    content_desc?: string;
    text?: string;
    presence_only?: boolean;
    must_be_empty?: boolean;
    must_equal_text?: string;
    position_hint?: string;
  }> {
    const rules: Array<{
      class_contains?: string;
      resource_id?: string;
      content_desc?: string;
      text?: string;
      presence_only?: boolean;
      must_be_empty?: boolean;
      must_equal_text?: string;
      position_hint?: string;
    }> = [];
    
    // 深度保护
    if (currentDepth >= maxDepth) {
      return rules;
    }

    // 分析当前元素的字段特征
    const elementPath = pathPrefix ? `${pathPrefix}_${currentDepth}` : `level_${currentDepth}`;
    
    // 1. 类名分析
    const className = (element.class_name || element.className || '').toString();
    if (className) {
      const simpleClass = className.split('.').pop();
      rules.push({
        class_contains: simpleClass,
        presence_only: true,
        position_hint: elementPath
      });
    }

    // 2. resource_id 分析  
    const resourceId = (element.resource_id || element.resourceId || '').toString().trim();
    if (resourceId) {
      // 🔧 [Bug修复] obfuscated的resource_id也是有效字段
      rules.push({
        resource_id: resourceId,
        presence_only: true,
        position_hint: elementPath
      });
    } else {
      rules.push({
        resource_id: '',
        must_be_empty: true,
        position_hint: elementPath
      });
    }

    // 3. content_desc 分析
    const contentDesc = (element.content_desc || element.contentDesc || '').toString().trim();
    if (contentDesc) {
      rules.push({
        content_desc: contentDesc,
        presence_only: true,
        position_hint: elementPath
      });
    } else {
      rules.push({
        content_desc: '',
        must_be_empty: true,
        position_hint: elementPath
      });
    }

    // 4. text 分析
    const text = (element.text || element.elementText || '').toString().trim();
    if (text) {
      if (text.length <= 10) {
        // 短文本精确匹配
        rules.push({
          text: text,
          must_equal_text: text,
          position_hint: elementPath
        });
      } else {
        // 长文本只要求存在
        rules.push({
          text: text,
          presence_only: true,
          position_hint: elementPath
        });
      }
    } else {
      rules.push({
        text: '',
        must_be_empty: true,
        position_hint: elementPath
      });
    }

    // 5. 递归处理子元素
    if (Array.isArray(element.children) && element.children.length > 0) {
      element.children.forEach((child: Record<string, unknown>, index: number) => {
        const childRules = this.analyzeDescendantFields(
          child, 
          `${elementPath}_child${index}`, 
          currentDepth + 1, 
          maxDepth
        );
        rules.push(...childRules);
      });
    }

    return rules;
  }
}

/**
 * 🏭 工厂函数：创建默认的结构快照生成器
 */
export const createStructuralSnapshotGenerator = () => {
  return new StructuralSnapshotGenerator();
};