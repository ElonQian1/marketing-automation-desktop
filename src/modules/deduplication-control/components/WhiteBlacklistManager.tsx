/**
 * 白名单/黑名单管理组件
 * 
 * 提供用户白名单和黑名单的CRUD管理功能
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Popconfirm,
  message,
  Upload,
  Typography,
  Row,
  Col,
  Statistic,
  Divider,
  Tooltip,
  Badge,
  Alert
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  BulbOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { WhitelistEntry, BlacklistEntry, ListType, ListAction } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface WhiteBlacklistManagerProps {
  whitelist: WhitelistEntry[];
  blacklist: BlacklistEntry[];
  onAddEntry: (type: ListType, entry: Omit<WhitelistEntry | BlacklistEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateEntry: (type: ListType, id: string, entry: Partial<WhitelistEntry | BlacklistEntry>) => Promise<void>;
  onDeleteEntry: (type: ListType, id: string) => Promise<void>;
  onBatchImport: (type: ListType, entries: any[]) => Promise<void>;
  onExport: (type: ListType) => Promise<void>;
  loading?: boolean;
}

/**
 * 添加/编辑条目模态框
 */
const EntryModal: React.FC<{
  visible: boolean;
  type: ListType;
  entry?: WhitelistEntry | BlacklistEntry;
  onOk: (values: any) => void;
  onCancel: () => void;
  loading?: boolean;
}> = ({ visible, type, entry, onOk, onCancel, loading }) => {
  const [form] = Form.useForm();
  const isEdit = !!entry;
  
  useEffect(() => {
    if (visible) {
      if (entry) {
        form.setFieldsValue(entry);
      } else {
        form.resetFields();
      }
    }
  }, [visible, entry, form]);
  
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onOk(values);
      form.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };
  
  const getFieldsByType = () => {
    const commonFields = [
      <Form.Item
        key="identifier"
        name="identifier"
        label="标识符"
        rules={[{ required: true, message: '请输入标识符' }]}
      >
        <Input placeholder="手机号、用户ID、昵称等" />
      </Form.Item>,
      
      <Form.Item
        key="identifierType"
        name="identifierType"
        label="标识符类型"
        rules={[{ required: true, message: '请选择标识符类型' }]}
      >
        <Select placeholder="选择类型">
          <Option value="phone">手机号</Option>
          <Option value="userId">用户ID</Option>
          <Option value="nickname">昵称</Option>
          <Option value="email">邮箱</Option>
          <Option value="custom">自定义</Option>
        </Select>
      </Form.Item>,
      
      <Form.Item
        key="reason"
        name="reason"
        label="原因"
        rules={[{ required: true, message: '请输入原因' }]}
      >
        <TextArea 
          rows={3} 
          placeholder={`请说明添加到${type === 'whitelist' ? '白名单' : '黑名单'}的原因`} 
        />
      </Form.Item>
    ];
    
    if (type === 'whitelist') {
      return [
        ...commonFields,
        <Form.Item
          key="priority"
          name="priority"
          label="优先级"
          initialValue="normal"
        >
          <Select>
            <Option value="low">低</Option>
            <Option value="normal">普通</Option>
            <Option value="high">高</Option>
            <Option value="critical">紧急</Option>
          </Select>
        </Form.Item>
      ];
    } else {
      return [
        ...commonFields,
        <Form.Item
          key="severity"
          name="severity"
          label="严重程度"
          initialValue="medium"
        >
          <Select>
            <Option value="low">轻微</Option>
            <Option value="medium">中等</Option>
            <Option value="high">严重</Option>
            <Option value="critical">非常严重</Option>
          </Select>
        </Form.Item>,
        
        <Form.Item
          key="autoBlock"
          name="autoBlock"
          label="自动拦截"
          initialValue={true}
        >
          <Select>
            <Option value={true}>是</Option>
            <Option value={false}>否</Option>
          </Select>
        </Form.Item>
      ];
    }
  };
  
  return (
    <Modal
      title={`${isEdit ? '编辑' : '添加'}${type === 'whitelist' ? '白名单' : '黑名单'}条目`}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        preserve={false}
      >
        {getFieldsByType()}
        
        <Form.Item
          name="tags"
          label="标签"
        >
          <Select
            mode="tags"
            placeholder="添加标签（可选）"
            tokenSeparators={[',']}
          >
            <Option value="VIP">VIP</Option>
            <Option value="高价值">高价值</Option>
            <Option value="可疑">可疑</Option>
            <Option value="垃圾">垃圾</Option>
            <Option value="测试">测试</Option>
          </Select>
        </Form.Item>
        
        <Form.Item
          name="notes"
          label="备注"
        >
          <TextArea rows={2} placeholder="其他说明信息" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

/**
 * 批量导入模态框
 */
const BatchImportModal: React.FC<{
  visible: boolean;
  type: ListType;
  onImport: (data: any[]) => void;
  onCancel: () => void;
  loading?: boolean;
}> = ({ visible, type, onImport, onCancel, loading }) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  
  const handleFileChange = ({ fileList }: any) => {
    setFileList(fileList);
    
    if (fileList.length > 0 && fileList[0].originFileObj) {
      const file = fileList[0].originFileObj;
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          
          // 简单的CSV解析
          const data = lines.slice(1).map((line, index) => {
            const [identifier, identifierType, reason, ...rest] = line.split(',');
            return {
              identifier: identifier?.trim(),
              identifierType: identifierType?.trim() || 'phone',
              reason: reason?.trim() || '批量导入',
              tags: rest.length > 0 ? rest.join(',').split(',').map(t => t.trim()) : []
            };
          }).filter(item => item.identifier);
          
          setPreviewData(data);
        } catch (error) {
          message.error('文件解析失败，请检查格式');
          setPreviewData([]);
        }
      };
      
      reader.readAsText(file);
    } else {
      setPreviewData([]);
    }
  };
  
  const handleImport = () => {
    if (previewData.length > 0) {
      onImport(previewData);
      setFileList([]);
      setPreviewData([]);
    } else {
      message.warning('请先上传有效的数据文件');
    }
  };
  
  const downloadTemplate = () => {
    const template = type === 'whitelist' 
      ? 'identifier,identifierType,reason,priority,tags\n13800138000,phone,VIP客户,high,VIP\nuser123,userId,重要用户,normal,高价值'
      : 'identifier,identifierType,reason,severity,tags\n13900139000,phone,骚扰用户,high,垃圾\nspammer1,userId,垃圾账号,critical,可疑';
    
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${type === 'whitelist' ? 'whitelist' : 'blacklist'}_template.csv`;
    link.click();
  };
  
  return (
    <Modal
      title={`批量导入${type === 'whitelist' ? '白名单' : '黑名单'}`}
      open={visible}
      onOk={handleImport}
      onCancel={onCancel}
      confirmLoading={loading}
      width={800}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Alert
          message="导入说明"
          description={
            <div>
              <p>请上传CSV格式文件，包含以下字段：</p>
              <ul>
                <li>identifier: 标识符（必填）</li>
                <li>identifierType: 标识符类型（phone/userId/nickname/email/custom）</li>
                <li>reason: 原因（必填）</li>
                {type === 'whitelist' ? (
                  <li>priority: 优先级（low/normal/high/critical）</li>
                ) : (
                  <li>severity: 严重程度（low/medium/high/critical）</li>
                )}
                <li>tags: 标签（可选，用逗号分隔）</li>
              </ul>
            </div>
          }
          type="info"
          showIcon
          action={
            <Button size="small" icon={<DownloadOutlined />} onClick={downloadTemplate}>
              下载模板
            </Button>
          }
        />
        
        <Upload
          fileList={fileList}
          onChange={handleFileChange}
          beforeUpload={() => false}
          accept=".csv,.txt"
          maxCount={1}
        >
          <Button icon={<UploadOutlined />}>选择文件</Button>
        </Upload>
        
        {previewData.length > 0 && (
          <div>
            <Divider>预览数据 ({previewData.length} 条)</Divider>
            <Table
              dataSource={previewData.slice(0, 5)}
              size="small"
              pagination={false}
              columns={[
                { title: '标识符', dataIndex: 'identifier', key: 'identifier' },
                { title: '类型', dataIndex: 'identifierType', key: 'identifierType' },
                { title: '原因', dataIndex: 'reason', key: 'reason' },
                { 
                  title: '标签', 
                  dataIndex: 'tags', 
                  key: 'tags',
                  render: (tags: string[]) => (
                    <Space>
                      {tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
                    </Space>
                  )
                }
              ]}
            />
            {previewData.length > 5 && (
              <Text type="secondary">...还有 {previewData.length - 5} 条数据</Text>
            )}
          </div>
        )}
      </Space>
    </Modal>
  );
};

/**
 * 列表统计卡片
 */
const ListStatistics: React.FC<{
  whitelist: WhitelistEntry[];
  blacklist: BlacklistEntry[];
}> = ({ whitelist, blacklist }) => {
  return (
    <Row gutter={[16, 16]}>
      <Col span={6}>
        <Card style={{ background: 'var(--bg-light-base)' }}>
          <Statistic
            title={<span style={{ color: 'var(--text-inverse)' }}>白名单总数</span>}
            value={whitelist.length}
            valueStyle={{ color: '#52c41a' }}
            prefix={<UserOutlined />}
          />
        </Card>
      </Col>
      
      <Col span={6}>
        <Card style={{ background: 'var(--bg-light-base)' }}>
          <Statistic
            title={<span style={{ color: 'var(--text-inverse)' }}>黑名单总数</span>}
            value={blacklist.length}
            valueStyle={{ color: '#f5222d' }}
            prefix={<ExclamationCircleOutlined />}
          />
        </Card>
      </Col>
      
      <Col span={6}>
        <Card style={{ background: 'var(--bg-light-base)' }}>
          <Statistic
            title={<span style={{ color: 'var(--text-inverse)' }}>高优先级白名单</span>}
            value={whitelist.filter(w => w.priority === 'high' || w.priority === 'critical').length}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      
      <Col span={6}>
        <Card style={{ background: 'var(--bg-light-base)' }}>
          <Statistic
            title={<span style={{ color: 'var(--text-inverse)' }}>严重黑名单</span>}
            value={blacklist.filter(b => b.severity === 'high' || b.severity === 'critical').length}
            valueStyle={{ color: '#fa8c16' }}
          />
        </Card>
      </Col>
    </Row>
  );
};

/**
 * 主管理组件
 */
export const WhiteBlacklistManager: React.FC<WhiteBlacklistManagerProps> = ({
  whitelist,
  blacklist,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  onBatchImport,
  onExport,
  loading
}) => {
  const [activeTab, setActiveTab] = useState<'whitelist' | 'blacklist'>('whitelist');
  const [modalVisible, setModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WhitelistEntry | BlacklistEntry | null>(null);
  
  const handleAdd = () => {
    setEditingEntry(null);
    setModalVisible(true);
  };
  
  const handleEdit = (entry: WhitelistEntry | BlacklistEntry) => {
    setEditingEntry(entry);
    setModalVisible(true);
  };
  
  const handleModalOk = async (values: any) => {
    try {
      if (editingEntry) {
        await onUpdateEntry(activeTab, editingEntry.id, values);
        message.success('更新成功');
      } else {
        await onAddEntry(activeTab, values);
        message.success('添加成功');
      }
      setModalVisible(false);
      setEditingEntry(null);
    } catch (error) {
      message.error('操作失败');
    }
  };
  
  const handleDelete = async (id: string) => {
    try {
      await onDeleteEntry(activeTab, id);
      message.success('删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  };
  
  const handleBatchImport = async (data: any[]) => {
    try {
      await onBatchImport(activeTab, data);
      message.success(`成功导入 ${data.length} 条数据`);
      setImportModalVisible(false);
    } catch (error) {
      message.error('导入失败');
    }
  };
  
  const getColumns = () => {
    const commonColumns = [
      {
        title: '标识符',
        dataIndex: 'identifier',
        key: 'identifier',
        width: 150,
        render: (text: string, record: any) => (
          <div>
            <Text strong style={{ color: 'var(--text-inverse)' }}>{text}</Text>
            <br />
            <Tag>{record.identifierType}</Tag>
          </div>
        )
      },
      {
        title: '原因',
        dataIndex: 'reason',
        key: 'reason',
        ellipsis: true,
        render: (text: string) => (
          <Tooltip title={text}>
            <span style={{ color: 'var(--text-inverse)' }}>{text}</span>
          </Tooltip>
        )
      },
      {
        title: '标签',
        dataIndex: 'tags',
        key: 'tags',
        width: 150,
        render: (tags: string[] = []) => (
          <Space wrap>
            {tags.map(tag => (
                                    <Tag key={tag}>{tag}</Tag>
            ))}
          </Space>
        )
      },
      {
        title: '创建时间',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 120,
        render: (date: Date) => date.toLocaleDateString()
      },
      {
        title: '操作',
        key: 'actions',
        width: 120,
        render: (record: WhitelistEntry | BlacklistEntry) => (
          <Space>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
            <Popconfirm
              title="确定要删除这个条目吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
              >
                删除
              </Button>
            </Popconfirm>
          </Space>
        )
      }
    ];
    
    if (activeTab === 'whitelist') {
      return [
        ...commonColumns.slice(0, 2),
        {
          title: '优先级',
          dataIndex: 'priority',
          key: 'priority',
          width: 100,
          render: (priority: string) => {
            const colorMap = {
              low: 'default',
              normal: 'blue',
              high: 'orange',
              critical: 'red'
            };
            return <Tag color={colorMap[priority as keyof typeof colorMap]}>{priority}</Tag>;
          }
        },
        ...commonColumns.slice(2)
      ];
    } else {
      return [
        ...commonColumns.slice(0, 2),
        {
          title: '严重程度',
          dataIndex: 'severity',
          key: 'severity',
          width: 100,
          render: (severity: string) => {
            const colorMap = {
              low: 'green',
              medium: 'orange',
              high: 'red',
              critical: 'purple'
            };
            return <Tag color={colorMap[severity as keyof typeof colorMap]}>{severity}</Tag>;
          }
        },
        {
          title: '自动拦截',
          dataIndex: 'autoBlock',
          key: 'autoBlock',
          width: 100,
          render: (autoBlock: boolean) => (
            <Badge 
              status={autoBlock ? 'success' : 'default'} 
              text={autoBlock ? '是' : '否'} 
            />
          )
        },
        ...commonColumns.slice(2)
      ];
    }
  };
  
  const currentData = activeTab === 'whitelist' ? whitelist : blacklist;
  
  return (
    <div className="light-theme-force" style={{ background: 'var(--bg-light-base)' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 统计卡片 */}
        <ListStatistics whitelist={whitelist} blacklist={blacklist} />
        
        {/* 主表格卡片 */}
        <Card
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Button.Group>
                  <Button 
                    type={activeTab === 'whitelist' ? 'primary' : 'default'}
                    onClick={() => setActiveTab('whitelist')}
                  >
                    白名单 ({whitelist.length})
                  </Button>
                  <Button 
                    type={activeTab === 'blacklist' ? 'primary' : 'default'}
                    onClick={() => setActiveTab('blacklist')}
                  >
                    黑名单 ({blacklist.length})
                  </Button>
                </Button.Group>
              </div>
              
              <Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAdd}
                >
                  添加条目
                </Button>
                <Button
                  icon={<UploadOutlined />}
                  onClick={() => setImportModalVisible(true)}
                >
                  批量导入
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => onExport(activeTab)}
                >
                  导出
                </Button>
              </Space>
            </div>
          }
          style={{ background: 'var(--bg-light-base)' }}
        >
          <Table
            columns={getColumns()}
            dataSource={currentData}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`
            }}
            locale={{ emptyText: `暂无${activeTab === 'whitelist' ? '白名单' : '黑名单'}数据` }}
          />
        </Card>
      </Space>
      
      {/* 添加/编辑模态框 */}
      <EntryModal
        visible={modalVisible}
        type={activeTab}
        entry={editingEntry}
        onOk={handleModalOk}
        onCancel={() => {
          setModalVisible(false);
          setEditingEntry(null);
        }}
        loading={loading}
      />
      
      {/* 批量导入模态框 */}
      <BatchImportModal
        visible={importModalVisible}
        type={activeTab}
        onImport={handleBatchImport}
        onCancel={() => setImportModalVisible(false)}
        loading={loading}
      />
    </div>
  );
};