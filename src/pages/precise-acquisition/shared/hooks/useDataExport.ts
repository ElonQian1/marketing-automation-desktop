// src/pages/precise-acquisition/shared/hooks/useDataExport.ts
// module: ui | layer: ui | role: page
// summary: 页面组件

/**
 * 数据导出工具Hook
 * 
 * 统一处理各种数据导出功能
 */
import { useCallback } from 'react';
import { message } from 'antd';

interface ExportOptions {
  filename?: string;
  type?: 'csv' | 'json' | 'txt';
  encoding?: string;
}

export const useDataExport = () => {
  const exportData = useCallback((
    data: any,
    options: ExportOptions = {}
  ) => {
    const {
      filename = `export_${new Date().toISOString().split('T')[0]}`,
      type = 'json',
      encoding = 'utf-8'
    } = options;

    try {
      let content: string;
      let mimeType: string;
      let extension: string;

      switch (type) {
        case 'csv':
          content = convertToCSV(data);
          mimeType = 'text/csv';
          extension = 'csv';
          break;
        case 'txt':
          content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
          mimeType = 'text/plain';
          extension = 'txt';
          break;
        case 'json':
        default:
          content = JSON.stringify(data, null, 2);
          mimeType = 'application/json';
          extension = 'json';
          break;
      }

      const blob = new Blob([content], { 
        type: `${mimeType};charset=${encoding}` 
      });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.${extension}`;
      link.click();
      
      URL.revokeObjectURL(link.href);
      
      message.success(`导出成功: ${filename}.${extension}`);
    } catch (error) {
      console.error('Export failed:', error);
      message.error('导出失败');
    }
  }, []);

  return { exportData };
};

/**
 * 转换数据为CSV格式
 */
function convertToCSV(data: any[]): string {
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // 处理包含逗号和引号的值
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ];

  return csvRows.join('\n');
}