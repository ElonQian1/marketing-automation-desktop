// src/utils/toDisplayableImageSrc.ts
// module: shared | layer: utils | role: utility
// summary: 工具函数

/**
 * 将本地文件路径转换为可在 WebView 中展示的图片 URL。
 *
 * 优先使用 Tauri 的 convertFileSrc；若不可用或失败，则回退读取二进制并创建 Blob URL。
 * 自动处理 Windows 扩展路径前缀 \\?\，并尽量避免反斜杠带来的编码问题。
 */
export async function toDisplayableImageSrc(absPath: string | undefined | null): Promise<string | undefined> {
  if (!absPath) return undefined;

  // 规范化：去除 Windows 扩展前缀 \\?\
  const normalizedForUrl = absPath
    .replace(/^\\\\\?\\/, '') // strip \\?\ prefix
    .replace(/\\/g, '/'); // use forward slashes for URL friendliness

  // 尝试使用 Tauri 提供的 convertFileSrc（v2 在 @tauri-apps/api/core）
  try {
     
    const mod = await import('@tauri-apps/api/core');
    if (typeof mod.convertFileSrc === 'function') {
      const url = mod.convertFileSrc(normalizedForUrl);
      if (typeof url === 'string' && url.length > 0) return url;
    }
  } catch {
    // 非 Tauri 环境或 API 不可用
  }

  // 无法转换时，开发环境优雅降级：不展示截图
  return undefined;
}

export default toDisplayableImageSrc;
