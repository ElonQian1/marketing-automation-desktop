/**
 * CSV 导入组件
 * 
 * 提供候选池 CSV 文件上传、验证、导入的完整界面
 */

import React, { useState, useRef } from 'react';
import {
  Card,
  Button,
  Upload,
  Progress,
  Table,
  Alert,
  Space,
  Typography,
  Divider,
  Tag,
  Modal,
  Row,
  Col,
  Statistic,
  Tooltip,
  message,
} from 'antd';
import {
  UploadOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useCsvImport, type CsvValidationResult, type ImportStats } from '../../hooks/useCsvImport';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

/**
 * CSV 导入组件
 */
export const CsvImportComponent: React.FC = () => {
  const {
    isValidating,
    isImporting,
    validationResults,
    importStats,
    error,
    validateCsv,
    importValidatedData,
    importCsv,
    reset,
    generateCsvTemplate,
  } = useCsvImport();

  const [csvContent, setCsvContent] = useState<string>('');
  const [showValidationResults, setShowValidationResults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * 处理文件上传
   */
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvContent(content);
      // 自动开始验证
      validateCsv(content).then(() => {
        setShowValidationResults(true);
      }).catch((err) => {
        message.error(`文件验证失败: ${err.message}`);
      });
    };
    reader.readAsText(file, 'utf-8');
    return false; // 阻止自动上传
  };

  /**
   * 下载 CSV 模板
   */
  const handleDownloadTemplate = () => {
    const template = generateCsvTemplate();
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'watch_targets_template.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    message.success('模板下载完成');
  };

  /**
   * 执行导入
   */
  const handleImport = async () => {
    if (!validationResults.length) {
      message.warning('请先上传并验证CSV文件');
      return;
    }

    try {
      const stats = await importValidatedData(validationResults);
      message.success(`导入完成：成功 ${stats.importedRows} 条，失败 ${stats.totalRows - stats.importedRows} 条`);
    } catch (err) {
      message.error(`导入失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  /**
   * 重新开始
   */
  const handleReset = () => {
    reset();
    setCsvContent('');
    setShowValidationResults(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * 验证结果表格列定义
   */
  const validationColumns = [
    {
      title: '行号',
      dataIndex: 'rowIndex',
      key: 'rowIndex',
      width: 80,
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (record: CsvValidationResult) => (
        <Tag 
          icon={record.isValid ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          color={record.isValid ? 'success' : 'error'}
        >
          {record.isValid ? '有效' : '无效'}
        </Tag>
      ),
    },
    {
      title: '平台',
      key: 'platform',
      width: 120,
      render: (record: CsvValidationResult) => record.data?.platform || '-',
    },
    {
      title: '类型',
      key: 'targetType',
      width: 120,
      render: (record: CsvValidationResult) => record.data?.targetType || '-',
    },
    {
      title: '标题',
      key: 'title',
      width: 200,
      render: (record: CsvValidationResult) => record.data?.title || '-',
      ellipsis: true,
    },
    {
      title: '错误信息',
      key: 'errors',
      render: (record: CsvValidationResult) => (
        <Space direction="vertical" size="small">
          {record.errors.map((error, index) => (
            <Tag key={index} color="error" icon={<ExclamationCircleOutlined />}>
              {error}
            </Tag>
          ))}
          {record.warnings.map((warning, index) => (
            <Tag key={index} color="warning" icon={<InfoCircleOutlined />}>
              {warning}
            </Tag>
          ))}
        </Space>
      ),
    },
  ];

  const validCount = validationResults.filter(r => r.isValid).length;
  const invalidCount = validationResults.length - validCount;

  return (
    <div className="csv-import-component">
      <Card>
        <div className="space-y-6">
          {/* 标题和说明 */}
          <div>
            <Title level={3}>候选池 CSV 导入</Title>
            <Paragraph type="secondary">
              批量导入候选池目标信息。支持用户、内容、话题等多种目标类型的导入。
            </Paragraph>
          </div>

          {/* 模板下载 */}
          <Card size="small" className="bg-blue-50 border-blue-200">
            <Space align="center">
              <InfoCircleOutlined className="text-blue-500" />
              <Text>首次使用？下载CSV模板了解格式要求</Text>
              <Button 
                type="link" 
                icon={<DownloadOutlined />}
                onClick={handleDownloadTemplate}
              >
                下载模板
              </Button>
            </Space>
          </Card>

          {/* 文件上传 */}
          {!showValidationResults && (
            <Card title="选择CSV文件" size="small">
              <Dragger
                accept=".csv"
                beforeUpload={handleFileUpload}
                showUploadList={false}
                disabled={isValidating}
              >
                <div className="text-center p-6">
                  <UploadOutlined className="text-4xl text-gray-400" />
                  <div className="mt-4">
                    <Text className="text-lg">点击或拖拽CSV文件到此处</Text>
                  </div>
                  <div className="mt-2">
                    <Text type="secondary">支持.csv格式，文件大小不超过10MB</Text>
                  </div>
                </div>
              </Dragger>
              
              {isValidating && (
                <div className="mt-4">
                  <Progress 
                    percent={100} 
                    status="active" 
                    showInfo={false}
                  />
                  <Text type="secondary" className="block text-center mt-2">
                    正在验证文件格式和数据...
                  </Text>
                </div>
              )}
            </Card>
          )}

          {/* 验证结果 */}
          {showValidationResults && !isImporting && (
            <div className="space-y-4">
              {/* 统计信息 */}
              <Card title="验证结果" size="small">
                <Row gutter={16}>
                  <Col span={6}>
                    <Statistic 
                      title="总行数" 
                      value={validationResults.length}
                      prefix={<InfoCircleOutlined />}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic 
                      title="有效数据" 
                      value={validCount}
                      valueStyle={{ color: '#52c41a' }}
                      prefix={<CheckCircleOutlined />}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic 
                      title="无效数据" 
                      value={invalidCount}
                      valueStyle={{ color: '#f5222d' }}
                      prefix={<CloseCircleOutlined />}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic 
                      title="可导入数据" 
                      value={validCount}
                      valueStyle={{ color: '#1890ff' }}
                      prefix={<CheckCircleOutlined />}
                    />
                  </Col>
                </Row>
              </Card>

              {/* 详细验证结果 */}
              <Card title="详细数据" size="small">
                <Table
                  columns={validationColumns}
                  dataSource={validationResults}
                  rowKey="rowIndex"
                  pagination={{
                    total: validationResults.length,
                    pageSize: 20,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => 
                      `第 ${range[0]}-${range[1]} 条，共 ${total} 条数据`,
                  }}
                  size="small"
                  scroll={{ x: 1000 }}
                />
              </Card>

              {/* 操作按钮 */}
              <Card size="small">
                <Space>
                  <Button 
                    type="primary" 
                    icon={<UploadOutlined />}
                    onClick={handleImport}
                    disabled={validCount === 0}
                    loading={isImporting}
                  >
                    导入有效数据 ({validCount} 条)
                  </Button>
                  <Button onClick={handleReset}>
                    重新选择文件
                  </Button>
                </Space>
              </Card>
            </div>
          )}

          {/* 导入进度 */}
          {isImporting && (
            <Card title="正在导入" size="small">
              <Progress 
                percent={100} 
                status="active" 
                showInfo={false}
              />
              <Text type="secondary" className="block text-center mt-2">
                正在导入数据到候选池...
              </Text>
            </Card>
          )}

          {/* 导入结果 */}
          {importStats && (
            <Card title="导入完成" size="small">
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic 
                    title="导入成功" 
                    value={importStats.importedRows}
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic 
                    title="导入失败" 
                    value={importStats.totalRows - importStats.importedRows}
                    valueStyle={{ color: '#f5222d' }}
                    prefix={<CloseCircleOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic 
                    title="重复数据" 
                    value={importStats.duplicateRows}
                    valueStyle={{ color: '#faad14' }}
                    prefix={<ExclamationCircleOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic 
                    title="成功率" 
                    value={(importStats.importedRows / importStats.totalRows * 100).toFixed(1)}
                    suffix="%"
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
              </Row>

              {importStats.errors.length > 0 && (
                <div className="mt-4">
                  <Alert
                    message="导入错误详情"
                    description={
                      <div className="space-y-1">
                        {importStats.errors.slice(0, 5).map((error, index) => (
                          <Text key={index} type="secondary" className="block">
                            第 {error.row} 行: {error.message}
                          </Text>
                        ))}
                        {importStats.errors.length > 5 && (
                          <Text type="secondary">
                            ...还有 {importStats.errors.length - 5} 个错误
                          </Text>
                        )}
                      </div>
                    }
                    type="warning"
                    showIcon
                  />
                </div>
              )}

              <div className="mt-4">
                <Button type="primary" onClick={handleReset}>
                  继续导入其他文件
                </Button>
              </div>
            </Card>
          )}

          {/* 错误提示 */}
          {error && (
            <Alert
              message="操作失败"
              description={error}
              type="error"
              showIcon
              closable
              onClose={() => reset()}
            />
          )}
        </div>
      </Card>
    </div>
  );
};