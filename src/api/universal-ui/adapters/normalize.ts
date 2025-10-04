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
