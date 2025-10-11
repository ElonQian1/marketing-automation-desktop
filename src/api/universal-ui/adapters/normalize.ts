// src/api/universal-ui/adapters/normalize.ts
// module: api | layer: api | role: universal-ui-adapter
// summary: Universal UI适配器，标准化不同平台的UI元素

import type { UniversalPageCaptureResult, UniversalPageCaptureResultBackend } from '../types';

export function normalizeUniversalPageCaptureResult(result: UniversalPageCaptureResultBackend): UniversalPageCaptureResult {
  return {
    xmlContent: result.xml_content,
    xmlFileName: result.xml_file_name,
    xmlRelativePath: result.xml_relative_path,
    xmlAbsolutePath: result.xml_absolute_path,
    screenshotFileName: result.screenshot_file_name ?? undefined,
    screenshotRelativePath: result.screenshot_relative_path ?? undefined,
    screenshotAbsolutePath: result.screenshot_absolute_path ?? undefined,
  };
}
