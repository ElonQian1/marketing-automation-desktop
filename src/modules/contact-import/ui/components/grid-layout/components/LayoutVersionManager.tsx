import React, { useState, useCallback } from 'react';
import {
  Modal, Button, List, Space, Typography, Popconfirm, message,
  Input, Form, Tag, Upload, Divider, Tooltip, Badge
} from 'antd';
import {
  SaveOutlined, DeleteOutlined, DownloadOutlined, UploadOutlined,
  StarOutlined, StarFilled, EditOutlined, CheckOutlined, CloseOutlined
} from '@ant-design/icons';
import { LayoutVersion, useLayoutVersions } from '../hooks/useLayoutVersions';

const { Text, Title } = Typography;
const { TextArea } = Input;

export interface LayoutVersionManagerProps {
  visible: boolean;
  onClose: () => void;
  currentPanels: any[];
  onVersionSwitch?: (version: LayoutVersion) => void;
}

export const LayoutVersionManager: React.FC<LayoutVersionManagerProps> = ({
  visible,
  onClose,
  currentPanels,
  onVersionSwitch
}) => {
  const {
    versions,
    currentVersion,
    createVersion,
    updateVersion,
    deleteVersion,
    switchVersion,
    setDefaultVersion,
    exportVersion,
    importVersion
  } = useLayoutVersions();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm] = Form.useForm();
  const [saveForm] = Form.useForm();
  const [saveModalVisible, setSaveModalVisible] = useState(false);

  // 保存当前布局为新版本
  const handleSaveVersion = useCallback(async () => {
    try {
      const values = await saveForm.validateFields();
      const tags = values.tags ? values.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [];
      
      createVersion(currentPanels, values.name, values.description, tags);
      message.success('布局版本保存成功');
      setSaveModalVisible(false);
      saveForm.resetFields();
    } catch (error) {
      console.error('Save version failed:', error);
    }
  }, [currentPanels, createVersion, saveForm]);

  // 切换到指定版本
  const handleSwitchVersion = useCallback((version: LayoutVersion) => {
    const switchedVersion = switchVersion(version.id);
    if (switchedVersion) {
      onVersionSwitch?.(switchedVersion);
      message.success(`已切换到版本：${version.name}`);
    }
  }, [switchVersion, onVersionSwitch]);

  // 开始编辑版本
  const handleStartEdit = useCallback((version: LayoutVersion) => {
    setEditingId(version.id);
    editForm.setFieldsValue({
      name: version.name,
      description: version.description,
      tags: version.tags?.join(', ') || ''
    });
  }, [editForm]);

  // 保存编辑
  const handleSaveEdit = useCallback(async () => {
    if (!editingId) return;

    try {
      const values = await editForm.validateFields();
      const tags = values.tags ? values.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [];
      
      updateVersion(editingId, {
        name: values.name,
        description: values.description,
        tags
      });
      
      setEditingId(null);
      message.success('版本信息更新成功');
    } catch (error) {
      console.error('Update version failed:', error);
    }
  }, [editingId, editForm, updateVersion]);

  // 文件导入处理
  const handleImport = useCallback(async (file: File) => {
    try {
      const importedVersion = await importVersion(file);
      message.success(`导入版本成功：${importedVersion.name}`);
    } catch (error) {
      message.error(`导入失败：${error instanceof Error ? error.message : '未知错误'}`);
    }
    return false; // 阻止默认上传行为
  }, [importVersion]);

  // 删除版本
  const handleDelete = useCallback((versionId: string) => {
    deleteVersion(versionId);
    message.success('版本删除成功');
  }, [deleteVersion]);

  // 设置默认版本
  const handleSetDefault = useCallback((versionId: string) => {
    setDefaultVersion(versionId);
    message.success('默认版本设置成功');
  }, [setDefaultVersion]);

  return (
    <>
      <Modal
        title="布局版本管理"
        open={visible}
        onCancel={onClose}
        width={800}
        footer={[
          <Button key="save" type="primary" icon={<SaveOutlined />} onClick={() => setSaveModalVisible(true)}>
            保存当前布局
          </Button>,
          <Upload
            key="import"
            accept=".json"
            showUploadList={false}
            beforeUpload={handleImport}
          >
            <Button icon={<UploadOutlined />}>导入版本</Button>
          </Upload>,
          <Button key="close" onClick={onClose}>
            关闭
          </Button>
        ]}
      >
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <List
            dataSource={versions}
            locale={{ emptyText: '暂无保存的布局版本' }}
            renderItem={(version) => (
              <List.Item
                key={version.id}
                actions={[
                  <Tooltip title={version.isDefault ? '取消默认' : '设为默认'} key="default">
                    <Button
                      type="text"
                      icon={version.isDefault ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                      onClick={() => handleSetDefault(version.id)}
                    />
                  </Tooltip>,
                  editingId === version.id ? (
                    <Space key="edit-actions">
                      <Button type="text" icon={<CheckOutlined />} onClick={handleSaveEdit} />
                      <Button type="text" icon={<CloseOutlined />} onClick={() => setEditingId(null)} />
                    </Space>
                  ) : (
                    <Button
                      key="edit"
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => handleStartEdit(version)}
                    />
                  ),
                  <Button
                    key="export"
                    type="text"
                    icon={<DownloadOutlined />}
                    onClick={() => exportVersion(version.id)}
                  />,
                  <Popconfirm
                    key="delete"
                    title="确定要删除这个版本吗？"
                    onConfirm={() => handleDelete(version.id)}
                    disabled={versions.length <= 1}
                  >
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      disabled={versions.length <= 1}
                    />
                  </Popconfirm>
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      {editingId === version.id ? (
                        <Form form={editForm} layout="inline" style={{ flex: 1 }}>
                          <Form.Item name="name" style={{ marginBottom: 0, flex: 1 }}>
                            <Input placeholder="版本名称" />
                          </Form.Item>
                        </Form>
                      ) : (
                        <>
                          <Text strong>{version.name}</Text>
                          {currentVersion?.id === version.id && <Badge status="processing" text="当前" />}
                          {version.isDefault && <Tag color="gold">默认</Tag>}
                        </>
                      )}
                    </Space>
                  }
                  description={
                    editingId === version.id ? (
                      <Form form={editForm} style={{ marginTop: 8 }}>
                        <Form.Item name="description" style={{ marginBottom: 8 }}>
                          <TextArea placeholder="版本描述" rows={2} />
                        </Form.Item>
                        <Form.Item name="tags" style={{ marginBottom: 0 }}>
                          <Input placeholder="标签（用逗号分隔）" />
                        </Form.Item>
                      </Form>
                    ) : (
                      <Space direction="vertical" size="small">
                        {version.description && <Text type="secondary">{version.description}</Text>}
                        <Space size="small">
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            创建：{new Date(version.createdAt).toLocaleString()}
                          </Text>
                          {version.updatedAt !== version.createdAt && (
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              更新：{new Date(version.updatedAt).toLocaleString()}
                            </Text>
                          )}
                        </Space>
                        {version.tags && version.tags.length > 0 && (
                          <Space>
                            {version.tags.map(tag => (
                              <Tag key={tag}>{tag}</Tag>
                            ))}
                          </Space>
                        )}
                      </Space>
                    )
                  }
                />
                {currentVersion?.id !== version.id && (
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => handleSwitchVersion(version)}
                  >
                    应用
                  </Button>
                )}
              </List.Item>
            )}
          />
        </div>
      </Modal>

      {/* 保存新版本对话框 */}
      <Modal
        title="保存当前布局"
        open={saveModalVisible}
        onOk={handleSaveVersion}
        onCancel={() => setSaveModalVisible(false)}
        width={500}
      >
        <Form form={saveForm} layout="vertical">
          <Form.Item
            name="name"
            label="版本名称"
            rules={[{ required: true, message: '请输入版本名称' }]}
          >
            <Input placeholder="例如：工作台布局 v1.0" />
          </Form.Item>
          
          <Form.Item name="description" label="版本描述">
            <TextArea 
              rows={3} 
              placeholder="简要描述这个布局版本的特点和用途..." 
            />
          </Form.Item>
          
          <Form.Item name="tags" label="标签">
            <Input placeholder="例如：工作台,主要,测试（用逗号分隔）" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};