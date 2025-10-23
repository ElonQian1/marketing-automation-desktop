// src/modules/contact-import/ui/components/number-pool-table/NumberPoolFieldRenderers.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Tag, Tooltip, Typography } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, MinusCircleOutlined, MobileOutlined } from '@ant-design/icons';
import { ContactNumberDto } from '../../services/contactNumberService';
import { Device } from '../../../../../domain/adb/entities/Device';
import { ColumnRenderers } from './NumberPoolTableColumns';

const { Text } = Typography;

/**
 * 电话号码渲染器
 */
export const PhoneRenderer: React.FC<{ phone?: string | null }> = ({ phone }) => {
  // 🔍 调试：输出phone值
  if (!phone) {
    console.warn('📞 PhoneRenderer: phone 值为空', { phone });
  }

  if (!phone) {
    return <Text type="secondary">-</Text>;
  }

  return (
    <Text strong copyable style={{ fontFamily: 'monospace' }}>
      {phone}
    </Text>
  );
};

/**
 * 姓名渲染器
 */
export const NameRenderer: React.FC<{ name?: string | null }> = ({ name }) => {
  if (!name || name.trim() === '') {
    return <Text type="secondary">-</Text>;
  }

  return <Text>{name}</Text>;
};

/**
 * 状态标签渲染器
 */
export const StatusRenderer: React.FC<{ status?: ContactNumberDto['status'] }> = ({ status }) => {
  const getStatusConfig = (status?: string | null) => {
    switch (status) {
      case 'imported':
        return { color: 'success', icon: <CheckCircleOutlined />, text: '已导入' };
      case 'vcf_generated':
        return { color: 'processing', icon: <MinusCircleOutlined />, text: 'VCF已生成' };
      case 'not_imported':
        return { color: 'default', icon: <CloseCircleOutlined />, text: '未导入' };
      default:
        return { color: 'default', icon: <MinusCircleOutlined />, text: '未知' };
    }
  };

  const config = getStatusConfig(status);
  
  return (
    <Tag color={config.color} icon={config.icon}>
      {config.text}
    </Tag>
  );
};

/**
 * 使用状态渲染器
 */
export const UsedRenderer: React.FC<{ used?: number | null }> = ({ used }) => {
  if (used === 1) {
    return <Tag color="warning" icon={<CheckCircleOutlined />}>已使用</Tag>;
  }
  if (used === 0) {
    return <Tag color="default" icon={<CloseCircleOutlined />}>未使用</Tag>;
  }
  return <Tag color="default">-</Tag>;
};

/**
 * 设备信息渲染器
 */
export const DeviceRenderer: React.FC<{ 
  deviceId?: string | null; 
  devices?: Device[] 
}> = ({ deviceId, devices }) => {
  if (!deviceId) {
    return <Text type="secondary">-</Text>;
  }

  const device = devices?.find(d => d.id === deviceId);
  const displayName = device?.name || device?.model || deviceId;

  return (
    <Tooltip title={`设备ID: ${deviceId}${device ? `\n型号: ${device.model}\n状态: ${device.status}` : ''}`}>
      <Tag color="blue" icon={<MobileOutlined />}>
        {displayName}
      </Tag>
    </Tooltip>
  );
};

/**
 * 行业分类渲染器
 */
export const IndustryRenderer: React.FC<{ industry?: string | null }> = ({ industry }) => {
  if (!industry) {
    return <Text type="secondary">未分类</Text>;
  }
  
  return <Tag color="geekblue">{industry}</Tag>;
};

/**
 * 时间格式化渲染器
 */
export const TimeRenderer: React.FC<{ time?: string | null }> = ({ time }) => {
  if (!time) {
    return <Text type="secondary">-</Text>;
  }

  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return timeStr;
    }
  };

  return (
    <Tooltip title={time}>
      <Text>{formatTime(time)}</Text>
    </Tooltip>
  );
};

/**
 * VCF批次渲染器
 */
export const BatchRenderer: React.FC<{ batch?: string | null }> = ({ batch }) => {
  if (!batch) {
    return <Text type="secondary">-</Text>;
  }

  const shortBatch = batch.length > 20 ? `${batch.substring(0, 20)}...` : batch;

  return (
    <Tooltip title={batch}>
      <Tag color="cyan">{shortBatch}</Tag>
    </Tooltip>
  );
};

/**
 * 文件路径渲染器
 */
export const FilePathRenderer: React.FC<{ path?: string | null }> = ({ path }) => {
  if (!path) {
    return <Text type="secondary">-</Text>;
  }

  const fileName = path.split(/[/\\]/).pop() || path;

  return (
    <Tooltip title={path}>
      <Text ellipsis>{fileName}</Text>
    </Tooltip>
  );
};

/**
 * 创建所有渲染器的集合
 */
export function createNumberPoolRenderers(devices?: Device[]): ColumnRenderers {
  return {
    phone: (value: any) => <PhoneRenderer phone={value} />,
    name: (value: any) => <NameRenderer name={value} />,
    status: (value: any) => <StatusRenderer status={value} />,
    used: (value: any) => <UsedRenderer used={value} />,
    imported_device_id: (value: any) => <DeviceRenderer deviceId={value} devices={devices} />,
    industry: (value: any) => <IndustryRenderer industry={value} />,
    used_at: (value: any) => <TimeRenderer time={value} />,
    created_at: (value: any) => <TimeRenderer time={value} />,
    used_batch: (value: any) => <BatchRenderer batch={value} />,
    source_file: (value: any) => <FilePathRenderer path={value} />,
  };
}