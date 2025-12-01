// src/pages/SmartScriptBuilderPage/hooks/step-card-integration/utils/xpath-utils.ts
// module: pages | layer: hooks | role: utils
// summary: XPath 生成和验证工具函数

import type { UIElement } from "../../../../../api/universalUIAPI";
import { buildXPath } from "../../../../../utils/xpath/generation";

/**
 * 生成有效的 XPath
 * 优先使用元素自带的 xpath，如果无效则生成新的
 */
export function generateValidXPath(element: UIElement): string {
  // 如果元素已有 xpath 且是绝对路径（以//或/开头），直接使用
  if (element.xpath && element.xpath.trim()) {
    const trimmedXPath = element.xpath.trim();

    if (trimmedXPath.startsWith("/") || trimmedXPath.startsWith("//")) {
      console.log("[generateValidXPath] 使用元素自带的绝对XPath:", trimmedXPath);
      return trimmedXPath;
    }

    // 忽略无效的内部ID XPath (如 element_27)
    if (trimmedXPath.startsWith("element_") || trimmedXPath.includes("element_")) {
      console.warn("[generateValidXPath] 忽略无效的内部ID XPath:", element.xpath);
    } else {
      // 相对路径，转换为绝对路径
      const absolutePath = "//" + trimmedXPath;
      console.warn("[generateValidXPath] 转换相对路径为绝对路径:", absolutePath);
      return absolutePath;
    }
  }

  // 使用 buildXPath 生成
  console.warn("[generateValidXPath] 元素没有有效xpath，尝试生成...");

  const generatedXPath = buildXPath(element, {
    useAttributes: true,
    useText: true,
    useIndex: false,
    preferredAttributes: ["resource-id", "content-desc", "text", "class"],
  });

  if (generatedXPath) {
    console.log("[generateValidXPath] 生成的XPath:", generatedXPath);
    return generatedXPath;
  }

  // buildXPath 失败，手动构建回退 XPath
  return buildFallbackXPath(element);
}

/**
 * 构建回退 XPath
 */
export function buildFallbackXPath(element: UIElement): string {
  if (element.resource_id) {
    return `//*[@resource-id='${element.resource_id}']`;
  }
  if (element.text) {
    return `//*[@text='${element.text}']`;
  }
  if (element.content_desc) {
    return `//*[@content-desc='${element.content_desc}']`;
  }
  return `//*[@class='${element.class_name || "android.view.View"}']`;
}

/**
 * 验证 XPath 是否有效
 */
export function validateXPath(xpath: string): boolean {
  if (!xpath || xpath.length < 5) {
    return false;
  }

  // 检查是否是有效的 XPath 格式
  if (!xpath.startsWith("/") && !xpath.startsWith("//")) {
    return false;
  }

  // 检查是否是无效的内部ID
  if (xpath.includes("element_")) {
    return false;
  }

  return true;
}

/**
 * 生成智能匹配配置
 * 解决"已关注"vs"关注"按钮混淆问题
 */
export function buildSmartMatchingConfig(elementText: string): {
  targetText: string;
  exclusionRules: string[];
  aliases: string[];
} {
  const isFollowedButton =
    elementText.includes("已关注") || elementText.includes("已关注");
  const isFollowButton = elementText.includes("关注") && !isFollowedButton;

  return {
    targetText: elementText,
    exclusionRules: isFollowedButton
      ? ["关注", "+关注", "Follow", "关注中"]
      : isFollowButton
      ? ["已关注", "取消关注", "Following", "Unfollow"]
      : [],
    aliases: isFollowedButton
      ? ["已关注", "已关注", "Following"]
      : isFollowButton
      ? ["关注", "+关注", "Follow"]
      : [elementText].filter(Boolean),
  };
}
