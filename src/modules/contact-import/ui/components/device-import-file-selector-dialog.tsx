// src/modules/contact-import/ui/components/device-import-file-selector-dialog.tsx
// module: contact-import | layer: ui | role: 设备导入文件选择对话框
// summary: 集成文件选择、设备选择，实现基于文件的设备导入功能

import React, { useState, useMemo } from 'react';
import { Modal, Select, Space, Typography, Alert, Divider, Button, message, Spin } from 'antd';
import { MobileOutlined, FileTextOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAdb } from '../../../../application/hooks/useAdb';
import { ContactFileSelector } from './file-selector';
import { getNumbersByFiles } from '../services/contactNumberService';
import { buildVcfFromNumbers } from '../../utils/vcf';
import { ContactVcfImportService } from '../../../../services/contact-vcf-import-service';
import { DeviceSpecificImportDialog } from './DeviceAssignmentGrid/components';

const { Text, Title } = Typography;
const { Option } = Select;

export interface DeviceImportFileSelectorProps {
  /** 是否显示对话框 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 导入成功回调 */
  onImportSuccess?: (result: { deviceId: string; totalCount: number; successCount: number; failCount: number }) => void;
  /** 默认选中的文件路径列表 */
  defaultSelectedFiles?: string[];
  /** 是否包含已导入的号码（重新导入模式） */
  includeImported?: boolean;
}

/**
 * 设备导入文件选择对话框
 * 
 * 功能：
 * 1. 选择目标设备
 * 2. 选择要导入的文件（从已导入的文件中选择）
 * 3. 显示将要导入的联系人总数
 * 4. 执行导入操作
 */
