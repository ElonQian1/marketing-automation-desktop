// src/modules/contact-import/ui/hooks/useWorkbenchActions.ts
// module: contact-import | layer: ui | role: module-component
// summary: 模块组件

﻿/**
 * 联系人导入工作台事件处理Hook  
 * Employee D架构 - 单一职责：业务事件处理逻辑
 * 
 * 职责：
 * - 文件/文件夹导入处理
 * - VCF生成和设备导入
 * - 批次操作管理
 * - 模态框状态管理
 */

import { useState, useCallback } from 'react';
import { useMessage } from '@/components/adapters';
import { selectFolder, selectTxtFile } from '../utils/dialog';
import { 
  importNumbersFromFolder, 
  importNumbersFromFolders, 
  importNumbersFromTxtFile, 
  ContactNumberDto,
} from '../services/contactNumberService';
import { VcfActions } from '../services/vcfActions';
import { VcfImportService } from '../../../../services/VcfImportService';
import { buildVcfFromNumbers } from '../../utils/vcf';
import { fetchUnclassifiedNumbers } from '../services/unclassifiedService';
import { registerGeneratedBatch } from '../services/vcfBatchRegistrationService';
import { executeBatches } from '../services/batchExecutor';
import ServiceFactory from '../../../../application/services/ServiceFactory';
import type { BatchExecuteResult } from '../services/batchExecutor';

export interface UseWorkbenchActionsProps {
  onDataRefresh: () => Promise<void>;
  assignment: Record<string, { industry?: string; idStart?: number; idEnd?: number }>;
  onlyUnconsumed: boolean;
  hasItems: boolean;
}

export interface UseWorkbenchActionsReturn {
  // 模态框状态
  previewOpen: boolean;
  setPreviewOpen: (open: boolean) => void;
  previewBatches: Array<{ deviceId: string; industry?: string; numbers: ContactNumberDto[] }>;
  resultOpen: boolean;
  setResultOpen: (open: boolean) => void;
  lastResult: BatchExecuteResult | null;
  batchDrawerOpen: boolean;
  setBatchDrawerOpen: (open: boolean) => void;
  sessionsModal: { open: boolean; deviceId?: string; status?: 'all' | 'pending' | 'success' | 'failed' };
  setSessionsModal: (modal: { open: boolean; deviceId?: string; status?: 'all' | 'pending' | 'success' | 'failed' }) => void;
  currentJumpId: string | null;
  
  // 事件处理方法
  handleImportTxt: () => Promise<void>;
  handleImportFolder: () => Promise<void>;
  handleImportFromSavedFolders: () => Promise<void>;
  handleTopLevelImportHint: () => void;
  handleGenerateVcfForDevice: (deviceId: string, params: { start?: number; end?: number; industry?: string }) => Promise<void>;
  handleImportToDeviceFromCard: (deviceId: string, params: { start?: number; end?: number; industry?: string; scriptKey?: string }) => Promise<void>;
  handleJumpToDevice: (deviceId: string) => void;
  handleGenerateBatches: () => Promise<void>;
  handleExecuteFromPreview: (selectedDeviceIds: string[], options: { markConsumed: boolean }) => Promise<void>;
}

