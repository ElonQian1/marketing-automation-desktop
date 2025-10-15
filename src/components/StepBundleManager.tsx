// src/components/StepBundleManager.tsx
// module: ui | layer: ui | role: 步骤包管理器
// summary: 步骤包导出和导入功能的UI组件

import React, { useState } from 'react';
import { Button, message, Upload } from 'antd';
import { UploadIcon, DownloadIcon } from 'lucide-react';
import { buildStepBundle, packStepBundle, unpackStepBundle, convertBundleToSteps } from '../lib/step-bundle';
import type { ExtendedSmartScriptStep } from '../types/loopScript';

interface StepBundleManagerProps {
  steps: ExtendedSmartScriptStep[];
  onImportSteps: (steps: ExtendedSmartScriptStep[]) => void;
  deviceInfo?: {
    brand?: string;
    model?: string;
    dpi?: number;
    size?: string;
    sdk?: number;
  };
}

const StepBundleManager: React.FC<StepBundleManagerProps> = ({
  steps,
  onImportSteps,
  deviceInfo
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // 导出步骤包
  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // 构建步骤包
      const { manifest, xmlMap } = await buildStepBundle(
        steps.filter(s => s.enableStrategySelector), // 只导出启用策略选择器的步骤
        `bundle_${Date.now()}`,
        deviceInfo
      );
      
      if (manifest.steps.length === 0) {
        message.warning('没有可导出的智能步骤');
        return;
      }
      
      // 打包为ZIP
      const bundleData = await packStepBundle(manifest, xmlMap);
      
      // 下载文件
      const blob = new Blob([bundleData], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${manifest.bundleId}.stepbundle`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      message.success(`成功导出 ${manifest.steps.length} 个步骤`);
      
    } catch (error) {
      console.error('导出步骤包失败:', error);
      message.error(`导出失败: ${error}`);
    } finally {
      setIsExporting(false);
    }
  };

  // 导入步骤包
  const handleImport = async (file: File) => {
    try {
      setIsImporting(true);
      
      // 读取文件
      const arrayBuffer = await file.arrayBuffer();
      const bundleData = new Uint8Array(arrayBuffer);
      
      // 解压步骤包
      const { manifest, xmlMap } = await unpackStepBundle(bundleData);
      
      // 转换为步骤列表
      const importedSteps = convertBundleToSteps(manifest, xmlMap);
      
      // 验证步骤包
      if (importedSteps.length === 0) {
        message.warning('步骤包中没有有效的步骤');
        return false;
      }
      
      // 导入步骤
      onImportSteps(importedSteps);
      
      message.success(`成功导入 ${importedSteps.length} 个步骤`);
      
      return false; // 阻止默认上传行为
      
    } catch (error) {
      console.error('导入步骤包失败:', error);
      message.error(`导入失败: ${error}`);
      return false;
    } finally {
      setIsImporting(false);
    }
  };

  const exportableStepsCount = steps.filter(s => s.enableStrategySelector).length;

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      {/* 导出按钮 */}
      <Button
        type="default"
        icon={<DownloadIcon size={14} />}
        onClick={handleExport}
        loading={isExporting}
        disabled={exportableStepsCount === 0}
        size="small"
        title={exportableStepsCount > 0 
          ? `导出 ${exportableStepsCount} 个智能步骤为步骤包` 
          : '没有可导出的智能步骤'
        }
      >
        导出步骤包
        {exportableStepsCount > 0 && (
          <span style={{ 
            marginLeft: '4px', 
            padding: '0 4px', 
            background: 'rgba(59, 130, 246, 0.1)',
            color: '#3B82F6',
            borderRadius: '8px',
            fontSize: '10px'
          }}>
            {exportableStepsCount}
          </span>
        )}
      </Button>

      {/* 导入按钮 */}
      <Upload
        accept=".stepbundle,.zip,.json"
        beforeUpload={handleImport}
        showUploadList={false}
        multiple={false}
      >
        <Button
          type="default"
          icon={<UploadIcon size={14} />}
          loading={isImporting}
          size="small"
          title="从步骤包文件导入智能步骤"
        >
          导入步骤包
        </Button>
      </Upload>
    </div>
  );
};

export default StepBundleManager;