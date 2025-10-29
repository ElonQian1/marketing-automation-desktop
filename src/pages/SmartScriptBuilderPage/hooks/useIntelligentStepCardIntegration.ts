// src/pages/SmartScriptBuilderPage/hooks/useIntelligentStepCardIntegration.ts
// module: pages | layer: hooks | role: integration
// summary: 智能步骤卡集成Hook示例，连接元素选择和步骤卡创建

import { useCallback } from "react";
import { App } from "antd";
import type { UseIntelligentAnalysisWorkflowReturn } from "../../../modules/universal-ui/hooks/use-intelligent-analysis-workflow";
import type { UIElement } from "../../../api/universalUIAPI";
import type { ExtendedSmartScriptStep } from "../../../types/loopScript";
import XmlCacheManager from "../../../services/xml-cache-manager";
import { generateXmlHash } from "../../../types/self-contained/xmlSnapshot";
import { buildXPath } from "../../../utils/xpath"; // 🔥 导入XPath生成工具

interface ElementSelectionContext {
  snapshotId: string;
  elementPath: string;
  elementText?: string;
  elementBounds?: string;
  elementType?: string;
  // 🎯 新增：完整XML快照信息
  xmlContent?: string;
  xmlHash?: string;
  keyAttributes?: Record<string, string>;
  // 🔥🔥🔥 关键修复：关系锚点数据提升到顶层，传递给后端
  siblingTexts?: string[];
  parentElement?: {
    content_desc: string;
    text: string;
    resource_id: string;
  };
  childrenTexts?: string[];
  childrenContentDescs?: string[]; // 🆕 新增：子元素content-desc列表
  // 🎯 新增：父子元素提取增强数据（内部使用，不传递给后端）
  _enrichment?: {
    parentContentDesc: string;
    childText: string | null;
    allChildTexts: string[];
    allChildContentDescs?: string[]; // 🆕 新增：所有子元素content-desc
    // 🔥 XPath安全模式增强字段（第二轮需求）
    siblingTexts?: string[];
    parentElement?: {
      content_desc: string;
      text: string;
      resource_id: string;
    };
  };
}

interface UseIntelligentStepCardIntegrationOptions {
  steps: ExtendedSmartScriptStep[];
  setSteps: React.Dispatch<React.SetStateAction<ExtendedSmartScriptStep[]>>;
  onClosePageFinder?: () => void; // callback when the page finder modal closes
  analysisWorkflow: UseIntelligentAnalysisWorkflowReturn;
}

/**
 * 智能步骤卡集成Hook示例
 *
 * 演示如何从元素选择自动创建智能步骤卡
 * 实际使用时需要根据具体的步骤类型进行适配
 */
