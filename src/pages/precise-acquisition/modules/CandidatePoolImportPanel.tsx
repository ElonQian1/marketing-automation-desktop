/**
 * 候选池导入面板
 * 
 * 集成 CSV 导入和候选池管理功能的完整面板
 */

import React, { useState } from 'react';
import { Card, Typography, Tabs, Space, Button } from 'antd';
import { 
  ImportOutlined, 
  UnorderedListOutlined, 
  BarChartOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { CsvImportComponent } from '../../../components/CsvImportComponent';
import { WatchTargetList } from '../../../components/WatchTargetList';
import { preciseAcquisitionService } from '../../../application/services';

const { Title, Text } = Typography;

/**
 * 候选池导入面板
 */
export const CandidatePoolImportPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('import');
  const [refreshKey, setRefreshKey] = useState(0);

  /**
   * 强制刷新候选池列表
   */
  const refreshTargetList = () => {
    setRefreshKey(prev => prev + 1);
  };

  /**
   * 获取统计数据
   */
  const handleExportStats = async () => {
    try {
      const stats = await preciseAcquisitionService.getStats();
      const statsText = `精准获客统计报告\n` +
        `生成时间: ${new Date().toLocaleString()}\n\n` +
        `候选池统计:\n` +
        `- 总目标数: ${stats.watch_targets_count}\n` +
        `- 评论数: ${stats.comments_count}\n\n` +
        `任务统计:\n` +
        `- 总任务数: ${stats.tasks_count.total}\n` +
        `- 新建任务: ${stats.tasks_count.new}\n` +
        `- 就绪任务: ${stats.tasks_count.ready}\n` +
        `- 执行中: ${stats.tasks_count.executing}\n` +
        `- 已完成: ${stats.tasks_count.done}\n` +
        `- 失败任务: ${stats.tasks_count.failed}\n\n` +
        `今日指标:\n` +
        `- 关注数: ${stats.daily_metrics.follow_count}\n` +
        `- 回复数: ${stats.daily_metrics.reply_count}\n` +
        `- 成功率: ${stats.daily_metrics.success_rate}%`;

      const blob = new Blob([statsText], { type: 'text/plain;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `precise_acquisition_stats_${new Date().toISOString().split('T')[0]}.txt`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('导出统计数据失败:', error);
    }
  };

  const tabItems = [
    {
      key: 'import',
      label: (
        <span>
          <ImportOutlined />
          CSV 导入
        </span>
      ),
      children: (
        <div className="space-y-4">
          <div>
            <Title level={4} className="mb-2">批量导入候选池目标</Title>
            <Text type="secondary">
              支持从 CSV 文件批量导入候选池目标，包括用户、内容、话题等多种类型。
              系统会自动验证数据格式、检查合规性并执行去重处理。
            </Text>
          </div>
          <CsvImportComponent key={`csv-import-${refreshKey}`} />
        </div>
      ),
    },
    {
      key: 'manage',
      label: (
        <span>
          <UnorderedListOutlined />
          候选池管理
        </span>
      ),
      children: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Title level={4} className="mb-2">候选池目标管理</Title>
              <Text type="secondary">
                查看、搜索、筛选和管理所有候选池目标。支持按平台、类型、地区等条件筛选。
              </Text>
            </div>
            <Space>
              <Button 
                icon={<DownloadOutlined />} 
                onClick={handleExportStats}
              >
                导出统计
              </Button>
            </Space>
          </div>
          <WatchTargetList key={`target-list-${refreshKey}`} />
        </div>
      ),
    },
    {
      key: 'stats',
      label: (
        <span>
          <BarChartOutlined />
          统计概览
        </span>
      ),
      children: (
        <div className="space-y-4">
          <div>
            <Title level={4} className="mb-2">候选池统计分析</Title>
            <Text type="secondary">
              候选池目标的统计分析和数据概览。
            </Text>
          </div>
          <Card>
            <Text type="secondary">
              统计分析功能开发中...
            </Text>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div className="candidate-pool-import-panel">
      <Card className="light-theme-force" style={{ background: 'var(--bg-light-base, #ffffff)' }}>
        <div className="space-y-4">
          {/* 页面标题 */}
          <div>
            <Title level={3} className="mb-2">候选池管理中心</Title>
            <Text type="secondary">
              统一管理候选池目标的导入、查看、筛选和分析功能
            </Text>
          </div>

          {/* 功能选项卡 */}
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            type="card"
            className="w-full"
          />
        </div>
      </Card>
    </div>
  );
};

export default CandidatePoolImportPanel;
