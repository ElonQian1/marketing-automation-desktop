// src/modules/structural-matching/anchors/structural-matching-container-anchor.ts
// module: structural-matching | layer: anchors | role: 容器锚点生成器
// summary: 自动分析XML结构，生成容器锚点配置，限定搜索范围到合适的容器

import {
  ContainerAnchor,
  ContainerFingerprint,
  BoundsRect,
  ElementInfo,
  XmlContext,
  LayoutType,
} from "../core/structural-matching-types";

/**
 * 🎯 容器锚点生成器
 *
 * 职责：
 * 1. 识别包含目标元素的最佳容器
 * 2. 生成容器XPath和指纹
 * 3. 分析容器布局类型
 * 4. 提供容错策略
 */
export class ContainerAnchorGenerator {
  /**
   * 🔍 生成容器锚点
   */
  static generate(
    targetElement: ElementInfo,
    xmlContext: XmlContext
  ): ContainerAnchor {
    console.log("🎯 [ContainerAnchor] 开始分析容器锚点");

    // 1️⃣ 查找最佳容器候选
    const containerCandidates = this.findContainerCandidates(
      targetElement,
      xmlContext
    );

    // 2️⃣ 评估和选择最佳容器
    const bestContainer = this.selectBestContainer(
      containerCandidates,
      targetElement,
      xmlContext
    );

    if (!bestContainer) {
      console.warn("⚠️ [ContainerAnchor] 未找到合适的容器，使用全局兜底策略");
      return this.createFallbackAnchor();
    }

    // 3️⃣ 生成容器锚点配置
    const anchor = this.createContainerAnchor(bestContainer, targetElement);

    console.log("✅ [ContainerAnchor] 容器锚点生成完成:", {
      xpath: anchor.xpath,
      fingerprint: anchor.fingerprint,
      fallbackStrategy: anchor.fallbackStrategy,
    });

    return anchor;
  }

  /**
   * 🔍 查找容器候选
   */
  private static findContainerCandidates(
    targetElement: ElementInfo,
    xmlContext: XmlContext
  ): ElementInfo[] {
    const candidates: ElementInfo[] = [];

    // 策略1: 查找ScrollView/RecyclerView等滚动容器
    const scrollContainers = xmlContext.allElements.filter(
      (el) =>
        el.scrollable &&
        (el.className.includes("RecyclerView") ||
          el.className.includes("ScrollView") ||
          el.className.includes("ListView"))
    );

    // 策略2: 查找ViewGroup类型的大容器
    const viewGroupContainers = xmlContext.allElements.filter(
      (el) =>
        el.className.includes("ViewGroup") &&
        this.isLargeContainer(el) &&
        this.containsElement(el, targetElement)
    );

    // 策略3: 查找父级容器（向上2-4层）
    const parentContainers = this.findParentContainers(targetElement, 4);

    candidates.push(
      ...scrollContainers,
      ...viewGroupContainers,
      ...parentContainers
    );

    // 去重并过滤
    return this.deduplicateAndFilter(candidates, targetElement);
  }

  /**
   * ⚖️ 选择最佳容器
   */
  private static selectBestContainer(
    candidates: ElementInfo[],
    targetElement: ElementInfo,
    xmlContext: XmlContext
  ): ElementInfo | null {
    if (candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0];

    // 评分标准
    const scores = candidates.map((container) => ({
      container,
      score: this.scoreContainer(container, targetElement, xmlContext),
    }));

    // 按评分排序
    scores.sort((a, b) => b.score - a.score);

    console.log(
      "📊 [ContainerAnchor] 容器评分结果:",
      scores.map((s) => ({
        id: s.container.id,
        className: s.container.className,
        scrollable: s.container.scrollable,
        score: s.score,
      }))
    );

    return scores[0].container;
  }

  /**
   * 📊 容器评分
   */
  private static scoreContainer(
    container: ElementInfo,
    targetElement: ElementInfo,
    xmlContext: XmlContext
  ): number {
    let score = 0;

    // 基础分：滚动容器优先
    if (container.scrollable) score += 30;

    // 类型加分
    if (container.className.includes("RecyclerView")) score += 25;
    else if (container.className.includes("ListView")) score += 20;
    else if (container.className.includes("ScrollView")) score += 15;
    else if (container.className.includes("ViewGroup")) score += 10;

    // 大小适中加分
    const containerBounds = this.parseBounds(container.bounds);
    const screenArea = 1080 * 2400; // 假设屏幕尺寸
    const containerArea =
      (containerBounds.right - containerBounds.left) *
      (containerBounds.bottom - containerBounds.top);
    const areaRatio = containerArea / screenArea;

    if (areaRatio > 0.3 && areaRatio < 0.8) score += 20; // 适中大小
    else if (areaRatio > 0.8) score += 10; // 太大扣分
    else score -= 10; // 太小扣分

    // 子元素数量加分（容器应该包含多个元素）
    const childCount = this.countChildren(container, xmlContext);
    if (childCount > 5 && childCount < 50) score += 15;
    else if (childCount >= 50) score += 10;
    else score -= 5;

    // 深度适中加分
    const depth = this.calculateDepth(targetElement, container);
    if (depth > 0 && depth <= 3) score += 10;
    else if (depth > 3) score -= 5;

    return score;
  }

