// src/modules/contact-import/ui/utils/ContactWorkbenchColumns.tsx
// module: contact-import | layer: ui | role: module-component
// summary: 模块组件

/**
 * ContactImportWorkbench 表格列配置 - Employee D 架构
 * 
 * 目的：分离表格列配置逻辑，符合单任务单文件原则
 * 约束：≤150行，专注列配置和渲染逻辑
 */

import React from 'react';
import { MobileOutlined } from '@ant-design/icons';
import { Text } from '../../../../components/adapters';
import { Tag } from '../../../../components/adapters/tag/TagAdapter';

// 表格列配置默认值
export const COLUMN_DEFAULTS = [
  { key: 'seq', title: '序号', defaultVisible: true, defaultWidth: 70 },
  { key: 'id', title: 'ID', defaultVisible: true, defaultWidth: 80 },
  { key: 'phone', title: '号码', defaultVisible: true },
  { key: 'name', title: '姓名', defaultVisible: true, defaultWidth: 180 },
  { key: 'industry', title: '行业分类', defaultVisible: true, defaultWidth: 120 },
  { key: 'status', title: '状态', defaultVisible: true, defaultWidth: 120 },
  { key: 'used', title: '是否已用', defaultVisible: true, defaultWidth: 100 },
  { key: 'imported_device_id', title: '导入设备', defaultVisible: true, defaultWidth: 150 },
  { key: 'source_file', title: '来源', defaultVisible: true },
  { key: 'created_at', title: '创建时间', defaultVisible: true, defaultWidth: 160 },
];

// 根据列配置生成表格列定义
export const generateTableColumns = (columnSettings: any) => {
  const arr: any[] = [];
  
  for (const cfg of columnSettings.displayColumns) {
    switch (cfg.key) {
      case 'seq':
        arr.push({ 
          title: cfg.title, 
          dataIndex: 'seq', 
          width: cfg.width ?? 70, 
          render: (_: any, __: any, index: number) => index + 1 
        });
        break;
        
      case 'id':
        arr.push({ title: cfg.title, dataIndex: 'id', width: cfg.width ?? 80 });
        break;
        
      case 'phone':
        arr.push({ title: cfg.title, dataIndex: 'phone', width: cfg.width });
        break;
        
      case 'name':
        arr.push({ title: cfg.title, dataIndex: 'name', width: cfg.width ?? 180 });
        break;
        
      case 'industry':
        arr.push({ 
          title: cfg.title, 
          dataIndex: 'industry', 
          width: cfg.width ?? 120, 
          render: (industry: string | null) => 
            industry ? <Tag color="geekblue">{industry}</Tag> : <Text type="secondary">未分类</Text> 
        });
        break;
        
      case 'status':
        arr.push({ 
          title: cfg.title, 
          dataIndex: 'status', 
          width: cfg.width ?? 120, 
          render: (status: string | null) => {
            const config = status === 'imported' ? { color: 'success', text: '已导入' } :
                          status === 'vcf_generated' ? { color: 'processing', text: 'VCF已生成' } :
                          status === 'not_imported' ? { color: 'default', text: '未导入' } :
                          { color: 'default', text: '未知' };
            return <Tag color={config.color}>{config.text}</Tag>;
          }
        });
        break;
        
      case 'used':
        arr.push({ 
          title: cfg.title, 
          dataIndex: 'status', 
          width: cfg.width ?? 100, 
          render: (status: string | null) => {
            switch (status) {
              case 'available': return <Tag color="success">可用</Tag>;
              case 'assigned': return <Tag color="processing">已分配</Tag>;
              case 'imported': return <Tag color="warning">已导入</Tag>;
              case 'archived': return <Tag color="default">已归档</Tag>;
              default: return <Tag color="default">-</Tag>;
            }
          }
        });
        break;
        
      case 'imported_device_id':
        arr.push({ 
          title: cfg.title, 
          dataIndex: 'imported_device_id', 
          width: cfg.width ?? 150, 
          render: (deviceId: string | null) => 
            deviceId ? <Tag color="blue" icon={<MobileOutlined />}>{deviceId}</Tag> : <Text type="secondary">-</Text> 
        });
        break;
        
      case 'source_file':
        arr.push({ title: cfg.title, dataIndex: 'source_file', ellipsis: true, width: cfg.width });
        break;
        
      case 'created_at':
        arr.push({ 
          title: cfg.title, 
          dataIndex: 'created_at', 
          width: cfg.width ?? 160, 
          render: (time: string) => time ? new Date(time).toLocaleString() : '-' 
        });
        break;
    }
  }
  
  return arr;
};