export const DeviceImportFileSelectorDialog: React.FC<DeviceImportFileSelectorProps> = ({
  open,
  onClose,
  onImportSuccess,
  defaultSelectedFiles = [],
  includeImported = false,
}) => {
  const { devices, selectedDevice, selectDevice } = useAdb();
  const [selectedFiles, setSelectedFiles] = useState<string[]>(defaultSelectedFiles);
  const [importing, setImporting] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [contactCount, setContactCount] = useState<number>(0);
  
  // 导入策略对话框状态
  const [strategyDialogOpen, setStrategyDialogOpen] = useState(false);
  const [vcfFilePath, setVcfFilePath] = useState<string>('');
  const [currentDeviceId, setCurrentDeviceId] = useState<string>(''); // 保存当前导入的设备ID

  // 当对话框打开时，初始化选中的文件
  React.useEffect(() => {
    if (open && defaultSelectedFiles.length > 0) {
      setSelectedFiles(defaultSelectedFiles);
    }
  }, [open, defaultSelectedFiles]);

  // 当选择的文件变化时，预览联系人数量
  React.useEffect(() => {
    if (selectedFiles.length === 0) {
      setContactCount(0);
      return;
    }

    let cancelled = false;
    setPreviewLoading(true);

    // 根据 includeImported 参数决定是否包含已导入的号码
    // includeImported = false → onlyAvailable = true → 只获取可用号码（默认）
    // includeImported = true → onlyAvailable = false → 获取所有号码（重新导入）
    const onlyAvailable = !includeImported;
    console.log('[DeviceImport] Preview - includeImported:', includeImported, 'onlyAvailable:', onlyAvailable);
    console.log('[DeviceImport] Preview - selectedFiles:', selectedFiles);
    console.log('[DeviceImport] Preview - selectedFiles详细:', JSON.stringify(selectedFiles, null, 2));
    getNumbersByFiles(selectedFiles, onlyAvailable)
      .then((numbers) => {
        if (!cancelled) {
          console.log('[DeviceImport] Preview - numbers:', numbers);
          console.log('[DeviceImport] Preview - numbers.length:', numbers?.length);
          console.log('[DeviceImport] Preview - selectedFiles:', selectedFiles);
          setContactCount(numbers?.length || 0);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('预览联系人数量失败:', err);
          message.error('预览联系人数量失败');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPreviewLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedFiles, includeImported]);

  const handleImport = async () => {
    if (!selectedDevice) {
      message.warning('请先选择目标设备');
      return;
    }

    if (selectedFiles.length === 0) {
      message.warning('请至少选择一个文件');
      return;
    }

    if (contactCount === 0) {
      message.warning('选中的文件中没有可用的联系人');
      return;
    }

    setImporting(true);
    try {
      const deviceId = typeof selectedDevice === 'string' ? selectedDevice : selectedDevice.id;
      
      // 保存设备ID到状态中，供策略对话框使用
      setCurrentDeviceId(deviceId);
      
      // 1. 获取选中文件的号码
      message.loading({ content: '正在获取联系人数据...', key: 'import', duration: 0 });
      const onlyAvailable = !includeImported;
      console.log('[DeviceImport] handleImport - includeImported:', includeImported, 'onlyAvailable:', onlyAvailable);
      console.log('[DeviceImport] handleImport - selectedFiles:', selectedFiles);
      const numbers = await getNumbersByFiles(selectedFiles, onlyAvailable);
      console.log('[DeviceImport] handleImport - numbers:', numbers);
      console.log('[DeviceImport] handleImport - numbers.length:', numbers?.length);
      
      if (!numbers || numbers.length === 0) {
        message.error({ content: '选中的文件中没有可用的联系人', key: 'import' });
        return;
      }

      // 2. 生成VCF内容
      message.loading({ content: '正在生成VCF文件...', key: 'import', duration: 0 });
      const vcfContent = buildVcfFromNumbers(numbers);
      const tempPath = ContactVcfImportService.generateTempVcfPath();
      await ContactVcfImportService.writeVcfFile(tempPath, vcfContent);

      message.destroy('import');
      
      // 3. 打开策略对话框，复用设备卡片的导入逻辑
      setVcfFilePath(tempPath);
      setStrategyDialogOpen(true);
      
    } catch (error: any) {
      console.error('准备导入失败:', error);
      message.error({ 
        content: error?.message || '准备导入失败', 
        key: 'import',
        duration: 5
      });
      setImporting(false);
    }
  };

  const handleClose = () => {
    if (importing) return;
    setSelectedFiles([]);
    setContactCount(0);
    onClose();
  };

  const canImport = useMemo(() => {
    return selectedDevice && selectedFiles.length > 0 && contactCount > 0 && !importing;
  }, [selectedDevice, selectedFiles, contactCount, importing]);

  return (
    <>
      <Modal
        title={
          <Space>
            <MobileOutlined />
            <span>选择文件导入到设备</span>
          </Space>
        }
        open={open}
        onCancel={handleClose}
        width={900}
        footer={[
          <Button key="cancel" onClick={handleClose} disabled={importing}>
            取消
          </Button>,
          <Button
            key="import"
            type="primary"
            onClick={handleImport}
            loading={importing}
            disabled={!canImport}
            icon={<CheckCircleOutlined />}
          >
            {importing ? '导入中...' : `导入 ${contactCount} 个联系人`}
          </Button>,
        ]}
      >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 设备选择 */}
        <div>
          <Title level={5}>
            <MobileOutlined /> 选择目标设备
          </Title>
          <Select
            style={{ width: '100%' }}
            placeholder="请选择要导入到的设备"
            value={selectedDevice ? (typeof selectedDevice === 'string' ? selectedDevice : selectedDevice.id) : undefined}
            onChange={selectDevice}
            disabled={importing}
            showSearch
            optionFilterProp="children"
          >
            {devices.map((device) => (
              <Option key={device.id} value={device.id}>
                <Space>
                  <MobileOutlined />
                  <span>{device.name || device.id}</span>
                  {device.status === 'online' && (
                    <Text type="success" style={{ fontSize: 12 }}>
                      (在线)
                    </Text>
                  )}
                </Space>
              </Option>
            ))}
          </Select>
          {devices.length === 0 && (
            <Alert
              message="未检测到设备"
              description="请确保设备已连接并开启USB调试"
              type="warning"
              showIcon
              style={{ marginTop: 8 }}
            />
          )}
        </div>

        <Divider style={{ margin: '12px 0' }} />

        {/* 文件选择 */}
        <div>
          <Title level={5}>
            <FileTextOutlined /> {defaultSelectedFiles.length > 0 ? '导入文件' : '选择要导入的文件'}
          </Title>
          {defaultSelectedFiles.length > 0 ? (
            // 从文件卡片点击：直接显示已选文件
            <Alert
              message={
                <Space>
                  <FileTextOutlined />
                  <Text>已选择文件：</Text>
                  <Text strong>{defaultSelectedFiles[0].split(/[/\\]/).pop()}</Text>
                </Space>
              }
              type="info"
              showIcon
            />
          ) : (
            // 手动选择模式：显示文件选择器
            <>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
                从已导入到号码池的文件中选择一个或多个文件进行导入
              </Text>
              <ContactFileSelector
                value={selectedFiles}
                onChange={setSelectedFiles}
                onlyAvailable={true}
              />
            </>
          )}
        </div>

        <Divider style={{ margin: '12px 0' }} />

        {/* 导入摘要 */}
        <div>
          <Alert
            message={
              <Space size={16}>
                <Text>
                  将从 <Text strong>{selectedFiles.length}</Text> 个文件
                </Text>
                <Text>
                  导入 
                  {previewLoading ? (
                    <Spin size="small" style={{ marginLeft: 8 }} />
                  ) : (
                    <Text strong style={{ color: '#52c41a', marginLeft: 4 }}>
                      {contactCount}
                    </Text>
                  )}
                  {' '}个联系人
                </Text>
                <Text>
                  到设备 <Text strong>{selectedDevice ? (typeof selectedDevice === 'string' ? selectedDevice : selectedDevice.name || selectedDevice.id) : '(未选择)'}</Text>
                </Text>
              </Space>
            }
            type={canImport ? 'success' : 'info'}
            showIcon
          />
        </div>
      </Space>
    </Modal>

    {/* 复用设备卡片的导入策略对话框 */}
    <DeviceSpecificImportDialog
      visible={strategyDialogOpen}
      vcfFilePath={vcfFilePath}
      targetDeviceId={currentDeviceId}
      deviceContext={{
        deviceName: devices.find(d => d.id === currentDeviceId)?.name || currentDeviceId || '',
      }}
      onClose={() => {
        setStrategyDialogOpen(false);
        setVcfFilePath('');
        setCurrentDeviceId('');
        setImporting(false);
      }}
      onSuccess={(result) => {
        setStrategyDialogOpen(false);
        message.success(`成功导入 ${result.importedCount} 个联系人到设备`);
        
        const importResult = {
          deviceId: currentDeviceId,
          totalCount: contactCount,
          successCount: result.importedCount,
          failCount: result.failedCount || 0,
          selectedFiles,
        };
        
        onImportSuccess?.(importResult);
        handleClose();
      }}
    />
    </>
  );
};

export default DeviceImportFileSelectorDialog;