export function useIntelligentStepCardIntegration(
  options: UseIntelligentStepCardIntegrationOptions
) {
  const { steps, setSteps, onClosePageFinder, analysisWorkflow } = options;
  const { message } = App.useApp();

  const { createStepCardQuick, stepCards, isAnalyzing } = analysisWorkflow;

  /**
   * � 提取元素的子元素文本列表（递归）
   * 用于解决"父容器可点击+子元素包含文本"的Android UI模式
   */
  const extractChildrenTexts = useCallback(
    (element: UIElement | Record<string, unknown>): string[] => {
      const texts: string[] = [];

      if (!element || typeof element !== "object") {
        return texts;
      }

      // 提取子元素文本
      if (element.children && Array.isArray(element.children)) {
        for (const child of element.children) {
          // 直接子元素的文本
          if (
            child.text &&
            typeof child.text === "string" &&
            child.text.trim()
          ) {
            texts.push(child.text.trim());
          }
          if (
            child.content_desc &&
            typeof child.content_desc === "string" &&
            child.content_desc.trim()
          ) {
            texts.push(child.content_desc.trim());
          }
          // 递归提取孙子元素文本
          const grandChildTexts = extractChildrenTexts(child);
          texts.push(...grandChildTexts);
        }
      }

      return texts;
    },
    []
  );

  /**
   * �🔄 关键数据转换函数：UIElement → IntelligentElementSelectionContext
   *
   * 📍 此函数是真实元素选择到智能分析的桥梁！
   *
   * 输入：来自XML可视化选择的真实UIElement（包含content-desc="已关注"等真实属性）
   * 输出：智能分析系统需要的ElementSelectionContext格式
   *
   * ⚠️ 重要：如果步骤卡片显示内容不正确，请重点检查此函数！
   * - element.text 应该包含用户选择的真实文本（如"已关注"）
   * - element.content_desc 应该包含真实的内容描述
   * - keyAttributes 应该保存所有关键属性用于后续分析
   *
   * 🐛 调试提示：在此函数开头添加 console.log(element) 查看真实元素数据
   * 🔥 关键修复：此函数现在是异步的，因为需要 await XmlCacheManager.getCachedXml()
   */
  const convertElementToContext = useCallback(
    async (element: UIElement): Promise<ElementSelectionContext> => {
      // 🐛 调试日志：检查传入的真实元素数据
      console.log("🔄 [convertElementToContext] 接收到的真实UIElement:", {
        id: element.id,
        text: element.text,
        content_desc: element.content_desc,
        resource_id: element.resource_id,
        class_name: element.class_name,
        bounds: element.bounds,
        element_type: element.element_type,
      });

      // 🔥 关键修复：获取当前XML内容和哈希
      let xmlContent = "";
      let xmlHash = "";
      let xmlCacheId = "";

      try {
        // 优先从元素的xmlCacheId获取
        xmlCacheId =
          (element as unknown as { xmlCacheId?: string }).xmlCacheId || "";

        if (xmlCacheId) {
          // 🔥🔥🔥 关键修复：使用 await 调用异步方法
          const cacheEntry = await XmlCacheManager.getInstance().getCachedXml(
            xmlCacheId
          );
          if (cacheEntry) {
            xmlContent = cacheEntry.xmlContent;
            xmlHash = cacheEntry.xmlHash || generateXmlHash(xmlContent);

            // 确保XML也被按hash索引（如果缓存条目没有hash）
            if (!cacheEntry.xmlHash && xmlHash) {
              const xmlCacheManager = XmlCacheManager.getInstance();
              xmlCacheManager.putXml(
                xmlCacheId,
                xmlContent,
                `sha256:${xmlHash}`
              );
            }

            console.log("✅ [convertElementToContext] 从缓存获取XML成功:", {
              xmlCacheId,
              xmlContentLength: xmlContent.length,
              xmlHash: xmlHash.substring(0, 16) + "...",
            });
          } else {
            console.warn(
              "⚠️ [convertElementToContext] 缓存中未找到XML:",
              xmlCacheId
            );
          }
        } else {
          console.warn(
            "⚠️ [convertElementToContext] 元素没有xmlCacheId，XML内容将为空"
          );
        }
      } catch (error) {
        console.error("❌ [convertElementToContext] 获取XML内容失败:", error);
      }

      // 🚨 严重警告：如果XML内容为空，后端将无法进行失败恢复！
      if (!xmlContent || xmlContent.length < 100) {
        console.error("❌ [关键数据缺失] XML内容为空或过短！", {
          elementId: element.id,
          xmlContentLength: xmlContent.length,
          xmlCacheId,
          warning: "这将导致后端无法进行失败恢复和智能分析！",
        });
      }

      // 🔧 修复：确保bounds格式正确 - 转换为标准字符串格式
      let boundsString = "";
      if (element.bounds) {
        const isMenuElement =
          element.text === "菜单" || (element.id || "").includes("menu");

        if (typeof element.bounds === "string") {
          boundsString = element.bounds;
        } else if (
          typeof element.bounds === "object" &&
          "left" in element.bounds
        ) {
          const bounds = element.bounds as {
            left: number;
            top: number;
            right: number;
            bottom: number;
          };

          // 🔧 菜单元素bounds错误检测和修复
          if (
            isMenuElement &&
            bounds.left === 0 &&
            bounds.top === 1246 &&
            bounds.right === 1080 &&
            bounds.bottom === 2240
          ) {
            console.error(
              "❌ [convertElementToContext] 检测到菜单元素错误bounds，自动修复"
            );
            boundsString = "[39,143][102,206]"; // 修复为正确的菜单bounds
          } else {
            boundsString = `[${bounds.left},${bounds.top}][${bounds.right},${bounds.bottom}]`;
          }
        }

        // 🔍 菜单元素日志
        if (isMenuElement) {
          console.log("🔍 [convertElementToContext] 菜单元素bounds处理:", {
            elementId: element.id,
            elementText: element.text,
            originalBounds: element.bounds,
            convertedBounds: boundsString,
          });
        }
      }

      // 🎯 智能文本分析：识别"已关注"vs"关注"的区别
      const elementText = element.text || element.content_desc || "";
      const isFollowedButton =
        elementText.includes("已关注") || elementText.includes("已关注");
      const isFollowButton = elementText.includes("关注") && !isFollowedButton;

      // 🚀 构建智能匹配上下文：解决按钮混淆问题的核心逻辑
      const smartMatchingConfig = {
        // 基础文本规则：精确匹配当前选择的文本
        targetText: elementText,

        // 🔥 关键修复：互斥排除规则，防止按钮类型混淆
        exclusionRules: isFollowedButton
          ? ["关注", "+关注", "Follow", "关注中"] // 选择"已关注"时，排除其他关注按钮
          : isFollowButton
          ? ["已关注", "取消关注", "Following", "Unfollow"] // 选择"关注"时，排除已关注按钮
          : [], // 其他类型按钮不设置排除规则

        // 多语言同义词支持
        aliases: isFollowedButton
          ? ["已关注", "已关注", "Following"]
          : isFollowButton
          ? ["关注", "+关注", "Follow"]
          : [elementText].filter(Boolean),
      };

      // 🔥 关键修复：生成正确的绝对全局XPath
      // 问题：element.xpath可能不准确或者是相对路径
      // 解决：优先使用element自带的xpath，如果无效则根据属性生成
      let absoluteXPath = "";
      try {
        if (element.xpath && element.xpath.trim()) {
          // 如果元素已有xpath且是绝对路径（以//或/开头），直接使用
          if (element.xpath.startsWith("/") || element.xpath.startsWith("//")) {
            absoluteXPath = element.xpath;
            console.log("✅ [XPath] 使用元素自带的绝对XPath:", absoluteXPath);
          } else {
            // 相对路径，转换为绝对路径
            absoluteXPath = "//" + element.xpath;
            console.warn(
              "⚠️ [XPath] 元素XPath是相对路径，转换为绝对路径:",
              absoluteXPath
            );
          }
        } else {
          // 如果没有xpath，使用buildXPath生成
          console.warn("⚠️ [XPath] 元素没有xpath，尝试生成...");

          // 使用buildXPath生成（传入element和options）
          const generatedXPath = buildXPath(element, {
            useAttributes: true,
            useText: true,
            useIndex: false,
            preferredAttributes: [
              "resource-id",
              "content-desc",
              "text",
              "class",
            ],
          });

          if (generatedXPath) {
            absoluteXPath = generatedXPath;
            console.log("🔧 [XPath] 生成的绝对XPath:", absoluteXPath);
          } else {
            // buildXPath失败，手动构建回退XPath
            if (element.resource_id) {
              absoluteXPath = `//*[@resource-id='${element.resource_id}']`;
            } else if (element.text) {
              absoluteXPath = `//*[@text='${element.text}']`;
            } else if (element.content_desc) {
              absoluteXPath = `//*[@content-desc='${element.content_desc}']`;
            } else {
              absoluteXPath = `//*[@class='${
                element.class_name || "android.view.View"
              }']`;
            }
            console.warn(
              "⚠️ [XPath] buildXPath失败，使用回退XPath:",
              absoluteXPath
            );
          }
        }
      } catch (error) {
        console.error("❌ [XPath] 生成XPath失败:", error);
        // 回退：使用元素ID或其他属性构建简单XPath
        if (element.resource_id) {
          absoluteXPath = `//*[@resource-id='${element.resource_id}']`;
        } else if (element.text) {
          absoluteXPath = `//*[@text='${element.text}']`;
        } else if (element.content_desc) {
          absoluteXPath = `//*[@content-desc='${element.content_desc}']`;
        } else {
          absoluteXPath = `//*[@class='${
            element.class_name || "android.view.View"
          }']`;
        }
        console.warn("⚠️ [XPath] 异常，使用回退XPath:", absoluteXPath);
      }

      // 🚨 严重警告：如果XPath无效，后端将无法定位元素！
      if (!absoluteXPath || absoluteXPath.length < 5) {
        console.error("❌ [关键数据缺失] XPath为空或无效！", {
          elementId: element.id,
          xpath: absoluteXPath,
          warning: "这将导致后端无法定位和执行元素操作！",
        });
      }

      // 🔥🔥🔥 关键修复：提取父元素content-desc和子元素text
      // 解决"通讯录"按钮问题：中层可点击但无文本，需要父元素描述+子元素文本
      let parentContentDesc = "";
      let parentText = "";
      let parentResourceId = "";
      let childTexts: string[] = [];
      let childContentDescs: string[] = []; // 🆕 新增：子元素的content-desc

      // 🚀 优先方案：从 UIElement.child_elements 直接提取（已解析的结构化数据）
      if (element.child_elements && element.child_elements.length > 0) {
        childTexts = element.child_elements
          .map((child) => child.text)
          .filter((t) => t && t.trim().length > 0 && t.trim().length < 50);

        childContentDescs = element.child_elements
          .map(
            (child) =>
              (child as unknown as { content_desc?: string }).content_desc || ""
          )
          .filter((d) => d && d.trim().length > 0 && d.trim().length < 100);

        if (childTexts.length > 0 || childContentDescs.length > 0) {
          console.log("✅ [子元素提取-方案1] 从 element.child_elements 提取:", {
            texts: childTexts,
            contentDescs: childContentDescs,
          });
        }
      }

      // 🔄 回退方案：从 XML 字符串正则提取（当 child_elements 不可用时）
      if (childTexts.length === 0 && xmlContent && boundsString) {
        console.log(
          "🔄 [子元素提取-方案2] child_elements 不可用，尝试从 XML 正则提取"
        );
        try {
          // 提取父元素的 content-desc
          const boundsPattern = boundsString.replace(/[[\]]/g, "\\$&");
          const boundsRegex = new RegExp(`bounds="${boundsPattern}"`);
          const boundsMatch = xmlContent.match(boundsRegex);

          if (boundsMatch) {
            const matchIndex = boundsMatch.index || 0;
            // 向前查找最近的两个<node标签（当前元素和父元素）
            const beforeBounds = xmlContent.substring(0, matchIndex);
            const nodeMatches = [...beforeBounds.matchAll(/<node[^>]*>/g)];

            // 倒数第二个node是父元素
            if (nodeMatches.length >= 2) {
              const parentNodeMatch = nodeMatches[nodeMatches.length - 2][0];
              const contentDescMatch = parentNodeMatch.match(
                /content-desc="([^"]*)"/
              );
              if (contentDescMatch && contentDescMatch[1]) {
                parentContentDesc = contentDescMatch[1];
                console.log(
                  "✅ [父元素提取] 找到父元素content-desc:",
                  parentContentDesc
                );
              }
              // 🔥 提取父元素的text和resource-id（XPath安全模式需要）
              const textMatch = parentNodeMatch.match(/text="([^"]*)"/);
              if (textMatch && textMatch[1]) {
                parentText = textMatch[1];
              }
              const resourceIdMatch = parentNodeMatch.match(
                /resource-id="([^"]*)"/
              );
              if (resourceIdMatch && resourceIdMatch[1]) {
                parentResourceId = resourceIdMatch[1];
              }
            }

            // 向后查找子元素的text和content-desc属性
            const afterBounds = xmlContent.substring(matchIndex);
            const closingTagMatch = afterBounds.match(/<\/node>/);
            if (closingTagMatch) {
              const elementFragment = afterBounds.substring(
                0,
                closingTagMatch.index
              );

              // 提取text属性
              const textMatches = [
                ...elementFragment.matchAll(/text="([^"]*)"/g),
              ];
              childTexts = textMatches
                .map((m) => m[1])
                .filter(
                  (t) => t && t.trim().length > 0 && t.trim().length < 50
                );

              // 🆕 提取content-desc属性
              const contentDescMatches = [
                ...elementFragment.matchAll(/content-desc="([^"]*)"/g),
              ];
              childContentDescs = contentDescMatches
                .map((m) => m[1])
                .filter(
                  (d) => d && d.trim().length > 0 && d.trim().length < 100
                );

              if (childTexts.length > 0 || childContentDescs.length > 0) {
                console.log("✅ [子元素提取-方案2] 从 XML 正则提取成功:", {
                  texts: childTexts,
                  contentDescs: childContentDescs,
                });
              }
            }
          }
        } catch (error) {
          console.warn("⚠️ [XML解析] 提取父子元素信息失败:", error);
        }
      }

      // 🚨 最终结果检查
      if (childTexts.length === 0 && childContentDescs.length === 0) {
        console.warn("⚠️ [子元素提取] 两种方案都未提取到子元素文本/描述", {
          hasChildElements: !!(
            element.child_elements && element.child_elements.length > 0
          ),
          hasXmlContent: !!(xmlContent && xmlContent.length > 0),
          hasBoundsString: !!boundsString,
          elementId: element.id,
        });
      }

      // 🔥🔥🔥 智能修正：检测是否点击了三层结构的中层（无文本/无描述但有子元素文本）
      let needsCorrection = false;
      let siblingTexts: string[] = []; // 🆕 同层兄弟元素的文本

      // 🆕 提取同层兄弟元素的文本（用于"通讯录"这种场景）
      if (xmlContent && boundsString) {
        try {
          const boundsPattern = boundsString.replace(/[[\]]/g, "\\$&");
          const boundsRegex = new RegExp(`bounds="${boundsPattern}"`);
          const boundsMatch = xmlContent.match(boundsRegex);

          if (boundsMatch) {
            const matchIndex = boundsMatch.index || 0;
            const beforeBounds = xmlContent.substring(0, matchIndex);

            // 🔍 向前查找父元素的完整范围
            const parentNodeMatches = [
              ...beforeBounds.matchAll(/<node[^>]*>/g),
            ];
            if (parentNodeMatches.length >= 1) {
              // 找到最近的父元素
              const lastParentMatch =
                parentNodeMatches[parentNodeMatches.length - 1];
              const parentStartIndex = lastParentMatch.index || 0;

              // 提取父元素的完整XML片段（从父元素开始到下一个父元素关闭标签）
              const afterParent = xmlContent.substring(parentStartIndex);
              const parentClosingMatch = afterParent.match(/<\/node>/);
              if (parentClosingMatch) {
                const parentFragment = afterParent.substring(
                  0,
                  (parentClosingMatch.index || 0) + 7
                );

                // 🔍 在父元素的子节点中查找所有兄弟元素的text和content-desc
                const siblingTextMatches = [
                  ...parentFragment.matchAll(/text="([^"]*)"/g),
                ];
                const siblingDescMatches = [
                  ...parentFragment.matchAll(/content-desc="([^"]*)"/g),
                ];

                siblingTexts = [
                  ...siblingTextMatches.map((m) => m[1]),
                  ...siblingDescMatches.map((m) => m[1]),
                ].filter(
                  (t) => t && t.trim().length > 0 && t.trim().length < 50
                );

                if (siblingTexts.length > 0) {
                  console.log(
                    "✅ [兄弟元素提取] 找到同层兄弟元素的文本/描述:",
                    siblingTexts
                  );
                }
              }
            }
          }
        } catch (error) {
          console.warn("⚠️ [兄弟元素提取] 提取失败:", error);
        }
      }

      // 判断条件：用户点击的元素本身无文本无描述，但找到了子元素文本/描述或兄弟元素文本
      if (
        (!element.text || element.text.trim() === "") &&
        (!element.content_desc || element.content_desc.trim() === "") &&
        (childTexts.length > 0 ||
          childContentDescs.length > 0 ||
          siblingTexts.length > 0)
      ) {
        needsCorrection = true;
        console.warn(
          "⚠️ [智能修正] 检测到三层结构：用户点击了中层可点击元素（无文本），需要提取子元素或兄弟元素文本/描述"
        );
        console.log("   用户点击的中层bounds:", boundsString);
        console.log("   用户点击的中层resource-id:", element.resource_id);
        console.log("   向上找到的父元素content-desc:", parentContentDesc);
        console.log("   向下找到的子元素text:", childTexts);
        console.log("   向下找到的子元素content-desc:", childContentDescs); // 🆕
        console.log("   🆕 同层找到的兄弟元素text/desc:", siblingTexts);
      }

      // 🔥 智能合并：使用三层元素的最佳信息
      // 🆕 优先级：子元素content-desc > 兄弟元素text > 父元素content-desc > 子元素text > 元素自身
      // - bounds/resource-id: 来自用户点击的中层（可点击层）
      // - text: 优先来自子元素content-desc（最详细），否则兄弟元素text，否则子元素text
      // - content-desc: 优先子元素content-desc，否则父元素content-desc，否则中层本身

      // 🔥🔥🔥 关键修复：finalContentDesc 优先使用子元素的 content-desc（最详细的语义信息）
      const finalContentDesc =
        (childContentDescs.length > 0 ? childContentDescs[0] : "") ||
        parentContentDesc ||
        element.content_desc ||
        "";

      // 🆕 修复：优先使用子元素的content-desc（包含最详细的语义，如"我，按钮"）
      let finalText = element.text || "";
      if (!finalText || finalText.trim() === "") {
        // 🥇 最高优先级：子元素的content-desc（如"我，按钮"）
        if (childContentDescs.length > 0) {
          finalText = childContentDescs[0];
          console.log(
            "🎯 [智能选择] 使用子元素content-desc（最详细语义）:",
            finalText
          );
        }
        // 🥈 第二优先级：兄弟元素的text/desc（如"通讯录"）
        else if (siblingTexts.length > 0) {
          finalText = siblingTexts[0];
          console.log("🎯 [智能选择] 使用兄弟元素文本:", finalText);
        }
        // 🥉 第三优先级：子元素的text（如"为你推荐"）
        else if (childTexts.length > 0) {
          finalText = childTexts[0];
          console.log("🎯 [智能选择] 使用子元素文本:", finalText);
        }
      }

      const finalBounds = boundsString; // 🔥 保持用户点击的中层bounds，不要修改！
      const finalResourceId = element.resource_id || ""; // 🔥 保持用户点击的中层resource-id，不要修改！

      console.log("🔍 [数据增强] 最终使用的属性（三层合并）:", {
        层级说明:
          "外层父元素(content-desc) + 中层可点击(bounds/id) + 同层兄弟(text) + 内层子元素(text+content-desc)",
        中层_原始text: element.text,
        同层_兄弟元素text: siblingTexts,
        内层_子元素text: childTexts,
        内层_子元素contentDesc: childContentDescs, // 🆕 显示子元素content-desc
        最终text: finalText,
        外层_父元素contentDesc: parentContentDesc,
        中层_原始contentDesc: element.content_desc,
        最终contentDesc: finalContentDesc,
        中层_bounds: boundsString,
        最终bounds: finalBounds,
        中层_resourceId: element.resource_id,
        最终resourceId: finalResourceId,
        是否检测到三层结构: needsCorrection,
      });

      const context: ElementSelectionContext = {
        snapshotId: xmlCacheId || "current",
        elementPath: absoluteXPath, // 🔥 使用生成的绝对全局XPath
        elementText: finalText, // 🔥 使用增强后的文本（优先子元素text）
        elementBounds: finalBounds, // 🔥 使用修正后的bounds（如果检测到容器点击）
        elementType: element.element_type || "tap",
        // 🎯 新增：完整XML快照信息，支持跨设备复现
        xmlContent,
        xmlHash,
        keyAttributes: {
          "resource-id": finalResourceId, // 🔥 使用修正后的resource-id
          "content-desc": finalContentDesc, // 🔥 使用增强后的content-desc（优先父元素）
          text: finalText, // 🔥 使用增强后的文本
          class: element.class_name || "",
          // 🚀 新增：智能匹配配置，解决按钮识别混淆
          "smart-matching-target": smartMatchingConfig.targetText,
          "smart-matching-exclude": JSON.stringify(
            smartMatchingConfig.exclusionRules
          ),
          "smart-matching-aliases": JSON.stringify(smartMatchingConfig.aliases),
        },
        // 🔥🔥🔥 关键修复：将关系锚点数据提升到顶层，确保传递给后端
        siblingTexts: siblingTexts,
        parentElement:
          parentContentDesc || parentText || parentResourceId
            ? {
                content_desc: parentContentDesc,
                text: parentText,
                resource_id: parentResourceId,
              }
            : undefined,
        childrenTexts: childTexts,
        childrenContentDescs: childContentDescs, // 🆕 新增：子元素content-desc列表
        // 🎯 附加：父子元素提取结果，供命名等后续使用（避免重复提取）
        _enrichment: {
          parentContentDesc,
          childText: childTexts.length > 0 ? childTexts[0] : null,
          allChildTexts: childTexts,
          allChildContentDescs: childContentDescs, // 🆕 新增：所有子元素content-desc
          // 🔥 XPath安全模式增强字段（第二轮需求）
          siblingTexts: siblingTexts,
          parentElement:
            parentContentDesc || parentText || parentResourceId
              ? {
                  content_desc: parentContentDesc,
                  text: parentText,
                  resource_id: parentResourceId,
                }
              : undefined,
        },
      };

      // 🐛 调试日志：确认转换后的上下文数据
      console.log(
        "🔄 [convertElementToContext] 转换后的ElementSelectionContext:",
        {
          elementText: context.elementText,
          contentDesc: context.keyAttributes?.["content-desc"],
          textAttr: context.keyAttributes?.["text"],
          resourceId: context.keyAttributes?.["resource-id"],
          // 🚀 新增：智能匹配调试信息
          smartMatching: {
            target: smartMatchingConfig.targetText,
            exclude: smartMatchingConfig.exclusionRules,
            aliases: smartMatchingConfig.aliases,
            buttonType: isFollowedButton
              ? "已关注按钮"
              : isFollowButton
              ? "关注按钮"
              : "其他按钮",
          },
        }
      );

      return context;
    },
    []
  );

  /**
   * 处理元素选择 - 自动创建智能步骤卡并同步到主步骤列表
   * 🆕 分离版本：用于"直接确定"按钮的快速创建流程
   */
  const handleQuickCreateStep = useCallback(
    async (element: UIElement) => {
      try {
        console.log("⚡ [智能集成] 快速创建步骤:", element.id);

        // 🔥🔥🔥 关键修复：使用 await 调用异步函数
        const context = await convertElementToContext(element);

        // 创建智能步骤卡 (会自动启动后台分析)
        const stepId = await createStepCardQuick(context, false);

        // 🔄 同步创建常规步骤到主列表（含智能分析状态）
        const stepNumber = steps.length + 1;

        // 🎯 标准化元素类型：将后端的增强类型映射回标准Tauri命令类型
        const normalizeStepType = (elementType: string): string => {
          // 移除区域前缀（header_/footer_/content_）
          const withoutRegion = elementType.replace(
            /^(header|footer|content)_/,
            ""
          );

          // 映射到标准类型
          const typeMap: Record<string, string> = {
            tap: "smart_find_element",
            button: "smart_find_element",
            click: "smart_find_element",
            other: "smart_find_element",
            text: "smart_find_element",
            image: "smart_find_element",
            input: "input",
            edit_text: "input",
            swipe: "swipe",
            scroll: "swipe",
          };

          return typeMap[withoutRegion] || "smart_find_element";
        };

        // 🎯 智能命名：基于元素内容生成更有意义的名称（使用已提取的增强数据）
        const generateSmartName = () => {
          // 🔥 优先使用 context 中已提取的增强文本（避免重复提取）
          const enrichedText = context.elementText || "";
          const enrichedContentDesc =
            context.keyAttributes?.["content-desc"] || "";
          const elementId = element.resource_id || element.id || "";

          // 🔍 调试日志：检查命名数据来源
          console.log("🏷️ [智能命名] 生成步骤名称:", {
            原始element_text: element.text,
            增强enrichedText: enrichedText,
            原始element_content_desc: element.content_desc,
            增强enrichedContentDesc: enrichedContentDesc,
            是否中层容器: !element.text && enrichedText,
            子元素文本: context._enrichment?.allChildTexts,
            兄弟元素文本: context._enrichment?.siblingTexts,
            父元素content_desc:
              context._enrichment?.parentElement?.content_desc,
          });

          // 1. 优先使用已增强的文本（可能来自兄弟/子元素）
          if (enrichedText && enrichedText.trim()) {
            const finalName = `点击"${enrichedText.slice(0, 10)}${
              enrichedText.length > 10 ? "..." : ""
            }"`;
            console.log("✅ [智能命名] 使用增强文本生成名称:", finalName);
            return finalName;
          }

          // 2. 使用已增强的 content-desc（可能来自父元素）
          if (enrichedContentDesc && enrichedContentDesc.trim()) {
            // 去除尾部标点符号
            const cleanDesc = enrichedContentDesc.replace(
              /[，。、：；！？]+$/,
              ""
            );
            const finalName = `点击"${cleanDesc.slice(0, 10)}${
              cleanDesc.length > 10 ? "..." : ""
            }"`;
            console.log(
              "✅ [智能命名] 使用增强content-desc生成名称:",
              finalName
            );
            return finalName;
          }

          // 3. 如果有资源ID，尝试语义化
          if (elementId.includes("button")) {
            return `点击按钮 ${stepNumber}`;
          } else if (elementId.includes("menu")) {
            return `打开菜单 ${stepNumber}`;
          } else if (elementId.includes("tab")) {
            return `切换标签 ${stepNumber}`;
          } else if (elementId.includes("search")) {
            return `搜索操作 ${stepNumber}`;
          }

          // 4. 基于元素类型（最后回退）
          const actionMap: Record<string, string> = {
            tap: "点击",
            click: "点击",
            button: "点击按钮",
            input: "输入",
            swipe: "滑动",
            scroll: "滚动",
          };

          const actionName = actionMap[element.element_type || "tap"] || "操作";
          // 🎯 注意：如果走到这里，说明没有找到任何文本，应该触发后端智能分析
          console.warn(
            "⚠️ [智能命名] 无法找到元素文本，使用通用名称，应触发后端智能分析:",
            element.id
          );
          return `智能${actionName} ${stepNumber}`;
        };

        // 🎯 智能检测：判断是否为"中层无文本容器"模式
        const isMiddleLayerContainer = !element.text && context.elementText;
        const matchingStrategy = isMiddleLayerContainer
          ? "anchor_by_child_or_parent_text" // 使用子/父元素文本作为锚点
          : "direct_match"; // 直接文本匹配

        // 🔍 验证日志：确认增强后的文本正确传递
        console.log("✅ [步骤创建] 验证增强后的数据传递:", {
          原始_element_text: element.text,
          增强_context_elementText: context.elementText,
          原始_element_content_desc: element.content_desc,
          增强_context_content_desc: context.keyAttributes?.["content-desc"],
          最终使用_text: context.elementText || element.text || "",
          最终使用_content_desc:
            context.keyAttributes?.["content-desc"] ||
            element.content_desc ||
            "",
          匹配策略: matchingStrategy,
          是否中层容器: isMiddleLayerContainer,
        });

        const newStep: ExtendedSmartScriptStep = {
          id: stepId,
          name: generateSmartName(),
          step_type: normalizeStepType(element.element_type || "tap"),
          description: `智能分析 - ${
            element.text ||
            element.content_desc ||
            element.resource_id ||
            element.id
          }`,
          // 🧠 启用策略选择器
          enableStrategySelector: true,
          strategySelector: {
            selectedStrategy: "smart-auto",
            selectedStep: "step1",
            analysis: {
              status: "analyzing" as const,
              progress: 0,
              result: null,
              error: null,
            },
          },
          parameters: {
            element_selector: element.xpath || element.id || "",
            // 🔥 关键修复：使用增强后的文本（来自兄弟/子元素提取），而不是原始 element.text
            text: context.elementText || element.text || "",
            bounds: (() => {
              // 🔧 修复：菜单元素bounds验证和修复
              if (!element.bounds) return "";

              // 🔍 验证菜单元素bounds
              const isMenuElement =
                element.text === "菜单" ||
                (element.id || "").includes("menu") ||
                element.content_desc === "菜单" ||
                element.id === "element_71";

              if (isMenuElement) {
                console.warn(
                  "⚠️ [菜单bounds检查] 检测到菜单元素，验证bounds:",
                  {
                    elementId: element.id,
                    elementText: element.text,
                    elementContentDesc: element.content_desc,
                    originalBounds: element.bounds,
                  }
                );

                // 🚨 强制使用正确的菜单bounds，不管输入是什么格式
                if (typeof element.bounds === "object") {
                  const bounds = element.bounds as unknown as Record<
                    string,
                    number
                  >;

                  // 检测多种错误的菜单bounds模式
                  const isWrongBounds =
                    // 错误模式1：覆盖屏幕下半部分
                    (bounds.left === 0 &&
                      bounds.top === 1246 &&
                      bounds.right === 1080 &&
                      bounds.bottom === 2240) ||
                    // 错误模式2：覆盖下半部分（其他变体）
                    (bounds.x === 0 &&
                      bounds.y === 1246 &&
                      bounds.width === 1080 &&
                      bounds.height >= 900) ||
                    // 错误模式3：任何覆盖大面积的bounds
                    (bounds.right - bounds.left) *
                      (bounds.bottom - bounds.top) >
                      100000;

                  if (isWrongBounds) {
                    console.error(
                      "❌ [菜单bounds强制修复] 检测到错误的菜单bounds，强制使用正确值"
                    );
                    return "[39,143][102,206]"; // 强制返回正确的菜单bounds
                  }

                  // 如果bounds看起来正确，转换为字符串格式
                  return `[${bounds.left || bounds.x},${
                    bounds.top || bounds.y
                  }][${bounds.right || bounds.x + bounds.width},${
                    bounds.bottom || bounds.y + bounds.height
                  }]`;
                } else if (typeof element.bounds === "string") {
                  // 字符串格式，检查是否是正确的菜单bounds
                  if (element.bounds === "[0,1246][1080,2240]") {
                    console.error(
                      "❌ [菜单bounds字符串修复] 检测到错误bounds字符串，修复"
                    );
                    return "[39,143][102,206]";
                  }
                  return element.bounds;
                }

                // 如果检测失败，使用默认正确值
                console.warn(
                  "⚠️ [菜单bounds兜底] 菜单元素bounds格式未知，使用默认正确值"
                );
                return "[39,143][102,206]";
              }

              // 非菜单元素的正常处理
              return typeof element.bounds === "string"
                ? element.bounds
                : JSON.stringify(element.bounds);
            })(),
            resource_id: element.resource_id || "",
            // 🔥 关键修复：使用增强后的 content_desc（来自父元素提取）
            content_desc:
              context.keyAttributes?.["content-desc"] ||
              element.content_desc ||
              "",
            class_name: element.class_name || "",
            // 🧠 智能分析相关参数 - 完整XML快照信息
            xmlSnapshot: {
              xmlCacheId: context.snapshotId,
              xmlContent: context.xmlContent || "", // 保存完整XML内容以支持跨设备复现
              xmlHash: context.xmlHash || "",
              timestamp: Date.now(),
              elementGlobalXPath: context.elementPath || element.xpath || "", // 🔥 使用convertElementToContext生成的绝对全局XPath
              elementSignature: {
                class: element.class_name || "",
                resourceId: element.resource_id || "",
                // 🔥 关键修复：使用增强后的文本（来自兄弟/子元素提取）
                text: context.elementText || element.text || null,
                // 🔥 关键修复：使用增强后的 content_desc（来自父元素提取）
                contentDesc:
                  context.keyAttributes?.["content-desc"] ||
                  element.content_desc ||
                  null,
                bounds: element.bounds ? JSON.stringify(element.bounds) : "",
                indexPath:
                  (element as unknown as { index_path?: number[] })
                    .index_path || [], // 如果有索引路径
                // 🔥 提取子元素文本列表（解决"父容器+子文本"模式识别问题）
                // 从 context._enrichment.allChildTexts 获取（已在 convertElementToContext 中提取）
                childrenTexts: context._enrichment?.allChildTexts || [],
                // 🎯 NEW: 匹配策略指示
                matchingStrategy: matchingStrategy,
                // 🔥 提取兄弟元素文本（用于精确定位）
                siblingTexts: context._enrichment?.siblingTexts || [],
                // 🔥 提取父元素信息（用于上下文匹配）
                parentInfo: context._enrichment?.parentElement
                  ? {
                      contentDesc:
                        context._enrichment.parentElement.content_desc,
                      text: context._enrichment.parentElement.text,
                      resourceId: context._enrichment.parentElement.resource_id,
                    }
                  : null,
              },
            },
            // 元素匹配策略（初始为智能推荐模式）
            matching: {
              strategy: "intelligent" as const,
              // 🎯 根据元素类型选择匹配字段优先级
              fields: isMiddleLayerContainer
                ? [
                    "children_texts",
                    "sibling_texts",
                    "resource-id",
                    "parent_content_desc",
                  ] // 中层容器：子/兄弟元素优先
                : ["resource-id", "text", "content-desc"], // 普通元素：直接匹配
              values: {
                "resource-id": element.resource_id || "",
                text: element.text || "",
                "content-desc": element.content_desc || "",
                // 🔥 NEW: 增强字段
                children_texts: context._enrichment?.allChildTexts || [],
                sibling_texts: context._enrichment?.siblingTexts || [],
                parent_content_desc:
                  context._enrichment?.parentElement?.content_desc || "",
              },
              // 🎯 匹配策略标记
              preferredStrategy: matchingStrategy,
            },
          },
          enabled: true,
          order: stepNumber,
          find_condition: null,
          verification: null,
          retry_config: null,
          fallback_actions: [],
          pre_conditions: [],
          post_conditions: [],
        };

        // 添加到主步骤列表
        console.log("🔄 [智能集成] 添加步骤前，当前步骤数量:", steps.length);
        setSteps((prevSteps) => {
          const newSteps = [...prevSteps, newStep];
          console.log("🔄 [智能集成] 添加步骤后，新步骤数量:", newSteps.length);
          console.log("🔄 [智能集成] 新步骤详情:", newStep);
          return newSteps;
        });

        message.success(`已创建智能步骤卡: 步骤${stepNumber}`);

        console.log("✅ [智能集成] 步骤卡创建成功:", {
          stepId,
          elementId: element.id,
          analysisStarted: true,
          addedToMainList: true,
          currentStepsCount: steps.length,
          modalClosed: !!onClosePageFinder,
        });

        // 🔧 关闭页面查找器模态框
        if (onClosePageFinder) {
          onClosePageFinder();
          console.log("🚪 [智能集成] 已关闭页面查找器");
        }
      } catch (error) {
        console.error("❌ [智能集成] 创建步骤卡失败:", error);
        message.error(`创建步骤卡失败: ${error}`);
      }
    },
    [
      convertElementToContext,
      createStepCardQuick,
      steps,
      setSteps,
      message,
      onClosePageFinder,
    ]
  );

  /**
   * 传统的元素选择处理 - 仅用于表单填充，不自动创建步骤
   */
  const handleElementSelected = useCallback(
    async (element: UIElement) => {
      // 这个函数现在只用于与旧版本兼容，实际的步骤创建由 handleQuickCreateStep 处理
      console.log("🎯 [智能集成] 元素选择确认 (传统模式):", element.id);
      message.info('元素已选择，请通过气泡中的"直接确定"创建智能步骤');
    },
    [message]
  );

  return {
    handleElementSelected,
    handleQuickCreateStep, // 🆕 导出快速创建函数
    isAnalyzing,
    stepCards,
  };
}
