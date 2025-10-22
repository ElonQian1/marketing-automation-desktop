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
import { VcfActions } from '../services/vcfActions';
import { ContactVcfImportService } from '../../../../services/contact-vcf-import-service';

const { Text, Title } = Typography;
const { Option } = Select;

export interface DeviceImportFileSelectorProps {
  /** 是否显示对话框 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 导入成功回调 */
  onImportSuccess?: (result: { deviceId: string; totalCount: number; successCount: number; failCount: number }) => void;
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
}) => {
  const { devices, selectedDevice, selectDevice } = useAdb();
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [contactCount, setContactCount] = useState<number>(0);

  // 当选择的文件变化时，预览联系人数量
  React.useEffect(() => {
    if (selectedFiles.length === 0) {
      setContactCount(0);
      return;
    }

    let cancelled = false;
    setPreviewLoading(true);

    getNumbersByFiles(selectedFiles, true) // 只获取可用号码
      .then((numbers) => {
        if (!cancelled) {
          setContactCount(numbers.length);
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
  }, [selectedFiles]);

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
      
      // 1. 获取选中文件的所有可用号码
      message.loading({ content: '正在获取联系人数据...', key: 'import', duration: 0 });
      const numbers = await getNumbersByFiles(selectedFiles, true);
      
      if (numbers.length === 0) {
        message.error({ content: '选中的文件中没有可用的联系人', key: 'import' });
        return;
      }

      // 2. 生成VCF内容
      message.loading({ content: '正在生成VCF文件...', key: 'import', duration: 0 });
      const vcfContent = buildVcfFromNumbers(numbers);
      const tempPath = ContactVcfImportService.generateTempVcfPath();
      await ContactVcfImportService.writeVcfFile(tempPath, vcfContent);

      // 3. 执行导入
      message.loading({ content: `正在导入到设备 ${deviceId}...`, key: 'import', duration: 0 });
      const outcome = await VcfActions.importVcfToDevice(tempPath, deviceId);
      
      if (!outcome.success) {
        message.error({ content: `导入失败: ${outcome.message}`, key: 'import' });
        return;
      }

      const result = {
        deviceId,
        totalCount: numbers.length,
        successCount: outcome.importedCount,
        failCount: outcome.failedCount,
        selectedFiles,
      };

      message.success({ 
        content: `成功导入 ${result.successCount} 个联系人到设备 ${deviceId}`, 
        key: 'import',
        duration: 3
      });
      
      onImportSuccess?.(result);
      handleClose();
    } catch (error: any) {
      console.error('导入失败:', error);
      message.error({ 
        content: error?.message || '导入失败', 
        key: 'import',
        duration: 5
      });
    } finally {
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

  const selectedDeviceId = useMemo(() => {
    return selectedDevice ? (typeof selectedDevice === 'string' ? selectedDevice : selectedDevice.id) : null;
  }, [selectedDevice]);

  return (
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
            value={selectedDeviceId || undefined}
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
            <FileTextOutlined /> 选择要导入的文件
          </Title>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
            从已导入到号码池的文件中选择一个或多个文件进行导入
          </Text>
          <ContactFileSelector
            value={selectedFiles}
            onChange={setSelectedFiles}
            onlyAvailable={true}
          />
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
                  到设备 <Text strong>{selectedDeviceId || '(未选择)'}</Text>
                </Text>
              </Space>
            }
            type={canImport ? 'success' : 'info'}
            showIcon
          />
        </div>
      </Space>
    </Modal>
  );
};

export default DeviceImportFileSelectorDialog;