export const useWorkbenchActions = ({
  onDataRefresh,
  assignment,
  onlyUnconsumed,
  hasItems
}: UseWorkbenchActionsProps): UseWorkbenchActionsReturn => {
  
  // 使用上下文化的 message API（支持动态主题）
  const message = useMessage();
  
  // 模态框状态
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewBatches, setPreviewBatches] = useState<Array<{ deviceId: string; industry?: string; numbers: ContactNumberDto[] }>>([]);
  const [resultOpen, setResultOpen] = useState(false);
  const [lastResult, setLastResult] = useState<null | BatchExecuteResult>(null);
  const [batchDrawerOpen, setBatchDrawerOpen] = useState(false);
  const [sessionsModal, setSessionsModal] = useState<{ open: boolean; deviceId?: string; status?: 'all' | 'pending' | 'success' | 'failed' }>({ open: false });
  const [currentJumpId, setCurrentJumpId] = useState<string | null>(null);

  // 导入TXT文件
  const handleImportTxt = async () => {
    try {
      const filePath = await selectTxtFile();
      if (filePath) {
        const result = await importNumbersFromTxtFile(filePath);
        
        // 根据实际结果给出不同提示
        if (result.inserted === 0 && result.duplicates === 0) {
          if (result.total_numbers === 0) {
            message.warning('文件中未找到有效的手机号码');
          } else {
            message.warning(`文件中有 ${result.total_numbers} 个号码，但全部是重复号码`);
          }
        } else if (result.inserted === 0) {
          message.info(`文件中有 ${result.total_numbers} 个号码，但全部已存在（去重 ${result.duplicates} 个）`);
        } else {
          message.success(`成功导入 ${result.inserted} 个号码（去重 ${result.duplicates} 个）`);
        }
        
        await onDataRefresh();
      }
    } catch (error) {
      console.error('导入TXT文件失败:', error);
      message.error(`导入失败: ${error}`);
    }
  };

  // 导入文件夹
  const handleImportFolder = async () => {
    try {
      const folderPath = await selectFolder();
      if (folderPath) {
        const result = await importNumbersFromFolder(folderPath);
        
        // 根据实际结果给出不同提示
        if (result.inserted === 0 && result.duplicates === 0) {
          if (result.total_numbers === 0) {
            message.warning('文件夹中未找到有效的手机号码');
          } else {
            message.warning(`文件夹中有 ${result.total_numbers} 个号码，但全部是重复号码`);
          }
        } else if (result.inserted === 0) {
          message.info(`文件夹中有 ${result.total_numbers} 个号码，但全部已存在（去重 ${result.duplicates} 个）`);
        } else {
          message.success(`成功从 ${result.total_files} 个文件导入 ${result.inserted} 个号码（去重 ${result.duplicates} 个）`);
        }
        
        await onDataRefresh();
      }
    } catch (error) {
      console.error('导入文件夹失败:', error);
      message.error(`导入失败: ${error}`);
    }
  };

  // 从保存的文件夹导入
  const handleImportFromSavedFolders = async () => {
    if (!hasItems) {
      message.warning('没有保存的文件夹');
      return;
    }
    
    try {
      const folders = JSON.parse(localStorage.getItem('sourceFolders') || '[]');
      if (folders.length === 0) {
        message.warning('没有保存的文件夹');
        return;
      }
      
      const result = await importNumbersFromFolders(folders);
      
      // 根据实际结果给出不同提示
      if (result.inserted === 0 && result.duplicates === 0) {
        if (result.total_numbers === 0) {
          message.warning(`已扫描 ${folders.length} 个文件夹，未找到有效的手机号码`);
        } else {
          message.warning(`已扫描 ${folders.length} 个文件夹，有 ${result.total_numbers} 个号码但全部是重复号码`);
        }
      } else if (result.inserted === 0) {
        message.info(`已扫描 ${folders.length} 个文件夹，有 ${result.total_numbers} 个号码但全部已存在（去重 ${result.duplicates} 个）`);
      } else {
        message.success(`成功从 ${folders.length} 个文件夹的 ${result.total_files} 个文件导入 ${result.inserted} 个号码（去重 ${result.duplicates} 个）`);
      }
      
      await onDataRefresh();
    } catch (error) {
      console.error('批量导入失败:', error);
      message.error(`批量导入失败: ${error}`);
    }
  };

  // 顶级导入提示
  const handleTopLevelImportHint = () => {
    message.info('请先在下方分配设备和ID范围，然后点击"生成批次"预览，最后执行导入');
  };

  // 为设备生成VCF
  const handleGenerateVcfForDevice = useCallback(async (deviceId: string, params: { start?: number; end?: number; industry?: string }) => {
    try {
      const { start, end, industry } = params;
      
      if (start !== undefined && end !== undefined && start > end) {
        message.error('起始ID不能大于结束ID');
        return;
      }

  const count = end && start ? end - start + 1 : 100; // 默认100个
  const numbers = await fetchUnclassifiedNumbers(count, onlyUnconsumed);

      if (numbers.length === 0) {
        message.warning('没有可用的号码');
        return;
      }

      // 写入临时 VCF 文件并导入
      const vcfContent = buildVcfFromNumbers(numbers);
      const tempPath = VcfImportService.generateTempVcfPath();
      await VcfImportService.writeVcfFile(tempPath, vcfContent);
      const outcome = await VcfActions.importVcfToDevice(tempPath, deviceId);
      
      if (outcome.success) {
        const batchId = `batch_${Date.now()}`;
        await registerGeneratedBatch({
          deviceId,
          batchId,
          vcfFilePath: tempPath,
          numberIds: numbers.map(n => n.id),
        });
  message.success('成功生成VCF文件到设备 ' + deviceId);
        await onDataRefresh();
      } else {
        message.error('VCF导入失败: ' + (outcome.message || '未知错误'));
      }
    } catch (error) {
      console.error('生成VCF失败:', error);
      message.error('生成VCF失败');
    }
  }, [onlyUnconsumed, onDataRefresh]);

  // 导入到设备
  const handleImportToDeviceFromCard = useCallback(async (deviceId: string, params: { start?: number; end?: number; industry?: string; scriptKey?: string }) => {
    try {
      const { start, end, industry, scriptKey } = params;
      
      if (start !== undefined && end !== undefined && start > end) {
        message.error('起始ID不能大于结束ID');
        return;
      }

  const count2 = end && start ? end - start + 1 : 100; // 默认100个
  const numbers = await fetchUnclassifiedNumbers(count2, onlyUnconsumed);

      if (numbers.length === 0) {
        message.warning('没有可用的号码');
        return;
      }

      // 写临时文件并导入
      const vcfContent = buildVcfFromNumbers(numbers);
      const tempPath = VcfImportService.generateTempVcfPath();
      await VcfImportService.writeVcfFile(tempPath, vcfContent);
      const result = await VcfImportService.importVcfFile(tempPath, deviceId);
      
      if (result.success) {
        message.success('成功导入 ' + numbers.length + ' 个联系人到设备 ' + deviceId);
        await onDataRefresh();
      } else {
        message.error('导入失败: ' + (result.message || '未知错误'));
      }
    } catch (error) {
      console.error('导入到设备失败:', error);
      message.error('导入到设备失败');
    }
  }, [onlyUnconsumed, onDataRefresh]);

  // 跳转到设备
  const handleJumpToDevice = useCallback((deviceId: string) => {
    setCurrentJumpId(deviceId);
    setTimeout(() => {
      setCurrentJumpId(null);
    }, 2000);
  }, []);

  // 生成批次
  const handleGenerateBatches = async () => {
    const validAssignments = Object.entries(assignment).filter(([_, config]) => 
      config.idStart && config.idEnd && config.idStart <= config.idEnd
    );

    if (validAssignments.length === 0) {
      message.warning('请至少为一台设备设置有效的ID范围');
      return;
    }

    try {
      const batches = [];
      
      for (const [deviceId, config] of validAssignments) {
        const { idStart, idEnd, industry } = config;
        const count3 = idEnd! - idStart! + 1;
        const numbers = await fetchUnclassifiedNumbers(count3, onlyUnconsumed);
        
        if (numbers.length > 0) {
          batches.push({ deviceId, industry, numbers });
        }
      }

      setPreviewBatches(batches);
      setPreviewOpen(true);
    } catch (error) {
      console.error('生成批次失败:', error);
      message.error('生成批次失败');
    }
  };

  // 从预览执行
  const handleExecuteFromPreview = async (selectedDeviceIds: string[], options: { markConsumed: boolean }) => {
    try {
      const selectedBatches = previewBatches.filter(batch => 
        selectedDeviceIds.includes(batch.deviceId)
      );

      const result = await executeBatches(selectedBatches, {
        ...options,
        markConsumed: options.markConsumed ? async (_batchId: string) => { /* TODO: implement consumption mark if needed */ } : undefined,
      });
      
      setLastResult(result);
      setResultOpen(true);
      setPreviewOpen(false);
      await onDataRefresh();
    } catch (error) {
      console.error('批次执行失败:', error);
      message.error('批次执行失败');
    }
  };

  return {
    // 模态框状态
    previewOpen,
    setPreviewOpen,
    previewBatches,
    resultOpen,
    setResultOpen,
    lastResult,
    batchDrawerOpen,
    setBatchDrawerOpen,
    sessionsModal,
    setSessionsModal,
    currentJumpId,
    
    // 事件处理方法
    handleImportTxt,
    handleImportFolder,
    handleImportFromSavedFolders,
    handleTopLevelImportHint,
    handleGenerateVcfForDevice,
    handleImportToDeviceFromCard,
    handleJumpToDevice,
    handleGenerateBatches,
    handleExecuteFromPreview,
  };
};