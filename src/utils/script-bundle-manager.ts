// src/utils/script-bundle-manager.ts
// module: utils | layer: utils | role: 脚本打包管理器
// summary: 支持智能脚本离线分享和备份恢复（包含 XML cache）

import { xmlCacheManager } from '../services/xml-cache-manager';

export interface ScriptExportOptions {
  includeXmlCache?: boolean; // 是否包含 XML 快照（默认 true）
  includeLegacyFields?: boolean; // 是否包含旧版兼容字段（默认 false）
  compress?: boolean; // 是否压缩 JSON（默认 false）
}

export interface ScriptBundle {
  metadata: {
    exportVersion: string;
    exportedAt: number;
    scriptId?: string;
    scriptName?: string;
    generator: string;
  };
  steps: any[]; // 步骤数据（只包含 xmlHash/xmlCacheId 引用）
  xmlCache: Record<string, {
    content: string;
    metadata?: any;
  }>; // xmlHash → xmlContent + metadata 映射
  loopConfigs?: any[]; // 循环配置（如果有）
}

/**
 * 导出完整脚本包（包含所有依赖的 XML 快照）
 * @param steps 步骤列表
 * @param scriptMetadata 脚本元数据
 * @param options 导出选项
 * @returns JSON 字符串（可直接保存为 .json 文件）
 */
export async function exportScriptBundle(
  steps: any[],
  scriptMetadata?: { id?: string; name?: string },
  options: ScriptExportOptions = {}
): Promise<string> {
  const {
    includeXmlCache = true,
    includeLegacyFields = false,
    compress = false,
  } = options;

  // 1. 收集所有引用的 xmlHash/xmlCacheId
  const xmlHashSet = new Set<string>();

  steps.forEach((step) => {
    const selector = step.parameters?.element_selector;
    if (!selector) return;

    // 收集 xmlHash
    if (selector.xmlHash) {
      xmlHashSet.add(selector.xmlHash);
    }

    // 收集 xmlCacheId（如果存在）
    if (selector.xmlCacheId) {
      xmlHashSet.add(selector.xmlCacheId);
    }

    // 收集 xmlSnapshot.xmlHash（如果存在）
    if (selector.xmlSnapshot?.xmlHash) {
      xmlHashSet.add(selector.xmlSnapshot.xmlHash);
    }

    // 处理旧版 xmlCacheId
    if (step.parameters?.xmlCacheId) {
      xmlHashSet.add(step.parameters.xmlCacheId);
    }
  });

  // 2. 构建 xmlCache 映射
  const xmlCache: Record<string, { content: string; metadata?: any }> = {};

  if (includeXmlCache) {
    for (const hash of xmlHashSet) {
      // 🔥 修复：使用 getCachedXml() 而不是 getXml()
      const cacheEntry = await xmlCacheManager.getCachedXml(hash);
      if (cacheEntry) {
        xmlCache[hash] = {
          content: cacheEntry.xmlContent,  // 🔥 字段名是 xmlContent
          metadata: cacheEntry.metadata,
        };
      } else {
        console.warn(`⚠️ XML cache not found for hash: ${hash}`);
      }
    }
  }

  // 3. 清理步骤数据（移除 xmlContent 等废弃字段）
  const cleanedSteps = steps.map((step) => {
    const cleanedStep = { ...step };

    if (!includeLegacyFields) {
      // 移除废弃字段
      if (cleanedStep.parameters) {
        delete cleanedStep.parameters.xmlContent;
        delete cleanedStep.parameters.xmlTimestamp;
        // xmlCacheId 保留（作为引用）
      }
    }

    return cleanedStep;
  });

  // 4. 构建 bundle
  const bundle: ScriptBundle = {
    metadata: {
      exportVersion: '2.0.0',
      exportedAt: Date.now(),
      scriptId: scriptMetadata?.id,
      scriptName: scriptMetadata?.name,
      generator: 'Script Bundle Manager v2.0',
    },
    steps: cleanedSteps,
    xmlCache,
  };

  // 5. 序列化
  const jsonStr = compress
    ? JSON.stringify(bundle)
    : JSON.stringify(bundle, null, 2);

  console.log(`✅ Exported script bundle: ${cleanedSteps.length} steps, ${Object.keys(xmlCache).length} XML snapshots`);

  return jsonStr;
}

/**
 * 导入脚本包（恢复步骤 + XML cache）
 * @param bundleJson JSON 字符串
 * @returns 导入的步骤列表
 */
export async function importScriptBundle(
  bundleJson: string
): Promise<{
  steps: any[];
  metadata: ScriptBundle['metadata'];
  importedCacheCount: number;
}> {
  // 1. 解析 bundle
  const bundle: ScriptBundle = JSON.parse(bundleJson);

  // 2. 验证版本
  if (!bundle.metadata?.exportVersion) {
    throw new Error('Invalid bundle format: missing metadata.exportVersion');
  }

  const majorVersion = parseInt(bundle.metadata.exportVersion.split('.')[0], 10);
  if (majorVersion > 2) {
    console.warn(`⚠️ Bundle version ${bundle.metadata.exportVersion} may be incompatible (expected <=2.x.x)`);
  }

  // 3. 恢复 XML cache
  let importedCacheCount = 0;
  if (bundle.xmlCache) {
    for (const [hash, entry] of Object.entries(bundle.xmlCache)) {
      // 🔥 修复：使用 getCachedXml() 检查是否存在
      const existing = await xmlCacheManager.getCachedXml(hash);
      if (!existing) {
        // 🔥 修复：putXml(id, xmlContent, xmlHash)
        xmlCacheManager.putXml(
          hash,           // id
          entry.content,  // xmlContent
          hash            // xmlHash
        );
        importedCacheCount++;
      } else {
        console.log(`⏭️ Skipped existing XML cache: ${hash}`);
      }
    }
  }

  // 4. 返回步骤数据
  console.log(`✅ Imported script bundle: ${bundle.steps.length} steps, ${importedCacheCount} new XML snapshots`);

  return {
    steps: bundle.steps,
    metadata: bundle.metadata,
    importedCacheCount,
  };
}

/**
 * 下载 bundle 到本地文件（浏览器环境）
 * @param bundleJson JSON 字符串
 * @param filename 文件名（默认带时间戳）
 */
export function downloadBundleAsFile(
  bundleJson: string,
  filename?: string
): void {
  const defaultFilename = `script-bundle-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const blob = new Blob([bundleJson], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename || defaultFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log(`📦 Downloaded bundle as: ${a.download}`);
}

/**
 * 从文件选择器读取 bundle（浏览器环境）
 * @returns Promise<JSON 字符串>
 */
export function loadBundleFromFile(): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      try {
        const text = await file.text();
        resolve(text);
        console.log(`📦 Loaded bundle from file: ${file.name}`);
      } catch (error) {
        reject(error);
      }
    };

    input.click();
  });
}
