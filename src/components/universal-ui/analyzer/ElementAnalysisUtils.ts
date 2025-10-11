// src/components/universal-ui/analyzer/ElementAnalysisUtils.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 元素分析工具类
 * 包含各种分析方法的实现
 */

import { ElementContext, ElementAnalysisResult } from './types';

export class ElementAnalysisUtils {

  /**
   * 位置分析
   */
  static analyzePosition(element: ElementContext): string {
    const { position, screenWidth, screenHeight } = element;
    let analysis = `位置: (${position.x}, ${position.y}), 尺寸: ${position.width}×${position.height}`;
    
    // 相对位置分析
    const relativeX = position.x / screenWidth;
    const relativeY = position.y / screenHeight;
    
    // 水平位置
    if (relativeX < 0.2) {
      analysis += '，左侧区域';
    } else if (relativeX > 0.8) {
      analysis += '，右侧区域';
    } else {
      analysis += '，中央区域';
    }
    
    // 垂直位置
    if (relativeY < 0.2) {
      analysis += '，顶部';
    } else if (relativeY > 0.8) {
      analysis += '，底部';
    } else if (relativeY > 0.4 && relativeY < 0.6) {
      analysis += '，中部';
    }
    
    // 尺寸判断
    const area = position.width * position.height;
    const screenArea = screenWidth * screenHeight;
    const areaRatio = area / screenArea;
    
    if (areaRatio > 0.1) {
      analysis += '，大型元素';
    } else if (areaRatio < 0.001) {
      analysis += '，小型元素（可能是图标）';
    }
    
    return analysis;
  }
  
  /**
   * 文本内容分析
   */
  static analyzeText(element: ElementContext): string {
    const { text, contentDesc } = element;
    const displayText = text || contentDesc;
    
    if (!displayText) {
      return '无文本内容（可能是图标、图片或装饰元素）';
    }
    
    let analysis = `显示文本: "${displayText}"`;
    
    // 文本长度分析
    if (displayText.length === 1) {
      analysis += ' - 单字符（可能是图标或缩写）';
    } else if (displayText.length <= 4) {
      analysis += ' - 短文本（可能是按钮或标签）';
    } else if (displayText.length <= 20) {
      analysis += ' - 中等长度文本';
    } else {
      analysis += ' - 长文本（可能是描述或内容）';
    }
    
    // 数字检测
    if (/^\d+$/.test(displayText)) {
      analysis += ' - 纯数字（可能是数量、ID或统计）';
    } else if (/\d+/.test(displayText)) {
      analysis += ' - 包含数字';
    }
    
    // 特殊字符检测
    if (/[📱💬🏠👤🔍➕🛍️🛒]/u.test(displayText)) {
      analysis += ' - 包含表情符号或图标';
    }
    
    return analysis;
  }
  
  /**
   * 上下文分析
   */
  static analyzeContext(element: ElementContext): string {
    const { parentElements, siblingElements, childElements } = element;
    let analysis = '';
    
    if (parentElements && parentElements.length > 0) {
      analysis += `父容器: ${parentElements.length}个`;
      const parentTexts = parentElements
        .map(p => p.text || p.contentDesc)
        .filter(t => t)
        .slice(0, 2);
      if (parentTexts.length > 0) {
        analysis += ` (${parentTexts.join(', ')})`;
      }
    }
    
    if (siblingElements && siblingElements.length > 0) {
      analysis += analysis ? '；' : '';
      analysis += `同级元素: ${siblingElements.length}个`;
      const siblingTexts = siblingElements
        .map(s => s.text || s.contentDesc)
        .filter(t => t)
        .slice(0, 3);
      if (siblingTexts.length > 0) {
        analysis += ` (${siblingTexts.join(', ')})`;
      }
    }
    
    if (childElements && childElements.length > 0) {
      analysis += analysis ? '；' : '';
      analysis += `子元素: ${childElements.length}个`;
    }
    
    return analysis || '无上下文信息';
  }
  
  /**
   * 交互性分析
   */
  static analyzeInteraction(element: ElementContext): string {
    const properties = [];
    
    if (element.clickable) properties.push('可点击');
    if (element.scrollable) properties.push('可滚动');
    if (element.focusable) properties.push('可获取焦点');
    if (element.checkable) properties.push('可勾选');
    if (element.enabled) properties.push('启用状态');
    
    if (element.selected) properties.push('当前选中');
    if (element.checked) properties.push('已勾选');
    
    if (properties.length === 0) {
      return '无交互功能（装饰性元素）';
    }
    
    return `交互属性: ${properties.join('、')}`;
  }
  
