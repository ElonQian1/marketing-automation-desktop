/**
 * 联系人导入工作台 - 简化版本
 * 临时替代复杂版本，确保功能可用
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Alert, Spin, message } from 'antd';
import { 
  DatabaseOutlined, 
  FileTextOutlined, 
  FolderOpenOutlined, 
  MobileOutlined,
  SettingOutlined 
} from '@ant-design/icons';
import { useAdb } from '../../../application/hooks/useAdb';

interface ContactImportWorkbenchSimpleProps {
  className?: string;
}

export const ContactImportWorkbenchSimple: React.FC<ContactImportWorkbenchSimpleProps> = ({ 
  className 
}) => {
  const [loading, setLoading] = useState(false);
  const { devices, selectedDevice, refreshDevices } = useAdb();

  useEffect(() => {
    // 初始加载设备
    refreshDevices();
  }, [refreshDevices]);

  const handleImportTxt = async () => {
    try {
      setLoading(true);
      // TODO: 实现 TXT 导入逻辑
      message.info('TXT 导入功能开发中...');
    } catch (error) {
      message.error('导入失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportFolder = async () => {
    try {
      setLoading(true);
      // TODO: 实现文件夹导入逻辑
      message.info('文件夹导入功能开发中...');
    } catch (error) {
      message.error('导入失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVcf = async () => {
    if (!selectedDevice) {
      message.warning('请先选择设备');
      return;
    }

    try {
      setLoading(true);
      // TODO: 实现 VCF 生成逻辑
      message.info('VCF 生成功能开发中...');
    } catch (error) {
      message.error('生成失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <Spin spinning={loading}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          
          {/* 状态提示 */}
          <Alert
            message="联系人导入工作台"
            description="这是一个简化版本，完整功能正在恢复中。您可以使用基本的导入和设备管理功能。"
            type="info"
            showIcon
          />

          {/* 设备管理 */}
          <Card 
            title={
              <Space>
                <MobileOutlined />
                设备管理
              </Space>
            }
            extra={
              <Button onClick={refreshDevices} size="small">
                刷新设备
              </Button>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <strong>在线设备数量:</strong> {devices.filter(d => d.status === 'online').length}
              </div>
              <div>
                <strong>当前选中设备:</strong> {selectedDevice?.id || '未选择'}
              </div>
              {devices.length === 0 && (
                <Alert 
                  message="未检测到设备" 
                  description="请确保设备已连接并启用 USB 调试"
                  type="warning"
                  showIcon
                />
              )}
            </Space>
          </Card>

          {/* 导入功能 */}
          <Card 
            title={
              <Space>
                <DatabaseOutlined />
                导入功能
              </Space>
            }
          >
            <Space>
              <Button 
                icon={<FileTextOutlined />} 
                onClick={handleImportTxt}
                disabled={loading}
              >
                导入 TXT 文件
              </Button>
              <Button 
                icon={<FolderOpenOutlined />} 
                onClick={handleImportFolder}
                disabled={loading}
              >
                导入文件夹
              </Button>
              <Button 
                type="primary"
                icon={<SettingOutlined />} 
                onClick={handleGenerateVcf}
                disabled={loading || !selectedDevice}
              >
                生成并导入 VCF
              </Button>
            </Space>
          </Card>

          {/* 统计信息 */}
          <Card 
            title="统计信息"
            size="small"
          >
            <Space>
              <span>号码池: 0 条</span>
              <span>已导入: 0 条</span>
              <span>未使用: 0 条</span>
            </Space>
          </Card>

        </Space>
      </Spin>
    </div>
  );
};

export default ContactImportWorkbenchSimple;