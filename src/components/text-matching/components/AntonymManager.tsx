// src/components/text-matching/components/AntonymManager.tsx
// module: text-matching | layer: ui | role: 反义词管理组件
// summary: 用户可以维护反义词对的完整管理界面

import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Switch,
  Select,
  Tag,
  Popconfirm,
  message,
  Upload,
  Typography,
  Alert,
  Tooltip,
  Divider
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  DownloadOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  StopOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import { useAntonymManager } from '../hooks/useAntonymManager';
import type { AntonymPair } from '../types';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface AntonymManagerProps {
  className?: string;
  compact?: boolean;
}

export const AntonymManager: React.FC<AntonymManagerProps> = ({
  className,
  compact = false
}) => {
  const {
    antonymPairs,
    loading,
    addAntonymPair,
    updateAntonymPair,
    deleteAntonymPair,
    toggleAntonymPair,
    importAntonymPairs,
    exportAntonymPairs,
    resetToDefault,
    saveToBackend
  } = useAntonymManager();

  const [editingPair, setEditingPair] = useState<AntonymPair | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  // 表格列定义
  const columns: ColumnsType<AntonymPair> = [
    {
      title: '正面词',
      dataIndex: 'positive',
      key: 'positive',
      width: 120,
      render: (text: string) => (
        <Tag color="blue" style={{ margin: 0 }}>
          {text}
        </Tag>
      )
    },
    {
      title: '反面词',
      dataIndex: 'negative',
      key: 'negative',
      width: 120,
      render: (text: string) => (
        <Tag color="red" style={{ margin: 0 }}>
          {text}
        </Tag>
      )
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: string) => category || '-'
    },
    {
      title: '置信度',
      dataIndex: 'confidence',
      key: 'confidence',
      width: 80,
      render: (confidence: number) => (
        <span style={{ color: confidence >= 0.9 ? '#52c41a' : confidence >= 0.7 ? '#faad14' : '#ff4d4f' }}>
          {(confidence * 100).toFixed(0)}%
        </span>
      )
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 80,
      render: (enabled: boolean, record: AntonymPair) => (
        <Switch
          size="small"
          checked={enabled}
          onChange={() => toggleAntonymPair(record.id)}
        />
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record: AntonymPair) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个反义词对吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                danger
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 处理新增/编辑
  const handleEdit = (pair?: AntonymPair) => {
    setEditingPair(pair || null);
    setModalVisible(true);
    if (pair) {
      form.setFieldsValue(pair);
    } else {
      form.resetFields();
    }
  };

  // 处理保存
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingPair) {
        updateAntonymPair(editingPair.id, values);
        message.success('反义词对已更新');
      } else {
        addAntonymPair(values);
        message.success('反义词对已添加');
      }
      setModalVisible(false);
      setEditingPair(null);
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  // 处理删除
  const handleDelete = (id: string) => {
    deleteAntonymPair(id);
    message.success('反义词对已删除');
  };

  // 处理导出
  const handleExport = () => {
    const dataStr = exportAntonymPairs();
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `antonym-pairs-${new Date().getTime()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    message.success('反义词配置已导出');
  };

  // 处理导入
  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (Array.isArray(data)) {
          importAntonymPairs(data);
          message.success('反义词配置已导入');
        } else {
          message.error('文件格式不正确');
        }
      } catch (error) {
        message.error('文件解析失败');
      }
    };
    reader.readAsText(file);
    return false; // 阻止自动上传
  };

  // 处理保存到后端
  const handleSaveToBackend = async () => {
    try {
      await saveToBackend();
      message.success('配置已保存到后端');
    } catch (error) {
      message.error('保存失败，请稍后重试');
    }
  };

  if (compact) {
    return (
      <Card className={className} size="small" title="反义词管理（简化版）">
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text>共 {antonymPairs.length} 个反义词对，已启用 {antonymPairs.filter(p => p.enabled).length} 个</Text>
            <Button size="small" type="primary" onClick={() => handleEdit()}>
              添加
            </Button>
          </div>
          <Table
            columns={columns}
            dataSource={antonymPairs}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 5, simple: true }}
            loading={loading}
          />
        </Space>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 页面标题和统计 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>反义词对管理</Title>
            <Text type="secondary">
              管理文本匹配中使用的反义词对，提高智能匹配的准确性
            </Text>
          </div>
          <Space>
            <Tag color="blue">总计: {antonymPairs.length}</Tag>
            <Tag color="green">已启用: {antonymPairs.filter(p => p.enabled).length}</Tag>
          </Space>
        </div>

        {/* 操作按钮 */}
        <Card size="small" className="light-theme-force">
          <Space wrap>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleEdit()}
            >
              添加反义词对
            </Button>
            <Button
              icon={<UploadOutlined />}
              onClick={() => document.getElementById('import-file')?.click()}
            >
              导入配置
            </Button>
            <input
              id="import-file"
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImport(file);
              }}
            />
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
            >
              导出配置
            </Button>
            <Divider type="vertical" />
            <Button
              icon={<ReloadOutlined />}
              onClick={resetToDefault}
            >
              重置为默认
            </Button>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={loading}
              onClick={handleSaveToBackend}
            >
              保存配置
            </Button>
          </Space>
        </Card>

        {/* 使用说明 */}
        <Alert
          type="info"
          showIcon
          message="使用说明"
          description={
            <div>
              <p>反义词对用于智能文本匹配中的反义关系检测：</p>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>当系统检测到目标文本与候选文本存在反义关系时，会降低匹配置信度</li>
                <li>只有启用状态的反义词对才会参与检测</li>
                <li>置信度越高的反义词对对匹配结果影响越大</li>
                <li>可以按类别组织反义词对，便于管理</li>
              </ul>
            </div>
          }
        />

        {/* 反义词对表格 */}
        <Card className="light-theme-force">
          <Table
            columns={columns}
            dataSource={antonymPairs}
            rowKey="id"
            loading={loading}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
            }}
          />
        </Card>

        {/* 新增/编辑模态框 */}
        <Modal
          title={editingPair ? '编辑反义词对' : '添加反义词对'}
          open={modalVisible}
          onOk={handleSave}
          onCancel={() => {
            setModalVisible(false);
            setEditingPair(null);
          }}
          okText="保存"
          cancelText="取消"
          destroyOnClose
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              enabled: true,
              confidence: 0.8,
              category: '通用操作'
            }}
          >
            <Form.Item
              name="positive"
              label="正面词"
              rules={[{ required: true, message: '请输入正面词' }]}
            >
              <Input placeholder="例如：关注、同意、开启" />
            </Form.Item>

            <Form.Item
              name="negative"
              label="反面词"
              rules={[{ required: true, message: '请输入反面词' }]}
            >
              <Input placeholder="例如：取消关注、拒绝、关闭" />
            </Form.Item>

            <Form.Item
              name="category"
              label="类别"
            >
              <Select placeholder="选择或输入类别">
                <Select.Option value="社交操作">社交操作</Select.Option>
                <Select.Option value="确认操作">确认操作</Select.Option>
                <Select.Option value="开关操作">开关操作</Select.Option>
                <Select.Option value="身份验证">身份验证</Select.Option>
                <Select.Option value="电商操作">电商操作</Select.Option>
                <Select.Option value="通用操作">通用操作</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="confidence"
              label="置信度"
            >
              <Select>
                <Select.Option value={0.95}>95% - 非常确定</Select.Option>
                <Select.Option value={0.90}>90% - 确定</Select.Option>
                <Select.Option value={0.80}>80% - 较为确定</Select.Option>
                <Select.Option value={0.70}>70% - 一般</Select.Option>
                <Select.Option value={0.60}>60% - 不太确定</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="description"
              label="描述"
            >
              <TextArea
                placeholder="简要描述这对反义词的使用场景"
                rows={2}
              />
            </Form.Item>

            <Form.Item
              name="enabled"
              valuePropName="checked"
              label="启用状态"
            >
              <Switch />
            </Form.Item>
          </Form>
        </Modal>
      </Space>
    </div>
  );
};