  /**
   * 语义分析
   */
  static analyzeSemantics(element: ElementContext): string {
    const { text, contentDesc, resourceId, className } = element;
    let analysis = '';
    
    // 类名分析
    if (className) {
      const classAnalysis = this.analyzeClassName(className);
      if (classAnalysis) {
        analysis += `控件类型: ${classAnalysis}`;
      }
    }
    
    // 资源ID分析
    if (resourceId) {
      const idAnalysis = this.analyzeResourceId(resourceId);
      if (idAnalysis) {
        analysis += analysis ? '；' : '';
        analysis += `功能标识: ${idAnalysis}`;
      }
    }
    
    // 文本语义分析
    const displayText = text || contentDesc;
    if (displayText) {
      const textSemantics = this.analyzeTextSemantics(displayText);
      if (textSemantics) {
        analysis += analysis ? '；' : '';
        analysis += `文本语义: ${textSemantics}`;
      }
    }
    
    return analysis || '无明确语义信息';
  }
  
  /**
   * 类名语义分析
   */
  private static analyzeClassName(className: string): string {
    const classMap: Record<string, string> = {
      'TextView': '文本显示控件',
      'Button': '按钮控件',
      'ImageView': '图片显示控件',
      'ImageButton': '图片按钮控件',
      'EditText': '文本输入框',
      'RecyclerView': '列表容器',
      'LinearLayout': '线性布局容器',
      'RelativeLayout': '相对布局容器',
      'FrameLayout': '框架布局容器',
      'ScrollView': '滚动视图容器',
      'WebView': '网页视图',
      'ProgressBar': '进度条',
      'CheckBox': '复选框',
      'RadioButton': '单选按钮',
      'Switch': '开关控件',
      'SeekBar': '滑动条'
    };
    
    for (const [key, value] of Object.entries(classMap)) {
      if (className.includes(key)) {
        return value;
      }
    }
    
    return '';
  }
  
  /**
   * 资源ID语义分析
   */
  private static analyzeResourceId(resourceId: string): string {
    const patterns: Record<string, string> = {
      'search': '搜索功能',
      'btn': '按钮',
      'edit': '编辑功能',
      'text': '文本内容',
      'image': '图片',
      'icon': '图标',
      'menu': '菜单',
      'nav': '导航',
      'tab': '标签页',
      'list': '列表',
      'item': '列表项',
      'title': '标题',
      'content': '内容',
      'container': '容器',
      'layout': '布局'
    };
    
    const lowerResourceId = resourceId.toLowerCase();
    for (const [pattern, meaning] of Object.entries(patterns)) {
      if (lowerResourceId.includes(pattern)) {
        return meaning;
      }
    }
    
    return '';
  }
  
  /**
   * 文本语义分析
   */
  private static analyzeTextSemantics(text: string): string {
    const actionWords = ['点击', '按钮', '确定', '取消', '提交', '保存', '删除', '编辑', '搜索', '发送', '登录', '注册'];
    const navigationWords = ['首页', '发现', '我的', '设置', '消息', '通知'];
    const statusWords = ['已选择', '未选择', '已完成', '进行中', '失败', '成功'];
    
    if (actionWords.some(word => text.includes(word))) {
      return '操作性文本';
    }
    
    if (navigationWords.some(word => text.includes(word))) {
      return '导航性文本';
    }
    
    if (statusWords.some(word => text.includes(word))) {
      return '状态性文本';
    }
    
    if (/^\d+$/.test(text)) {
      return '数字信息';
    }
    
    if (text.length > 50) {
      return '描述性文本';
    }
    
    return '一般文本';
  }

  /**
   * 创建默认分析结果
   */
  static createDefaultResult(): ElementAnalysisResult {
    return {
      elementType: 'unknown',
      functionality: '未知功能',
      userDescription: '未识别的UI元素',
      actionSuggestion: '无明确操作建议',
      confidence: 0.1,
      analysisDetails: {
        positionAnalysis: '',
        textAnalysis: '',
        contextAnalysis: '',
        interactionAnalysis: '',
        semanticAnalysis: ''
      },
      metadata: {
        category: 'display',
        priority: 'low',
        commonUseCase: []
      }
    };
  }
}