  /**
   * 🏗️ 创建容器锚点配置
   */
  private static createContainerAnchor(
    container: ElementInfo,
    targetElement: ElementInfo
  ): ContainerAnchor {
    // 生成XPath
    const xpath = this.generateContainerXPath(container);

    // 生成指纹
    const fingerprint = this.generateContainerFingerprint(container);

    // 边界提示
    const boundsHint = this.parseBounds(container.bounds);

    return {
      xpath,
      fingerprint,
      boundsHint,
      fallbackStrategy: "relax", // 默认宽松策略
    };
  }

  /**
   * 🛤️ 生成容器XPath
   */
  private static generateContainerXPath(container: ElementInfo): string {
    const className = container.className.split(".").pop() || "View";

    let xpath = `//${className}`;

    // 添加属性约束
    const constraints: string[] = [];

    if (container.scrollable) {
      constraints.push("@scrollable='true'");
    }

    if (container.resourceId && container.resourceId !== "") {
      // 提取resource-id的有意义部分
      const resourceIdPart =
        container.resourceId.split("/").pop() || container.resourceId;
      if (
        resourceIdPart &&
        !resourceIdPart.includes("0_resource_name_obfuscated")
      ) {
        constraints.push(`@resource-id='${container.resourceId}'`);
      }
    }

    // 添加边界约束（模糊匹配）
    const bounds = this.parseBounds(container.bounds);
    if (bounds.left === 0 && bounds.right > 1000) {
      // 全宽容器
      constraints.push("@bounds[starts-with(., '[0,')]");
    }

    if (constraints.length > 0) {
      xpath += `[${constraints.join(" and ")}]`;
    }

    return xpath;
  }

  /**
   * 🆔 生成容器指纹
   */
  private static generateContainerFingerprint(
    container: ElementInfo
  ): ContainerFingerprint {
    const className = container.className.split(".").pop() || "View";

    const fingerprint: ContainerFingerprint = {
      role: className,
    };

    if (container.scrollable) {
      fingerprint.scrollable = true;
    }

    // 生成边界模式
    const bounds = this.parseBounds(container.bounds);
    if (bounds.left === 0 && bounds.right > 1000) {
      fingerprint.boundsPattern = "[0,*][1080,*]"; // 全宽模式
    } else {
      fingerprint.boundsPattern = `[${bounds.left},*][${bounds.right},*]`;
    }

    return fingerprint;
  }

  /**
   * 🔄 创建兜底锚点
   */
  private static createFallbackAnchor(): ContainerAnchor {
    return {
      xpath: '//*[@scrollable="true"] | //RecyclerView | //ListView',
      fingerprint: {
        role: "View",
        scrollable: true,
      },
      fallbackStrategy: "global",
    };
  }

  // 🛠️ 工具方法

  private static isLargeContainer(element: ElementInfo): boolean {
    const bounds = this.parseBounds(element.bounds);
    const area = (bounds.right - bounds.left) * (bounds.bottom - bounds.top);
    return area > 500000; // 面积阈值
  }

  private static containsElement(
    container: ElementInfo,
    target: ElementInfo
  ): boolean {
    const containerBounds = this.parseBounds(container.bounds);
    const targetBounds = this.parseBounds(target.bounds);

    return (
      targetBounds.left >= containerBounds.left &&
      targetBounds.right <= containerBounds.right &&
      targetBounds.top >= containerBounds.top &&
      targetBounds.bottom <= containerBounds.bottom
    );
  }

  private static findParentContainers(
    element: ElementInfo,
    maxLevels: number
  ): ElementInfo[] {
    const containers: ElementInfo[] = [];
    let current = element.parent;
    let level = 0;

    while (current && level < maxLevels) {
      if (
        current.className.includes("ViewGroup") ||
        current.className.includes("Layout") ||
        current.scrollable
      ) {
        containers.push(current);
      }
      current = current.parent;
      level++;
    }

    return containers;
  }

  private static deduplicateAndFilter(
    candidates: ElementInfo[],
    targetElement: ElementInfo
  ): ElementInfo[] {
    const seen = new Set<string>();
    return candidates.filter((candidate) => {
      if (seen.has(candidate.id)) return false;
      seen.add(candidate.id);
      return this.containsElement(candidate, targetElement);
    });
  }

  private static countChildren(
    container: ElementInfo,
    xmlContext: XmlContext
  ): number {
    return xmlContext.allElements.filter(
      (el) => this.containsElement(container, el) && el.id !== container.id
    ).length;
  }

  private static calculateDepth(
    child: ElementInfo,
    ancestor: ElementInfo
  ): number {
    let current = child.parent;
    let depth = 0;

    while (current && current.id !== ancestor.id && depth < 10) {
      depth++;
      current = current.parent;
    }

    return current?.id === ancestor.id ? depth : -1;
  }

  private static parseBounds(boundsStr: string): BoundsRect {
    // 解析 "[left,top][right,bottom]" 格式
    const matches = boundsStr.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
    if (matches) {
      return {
        left: parseInt(matches[1]),
        top: parseInt(matches[2]),
        right: parseInt(matches[3]),
        bottom: parseInt(matches[4]),
      };
    }
    return { left: 0, top: 0, right: 0, bottom: 0 };
  }
}
