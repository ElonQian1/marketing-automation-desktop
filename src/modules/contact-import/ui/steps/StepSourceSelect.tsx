// src/modules/contact-import/ui/steps/StepSourceSelect.tsx
// module: contact-import | layer: ui | role: module-component
// summary: 模块组件

﻿// modules/contact-import/ui/steps | StepSourceSelect | 联系人数据源选择步骤组件
// 提供联系人导入的数据源选择界面，支持文件夹批量导入和单文件导入两种模式

import React, { useState } from 'react';
import { Button, Card, Descriptions, Space, Typography, Alert, Divider, message, Modal } from 'antd';
import { FileTextOutlined, DatabaseOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { selectTxtFile } from '../utils/dialog';
import { importNumbersFromFolder, importNumbersFromFolders, importNumbersFromTxtFile, ImportNumbersResult, checkFileImported, getFileStats } from '../services/contactNumberService';
import { useSourceFolders } from '../hooks/useSourceFolders';
import { SourceFolderAddButton } from '../components/SourceFolderAddButton';
import { SourceFoldersList } from '../components/SourceFoldersList';

const { Text, Paragraph } = Typography;

interface StepSourceSelectProps {
  onCompleted?: (result: ImportNumbersResult) => void;
}

export const StepSourceSelect: React.FC<StepSourceSelectProps> = ({ onCompleted }) => {
  const [selectedPath, setSelectedPath] = useState<string | null>(null); // 单次选择的TXT或临时文件夹
  const [isFolder, setIsFolder] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<ImportNumbersResult | null>(null);
  // 持久化的文件夹集合
  const { folders, addFolder, removeFolder, clearAll, hasItems } = useSourceFolders();

  const handleChooseFile = async () => {
    const file = await selectTxtFile();
    if (file) {
      setSelectedPath(file);
      setIsFolder(false);
    }
  };

  // 文件夹选择已通过独立的 SourceFolderAddButton 处理

  // 从当前选择的文件/文件夹导入
  const handleImportCurrent = async () => {
    if (!selectedPath) {
      message.warning('请先选择TXT文件或文件夹');
      return;
    }

    // 文件去重检查
    if (!isFolder) {
      try {
        const isImported = await checkFileImported(selectedPath);
        if (isImported) {
          const stats = await getFileStats(selectedPath);
          
          // 弹出确认对话框
          Modal.confirm({
            title: '文件已导入',
            icon: <ExclamationCircleOutlined />,
            content: (
              <div>
                <p>该文件已经导入过号码池：</p>
                <ul>
                  <li>文件：{stats?.file_name || selectedPath}</li>
                  <li>总号码：{stats?.total_count || 0} 条</li>
                  <li>可用：{stats?.available_count || 0} 条</li>
                  <li>已导入：{stats?.imported_count || 0} 条</li>
                  {stats?.first_import_at && <li>首次导入：{new Date(stats.first_import_at).toLocaleString()}</li>}
                </ul>
                <p style={{ marginTop: 16, color: '#ff4d4f' }}>
                  <strong>重新导入会产生重复数据！</strong>
                </p>
                <p>是否仍要继续导入？</p>
              </div>
            ),
            okText: '继续导入',
            okType: 'danger',
            cancelText: '取消',
            onOk: () => executeImport(),
          });
          return;
        }
      } catch (error) {
        console.error('检查文件导入状态失败:', error);
        // 检查失败时继续导入流程
      }
    }

    // 直接执行导入
    await executeImport();
  };

  // 执行实际的导入操作
  const executeImport = async () => {
    setLoading(true);
    try {
      let result: ImportNumbersResult;
      if (!isFolder) {
        result = await importNumbersFromTxtFile(selectedPath!);
      } else {
        result = await importNumbersFromFolder(selectedPath!);
      }
      setLastResult(result);
      if (result.success) {
        message.success(`已写入 ${result.inserted} 条号码，重复 ${result.duplicates} 条`);
      } else {
        message.error('导入过程中出现错误');
      }
      onCompleted?.(result);
    } catch (e) {
      console.error(e);
      message.error(`导入失败: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  // 从已保存的目录列表批量导入
  const handleImportFromSavedFolders = async () => {
    if (!hasItems) {
      message.warning('请先添加至少一个文件夹路径');
      return;
    }
    setLoading(true);
    try {
      const result = await importNumbersFromFolders(folders);
      setLastResult(result);
      if (result.success) {
        message.success(`从 ${result.total_files} 个文件中写入 ${result.inserted} 条号码，重复 ${result.duplicates} 条`);
      } else {
        message.error('导入过程中出现错误');
      }
      onCompleted?.(result);
    } catch (e) {
      console.error(e);
      message.error(`导入失败: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="步骤0：导入文件到号码池">
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Alert
          type="info"
          message="说明"
          description={
            <div>
              <Paragraph style={{ marginBottom: 0 }}>
                请选择TXT文件或包含多个TXT文件的文件夹，系统会自动提取其中的手机号码并导入到本地号码池。导入时将保留每个文件的文件名和导入时间。
              </Paragraph>
            </div>
          }
          showIcon
        />

        <Space wrap>
          <Button icon={<FileTextOutlined />} onClick={handleChooseFile}>
            选择TXT文件
          </Button>
          <SourceFolderAddButton onAdded={addFolder} />
          <Button 
            type="default" 
            icon={<DatabaseOutlined />} 
            loading={loading && hasItems} 
            disabled={!hasItems}
            onClick={handleImportFromSavedFolders}
          >
            从已保存目录导入
          </Button>
          <Button 
            type="primary" 
            icon={<DatabaseOutlined />} 
            loading={loading && !!selectedPath} 
            disabled={!selectedPath}
            onClick={handleImportCurrent}
          >
            导入到号码池
          </Button>
        </Space>

        {selectedPath && !isFolder && (
          <Descriptions bordered size="small" column={1} style={{ marginTop: 8 }}>
            <Descriptions.Item label={'已选文件'}>
              <Text code>{selectedPath}</Text>
            </Descriptions.Item>
          </Descriptions>
        )}

        {/* 展示已添加的“文件夹路径列表”，支持删除与清空 */}
        <SourceFoldersList folders={folders} onRemove={removeFolder} onClearAll={clearAll} />

        {lastResult && (
          <>
            <Divider />
            <Card size="small" title="导入结果">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="文件数">{lastResult.total_files}</Descriptions.Item>
                <Descriptions.Item label="提取号码">{lastResult.total_numbers}</Descriptions.Item>
                <Descriptions.Item label="成功写入">{lastResult.inserted}</Descriptions.Item>
                <Descriptions.Item label="重复跳过">{lastResult.duplicates}</Descriptions.Item>
              </Descriptions>
              {lastResult.errors && lastResult.errors.length > 0 && (
                <Alert type="warning" showIcon message={`发生 ${lastResult.errors.length} 个错误`} />
              )}
            </Card>
          </>
        )}
      </Space>
    </Card>
  );
};

export default StepSourceSelect;
