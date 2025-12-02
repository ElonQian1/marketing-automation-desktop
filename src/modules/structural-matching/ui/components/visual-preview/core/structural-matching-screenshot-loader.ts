// src/modules/structural-matching/ui/components/visual-preview/core/structural-matching-screenshot-loader.ts
// module: structural-matching | layer: ui | role: 截图加载核心逻辑
// summary: 负责截图文件的路径推断、绝对路径获取和缓存加载

import { invoke } from "@tauri-apps/api/core";
import imageCache from "../../../../../../components/xml-cache/utils/imageCache";
import type { StepCardData } from "../types";

export interface StructuralMatchingScreenshotOptions {
  xmlCacheId?: string;
  xmlSnapshot?: {
    screenshotAbsolutePath?: string;
  };
}

/**
 * 截图加载器类
 */
export class StructuralMatchingScreenshotLoader {
  /**
   * 从XML缓存ID推断截图文件名
   */
  private static inferScreenshotPath(xmlCacheId: string): string {
    // ui_dump_e0d909c3_20251030_122312.xml -> ui_dump_e0d909c3_20251030_122312.png
    return xmlCacheId.replace(".xml", ".png");
  }

  /**
   * 获取截图的绝对路径
   */
  private static async getScreenshotAbsolutePath(filename: string): Promise<string> {
    try {
      const absolutePath = await invoke<string>(
        "plugin:xml_cache|get_xml_file_absolute_path",
        {
          fileName: filename,
        }
      );
      console.log("✅ [StructuralMatching] 获取截图绝对路径:", absolutePath);
      return absolutePath;
    } catch (error) {
      console.error("❌ [StructuralMatching] 获取截图绝对路径失败:", error);
      throw error;
    }
  }

  /**
   * 加载截图数据URL
   */
  public static async loadScreenshot(options: StructuralMatchingScreenshotOptions): Promise<string> {
    console.log("🔍 [StructuralMatching] 开始加载截图");

    let screenshotAbsolutePath: string;

    // 优先使用步骤卡片中提供的绝对路径
    if (options.xmlSnapshot?.screenshotAbsolutePath) {
      screenshotAbsolutePath = options.xmlSnapshot.screenshotAbsolutePath;
      console.log(
        "✅ [StructuralMatching] 使用步骤卡片提供的截图绝对路径:",
        screenshotAbsolutePath
      );
    } else if (options.xmlCacheId) {
      // 回退：从XML缓存ID推断截图路径
      const screenshotFilename = this.inferScreenshotPath(options.xmlCacheId);
      screenshotAbsolutePath = await this.getScreenshotAbsolutePath(screenshotFilename);
      console.log(
        "✅ [StructuralMatching] 从XML缓存ID推断截图路径:",
        screenshotAbsolutePath
      );
    } else {
      throw new Error("缺少截图路径信息：需要提供xmlCacheId或screenshotAbsolutePath");
    }

    // 使用缓存加载截图数据URL
    const dataUrl = await imageCache.loadDataUrlWithCache(screenshotAbsolutePath);
    console.log("✅ [StructuralMatching] 截图加载成功");
    
    return dataUrl;
  }

  /**
   * 从步骤卡片数据加载截图
   */
  public static async loadScreenshotFromStepCard(stepCardData: StepCardData): Promise<string> {
    if (!stepCardData.xmlCacheId && !stepCardData.xmlSnapshot?.screenshotAbsolutePath) {
      throw new Error("步骤卡片数据中缺少截图路径信息");
    }

    return this.loadScreenshot({
      xmlCacheId: stepCardData.xmlCacheId,
      xmlSnapshot: stepCardData.xmlSnapshot,
    });
  }

  /**
   * 预加载截图（用于性能优化）
   */
  public static async preloadScreenshot(options: StructuralMatchingScreenshotOptions): Promise<void> {
    try {
      await this.loadScreenshot(options);
      console.log("✅ [StructuralMatching] 截图预加载完成");
    } catch (error) {
      console.warn("⚠️ [StructuralMatching] 截图预加载失败:", error);
    }
  }

  /**
   * 清除截图缓存
   */
  public static clearScreenshotCache(): void {
    imageCache.clearImageCache();
    console.log("🗑️ [StructuralMatching] 截图缓存已清除");
  }
}