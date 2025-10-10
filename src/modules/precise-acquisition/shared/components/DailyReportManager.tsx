/**
 * 每日报告导出管理界面
 * 
 * 提供日报导出的配置、执行和历史管理功能
 */

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  DatePicker, 
  Button, 
  Switch, 
  Select, 
  Table, 
  Space, 
  Progress, 
  Alert, 
  Statistic, 
  Row, 
  Col,
  message,
  Tag,
  Tooltip
} from 'antd';
import { 
  DownloadOutlined, 
  CalendarOutlined, 
  FileTextOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { DailyReportExportService, DailyReportConfig, ExportResult } from '../services/DailyReportExportService';
import { Task } from '../../shared/types/core';
import { Comment } from '../../../../domain/precise-acquisition/entities/Comment';
import { WatchTarget } from '../../../../domain/precise-acquisition/entities/WatchTarget';
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface DailyReportManagerProps {
  tasks: Task[];
  comments: Comment[];
  watchTargets: WatchTarget[];
  onExportComplete: (result: ExportResult) => void;
}

/**
 * 每日报告导出管理器
 */
export const DailyReportManager: React.FC<DailyReportManagerProps> = ({
  tasks,
  comments,
  watchTargets,
  onExportComplete
}) => {
  const [exportService] = useState(() => new DailyReportExportService());
  const [loading, setLoading] = useState(false);
  const [exportHistory, setExportHistory] = useState<ExportResult[]>([]);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [config, setConfig] = useState<DailyReportConfig>({
    date: new Date(),
    includeFollows: true,
    includeReplies: true,
    timezone: 'Asia/Shanghai'
  });

  /**
   * 执行单日导出
   */
  const handleSingleDayExport = async () => {
    setLoading(true);
    try {
      const exportConfig: DailyReportConfig = {
        ...config,
        date: selectedDate.toDate()
      };
      
      const result = await exportService.exportDailyReport(
        exportConfig,
        tasks,
        comments,
        watchTargets
      );
      
      if (result.success) {
        message.success(`导出成功！关注${result.follow_count}条，回复${result.reply_count}条`);
        setExportHistory(prev => [result, ...prev]);
        onExportComplete(result);
      } else {
        message.error(`导出失败：${result.error_message}`);
      }
      
    } catch (error) {
      message.error(`导出出错：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 执行批量导出
   */
  const handleBatchExport = async () => {
    if (!dateRange) {
      message.warning('请选择日期范围');
      return;
    }

    setLoading(true);
    try {
      const [startDate, endDate] = dateRange;
      const results = await exportService.exportDateRange(
        startDate.toDate(),
        endDate.toDate(),
        tasks,
        comments,
        watchTargets
      );
      
      const stats = exportService.getExportStats(results);
      
      message.success(
        `批量导出完成！成功${stats.successfulDays}天，` +
        `关注${stats.totalFollows}条，回复${stats.totalReplies}条`
      );
      
      setExportHistory(prev => [...results, ...prev]);
      
    } catch (error) {
      message.error(`批量导出出错：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 渲染导出配置
   */
  const renderExportConfig = () => (
    <Card title="导出配置" size="small" style={{ marginBottom: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Row gutter={16}>
          <Col span={12}>
            <span>包含关注列表：</span>
            <Switch
              checked={config.includeFollows}
              onChange={(checked) => setConfig(prev => ({ ...prev, includeFollows: checked }))}
            />
          </Col>
          <Col span={12}>
            <span>包含回复列表：</span>
            <Switch
              checked={config.includeReplies}
              onChange={(checked) => setConfig(prev => ({ ...prev, includeReplies: checked }))}
            />
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col span={12}>
            <span>时区：</span>
            <Select
              value={config.timezone}
              style={{ width: 150 }}
              onChange={(value) => setConfig(prev => ({ ...prev, timezone: value }))}
            >
              <Option value="Asia/Shanghai">北京时间</Option>
              <Option value="UTC">UTC</Option>
            </Select>
          </Col>
        </Row>
      </Space>
    </Card>
  );

  /**
   * 渲染单日导出
   */
  const renderSingleDayExport = () => (
    <Card title="单日导出" size="small" style={{ marginBottom: 16 }}>
      <Space>
        <DatePicker
          value={selectedDate}
          onChange={(date) => date && setSelectedDate(date)}
          placeholder="选择日期"
          format="YYYY-MM-DD"
        />
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          loading={loading}
          onClick={handleSingleDayExport}
          disabled={!config.includeFollows && !config.includeReplies}
        >
          导出
        </Button>
      </Space>
    </Card>
  );

  /**
   * 渲染批量导出
   */
  const renderBatchExport = () => (
    <Card title="批量导出" size="small" style={{ marginBottom: 16 }}>
      <Space>
        <RangePicker
          value={dateRange}
          onChange={(dates) => setDateRange(dates)}
          placeholder={['开始日期', '结束日期']}
          format="YYYY-MM-DD"
        />
        <Button
          type="primary"
          icon={<CalendarOutlined />}
          loading={loading}
          onClick={handleBatchExport}
          disabled={!dateRange || (!config.includeFollows && !config.includeReplies)}
        >
          批量导出
        </Button>
      </Space>
    </Card>
  );

  /**
   * 导出历史表格列定义
   */
  const historyColumns = [
    {
      title: '导出时间',
      dataIndex: 'export_time',
      key: 'export_time',
      render: (time: Date) => dayjs(time).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '状态',
      dataIndex: 'success',
      key: 'success',
      render: (success: boolean) => (
        <Tag color={success ? 'green' : 'red'} icon={success ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}>
          {success ? '成功' : '失败'}
        </Tag>
      )
    },
    {
      title: '关注数',
      dataIndex: 'follow_count',
      key: 'follow_count',
      render: (count: number) => <span>{count}</span>
    },
    {
      title: '回复数',
      dataIndex: 'reply_count',
      key: 'reply_count',
      render: (count: number) => <span>{count}</span>
    },
    {
      title: '文件路径',
      key: 'files',
      render: (_: any, record: ExportResult) => (
        <Space direction="vertical" size="small">
          {record.follow_file_path && (
            <Tooltip title={record.follow_file_path}>
              <Tag color="blue" icon={<FileTextOutlined />}>关注列表</Tag>
            </Tooltip>
          )}
          {record.reply_file_path && (
            <Tooltip title={record.reply_file_path}>
              <Tag color="green" icon={<FileTextOutlined />}>回复列表</Tag>
            </Tooltip>
          )}
        </Space>
      )
    },
    {
      title: '错误信息',
      dataIndex: 'error_message',
      key: 'error_message',
      render: (error: string) => error ? (
        <Tooltip title={error}>
          <Tag color="red">查看错误</Tag>
        </Tooltip>
      ) : '-'
    }
  ];

  /**
   * 渲染统计信息
   */
  const renderStatistics = () => {
    const todayTasks = tasks.filter(task => 
      task.executed_at && 
      dayjs(task.executed_at).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')
    );
    
    const todayFollows = todayTasks.filter(task => task.task_type === 'follow').length;
    const todayReplies = todayTasks.filter(task => task.task_type === 'reply').length;
    
    return (
      <Card title="今日统计" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="今日关注"
              value={todayFollows}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="今日回复"
              value={todayReplies}
              prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="总操作"
              value={todayFollows + todayReplies}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
            />
          </Col>
        </Row>
      </Card>
    );
  };

  return (
    <div className="light-theme-force" style={{ background: 'var(--bg-light-base)', padding: 16 }}>
      {renderStatistics()}
      
      {(!config.includeFollows && !config.includeReplies) && (
        <Alert
          message="请至少选择一种导出类型"
          description="关注列表或回复列表至少选择一种进行导出"
          type="warning"
          style={{ marginBottom: 16 }}
        />
      )}
      
      {renderExportConfig()}
      {renderSingleDayExport()}
      {renderBatchExport()}
      
      <Card title="导出历史">
        <Table
          dataSource={exportHistory}
          columns={historyColumns}
          rowKey={(record) => record.export_time.getTime().toString()}
          size="small"
          pagination={{ pageSize: 10 }}
          loading={loading}
        />
      </Card>
    </div>
  );
};

export default DailyReportManager;