/**
 * 日报导出管理组件
 * 
 * 使用统一日报服务的演示组件
 * 提供用户友好的日报导出界面
 */

import React, { useState } from 'react';
import { 
  Card, 
  Button, 
  DatePicker, 
  Switch, 
  Select, 
  Space, 
  Statistic, 
  Row, 
  Col, 
  Alert,
  Typography,
  Divider,
  Progress,
  Tag
} from 'antd';
import { 
  DownloadOutlined, 
  FileTextOutlined, 
  BarChartOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { 
  useUnifiedDailyReport,
  getTodayFollowListConfig,
  getTodayReplyListConfig,
  getFullDailyReportConfig,
  type UnifiedDailyReportConfig
} from '../../hooks/useUnifiedDailyReport';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// ==================== 组件类型定义 ====================

export interface DailyReportManagerProps {
  className?: string;
  showStats?: boolean;
  defaultDate?: Date;
}

// ==================== 主组件 ====================

/**
 * 日报导出管理组件
 */
export const DailyReportManager: React.FC<DailyReportManagerProps> = ({
  className,
  showStats = true,
  defaultDate = new Date()
}) => {
  // Hook状态
  const {
    exportDailyReport,
    getDailyReportStats,
    generateCsvTemplate,
    isExporting,
    isLoadingStats,
    lastExportResult,
    lastStats,
    exportError,
    statsError,
    clearErrors,
    clearResults
  } = useUnifiedDailyReport();

  // 本地状态
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs(defaultDate));
  const [includeFollowList, setIncludeFollowList] = useState(true);
  const [includeReplyList, setIncludeReplyList] = useState(true);
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx'>('csv');

  // ==================== 事件处理 ====================

  /**
   * 处理日报导出
   */
  const handleExport = async () => {
    if (!includeFollowList && !includeReplyList) {
      return;
    }

    const config: UnifiedDailyReportConfig = {
      date: selectedDate.toDate(),
      include_follow_list: includeFollowList,
      include_reply_list: includeReplyList,
      format: exportFormat,
      include_audit_trail: true,
      timezone: 'Asia/Shanghai'
    };

    await exportDailyReport(config);
  };

  /**
   * 处理快速导出预设
   */
  const handleQuickExport = async (type: 'follow' | 'reply' | 'full') => {
    let config: UnifiedDailyReportConfig;
    
    switch (type) {
      case 'follow':
        config = getTodayFollowListConfig();
        break;
      case 'reply':
        config = getTodayReplyListConfig();
        break;
      case 'full':
        config = getFullDailyReportConfig(selectedDate.toDate());
        break;
    }

    await exportDailyReport(config);
  };

  /**
   * 处理统计数据获取
   */
  const handleGetStats = async () => {
    await getDailyReportStats(selectedDate.toDate());
  };

  /**
   * 处理CSV模板下载
   */
  const handleDownloadTemplate = (type: 'follow' | 'reply') => {
    const template = generateCsvTemplate(type);
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type === 'follow' ? '关注清单' : '回复清单'}_模板.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ==================== 渲染辅助函数 ====================

  const renderExportStatus = () => {
    if (!lastExportResult) return null;

    const { success, follow_count, reply_count, export_time, error } = lastExportResult;

    return (
      <Alert
        type={success ? 'success' : 'error'}
        showIcon
        message={success ? '导出完成' : '导出失败'}
        description={
          success ? (
            <Space direction="vertical" size="small">
              <Text>
                导出时间: {dayjs(export_time).format('YYYY-MM-DD HH:mm:ss')}
              </Text>
              <Space>
                <Tag color="blue">关注: {follow_count} 条</Tag>
                <Tag color="green">回复: {reply_count} 条</Tag>
              </Space>
            </Space>
          ) : (
            <Text type="danger">{error}</Text>
          )
        }
        closable
        onClose={clearResults}
        style={{ marginBottom: 16 }}
      />
    );
  };

  const renderStats = () => {
    if (!showStats || !lastStats) return null;

    const {
      total_tasks,
      successful_tasks,
      failed_tasks,
      success_rate,
      follow_tasks,
      reply_tasks,
      execution_time_stats
    } = lastStats;

    return (
      <Card 
        title={
          <Space>
            <BarChartOutlined />
            日报统计数据
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Row gutter={16}>
          <Col span={6}>
            <Statistic 
              title="总任务数" 
              value={total_tasks} 
              prefix={<FileTextOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="成功任务" 
              value={successful_tasks} 
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="失败任务" 
              value={failed_tasks} 
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="成功率" 
              value={Math.round(success_rate * 100)} 
              suffix="%" 
              valueStyle={{ color: success_rate > 0.8 ? '#52c41a' : '#faad14' }}
            />
          </Col>
        </Row>
        
        <Divider />
        
        <Row gutter={16}>
          <Col span={8}>
            <Statistic 
              title="关注任务" 
              value={follow_tasks}
              prefix={<Tag color="blue">关注</Tag>}
            />
          </Col>
          <Col span={8}>
            <Statistic 
              title="回复任务" 
              value={reply_tasks}
              prefix={<Tag color="green">回复</Tag>}
            />
          </Col>
          <Col span={8}>
            <Statistic 
              title="平均执行时间" 
              value={Math.round(execution_time_stats.average_ms / 1000)} 
              suffix="秒"
              prefix={<ClockCircleOutlined />}
            />
          </Col>
        </Row>

        {success_rate < 1 && (
          <>
            <Divider />
            <Progress 
              percent={Math.round(success_rate * 100)} 
              status={success_rate > 0.8 ? 'success' : 'active'}
              format={(percent) => `${percent}% 成功率`}
            />
          </>
        )}
      </Card>
    );
  };

  const renderErrorAlert = () => {
    const error = exportError || statsError;
    if (!error) return null;

    return (
      <Alert
        type="error"
        showIcon
        message="操作失败"
        description={error}
        closable
        onClose={clearErrors}
        style={{ marginBottom: 16 }}
      />
    );
  };

  // ==================== 主渲染 ====================

  return (
    <div className={`light-theme-force ${className || ''}`}>
      <Card 
        title={
          <Space>
            <DownloadOutlined />
            日报导出管理
          </Space>
        }
      >
        {renderErrorAlert()}
        {renderExportStatus()}
        {renderStats()}

        {/* 导出配置区域 */}
        <Card size="small" title="导出配置" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>选择日期:</Text>
                <DatePicker
                  value={selectedDate}
                  onChange={(date) => date && setSelectedDate(date)}
                  format="YYYY-MM-DD"
                  style={{ width: '100%' }}
                  disabled={isExporting}
                />
              </Space>
            </Col>
            
            <Col span={8}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>导出格式:</Text>
                <Select
                  value={exportFormat}
                  onChange={setExportFormat}
                  style={{ width: '100%' }}
                  disabled={isExporting}
                >
                  <Option value="csv">CSV格式</Option>
                  <Option value="xlsx">Excel格式</Option>
                </Select>
              </Space>
            </Col>
            
            <Col span={8}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>导出内容:</Text>
                <Space direction="vertical">
                  <Switch
                    checked={includeFollowList}
                    onChange={setIncludeFollowList}
                    disabled={isExporting}
                  />
                  <Text>包含关注清单</Text>
                </Space>
                <Space direction="vertical">
                  <Switch
                    checked={includeReplyList}
                    onChange={setIncludeReplyList}
                    disabled={isExporting}
                  />
                  <Text>包含回复清单</Text>
                </Space>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 操作按钮区域 */}
        <Row gutter={16}>
          <Col span={12}>
            <Card size="small" title="主要操作">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={handleExport}
                  loading={isExporting}
                  disabled={!includeFollowList && !includeReplyList}
                  block
                >
                  导出日报
                </Button>
                
                <Button
                  icon={<BarChartOutlined />}
                  onClick={handleGetStats}
                  loading={isLoadingStats}
                  block
                >
                  获取统计数据
                </Button>
              </Space>
            </Card>
          </Col>
          
          <Col span={12}>
            <Card size="small" title="快速操作">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  onClick={() => handleQuickExport('follow')}
                  loading={isExporting}
                  block
                >
                  今日关注清单
                </Button>
                
                <Button
                  onClick={() => handleQuickExport('reply')}
                  loading={isExporting}
                  block
                >
                  今日回复清单
                </Button>
                
                <Button
                  onClick={() => handleQuickExport('full')}
                  loading={isExporting}
                  block
                >
                  完整日报
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* 模板下载区域 */}
        <Card size="small" title="CSV模板下载" style={{ marginTop: 16 }}>
          <Space>
            <Button
              size="small"
              onClick={() => handleDownloadTemplate('follow')}
            >
              关注清单模板
            </Button>
            <Button
              size="small"
              onClick={() => handleDownloadTemplate('reply')}
            >
              回复清单模板
            </Button>
          </Space>
        </Card>

        {/* 使用说明 */}
        <Card size="small" title="使用说明" style={{ marginTop: 16 }}>
          <Paragraph>
            <ul>
              <li><strong>关注清单</strong>: 导出指定日期执行的关注操作记录</li>
              <li><strong>回复清单</strong>: 导出指定日期执行的回复操作记录</li>
              <li><strong>CSV格式</strong>: 适合在Excel中打开，兼容性好</li>
              <li><strong>Excel格式</strong>: 原生Excel格式，支持更多功能</li>
              <li><strong>审计追踪</strong>: 所有导出操作都会记录到审计日志</li>
            </ul>
          </Paragraph>
        </Card>
      </Card>
    </div>
  );
};

export default DailyReportManager;