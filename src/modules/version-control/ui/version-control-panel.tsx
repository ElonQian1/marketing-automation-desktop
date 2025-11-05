// src/modules/version-control/ui/version-control-panel.tsx
// module: version-control | layer: ui | role: 版本控制主面板组件
// summary: 版本控制系统的主要UI界面，包含版本列表、分支管理和基本操作

import React, { useState } from 'react';
import { Card, Button, List, Tag, Space, Modal, Form, Input, Select, message, Tooltip } from 'antd';
import {
  BranchesOutlined,
  PlusOutlined,
  SwapOutlined,
  DiffOutlined,
  DeleteOutlined,
  SaveOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useVersionControl } from '../hooks/use-version-control';
import type { VersionInfo, CreateVersionRequest, CreateBranchRequest } from '../domain/types';

interface VersionControlPanelProps {
  className?: string;
  xmlContent?: string; // 当前XML内容，用于创建新版本
}

export const VersionControlPanel: React.FC<VersionControlPanelProps> = ({
  className,
  xmlContent = '',
}) => {
  const {
    branches,
    currentBranch,
    currentVersion,
    isLoading,
    error,
    createVersion,
    switchToVersion,
    createBranch,
    switchBranch,
    deleteVersion,
    getVersions,
  } = useVersionControl();

  const [createVersionModal, setCreateVersionModal] = useState(false);
  const [createBranchModal, setCreateBranchModal] = useState(false);
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  const [form] = Form.useForm();

  // 加载版本列表
  const handleLoadVersions = async () => {
    try {
      setLoadingVersions(true);
      const versionList = await getVersions();
      setVersions(versionList);
    } catch (error) {
      message.error('加载版本列表失败');
    } finally {
      setLoadingVersions(false);
    }
  };

  // 创建版本
  const handleCreateVersion = async (values: { description: string }) => {
    if (!xmlContent) {
      message.warning('没有可保存的XML内容');
      return;
    }

    try {
      const request: CreateVersionRequest = {
        xmlContent,
        description: values.description,
      };

      await createVersion(request);
      message.success('版本创建成功');
      setCreateVersionModal(false);
      form.resetFields();
      
      // 刷新版本列表
      if (versions.length > 0) {
        await handleLoadVersions();
      }
    } catch (error) {
      message.error('创建版本失败');
    }
  };

  // 创建分支
  const handleCreateBranch = async (values: { branchName: string; fromVersion?: string }) => {
    try {
      const request: CreateBranchRequest = {
        branchName: values.branchName,
        fromVersion: values.fromVersion,
      };

      await createBranch(request);
      message.success('分支创建成功');
      setCreateBranchModal(false);
      form.resetFields();
    } catch (error) {
      message.error('创建分支失败');
    }
  };

  // 切换版本
  const handleSwitchVersion = async (versionId: string) => {
    try {
      await switchToVersion(versionId);
      message.success('版本切换成功');
    } catch (error) {
      message.error('切换版本失败');
    }
  };

  // 切换分支
  const handleSwitchBranch = async (branchName: string) => {
    try {
      await switchBranch(branchName);
      message.success(`切换到分支: ${branchName}`);
    } catch (error) {
      message.error('切换分支失败');
    }
  };

  // 删除版本
  const handleDeleteVersion = (versionId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个版本吗？此操作不可恢复。',
      onOk: async () => {
        try {
          await deleteVersion(versionId);
          message.success('版本删除成功');
          await handleLoadVersions();
        } catch (error) {
          message.error('删除版本失败');
        }
      },
    });
  };

  // 格式化时间戳
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  return (
    <div className={`light-theme-force ${className || ''}`}>
      <Card
        title={
          <Space>
            <BranchesOutlined />
            版本控制
            {currentBranch && <Tag color="blue">分支: {currentBranch}</Tag>}
            {currentVersion && <Tag color="green">版本: {currentVersion.slice(0, 8)}</Tag>}
          </Space>
        }
        extra={
          <Space>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={() => setCreateVersionModal(true)}
              disabled={!xmlContent || isLoading}
            >
              保存版本
            </Button>
            <Button
              icon={<PlusOutlined />}
              onClick={() => setCreateBranchModal(true)}
              disabled={isLoading}
            >
              创建分支
            </Button>
          </Space>
        }
        loading={isLoading}
      >
        {error && (
          <div style={{ color: 'var(--text-error, #ef4444)', marginBottom: 16 }}>
            错误: {error}
          </div>
        )}

        {/* 分支列表 */}
        <Card size="small" title="分支管理" style={{ marginBottom: 16 }}>
          <Space wrap>
            {branches.map(branch => (
              <Tag
                key={branch.name}
                color={branch.name === currentBranch ? 'blue' : 'default'}
                style={{ cursor: 'pointer', padding: '4px 8px' }}
                onClick={() => handleSwitchBranch(branch.name)}
              >
                <BranchesOutlined /> {branch.name}
                {branch.versions.length > 0 && ` (${branch.versions.length})`}
              </Tag>
            ))}
          </Space>
        </Card>

        {/* 版本操作 */}
        <Card size="small" title="版本操作">
          <Space>
            <Button
              icon={<HistoryOutlined />}
              onClick={handleLoadVersions}
              loading={loadingVersions}
            >
              查看版本历史
            </Button>
            <Button icon={<DiffOutlined />} disabled>
              比较版本 (开发中)
            </Button>
            <Button icon={<SwapOutlined />} disabled>
              合并分支 (开发中)
            </Button>
          </Space>

          {/* 版本列表 */}
          {versions.length > 0 && (
            <List
              style={{ marginTop: 16 }}
              size="small"
              dataSource={versions}
              renderItem={version => (
                <List.Item
                  actions={[
                    <Tooltip title="切换到此版本">
                      <Button
                        type="link"
                        size="small"
                        icon={<SwapOutlined />}
                        onClick={() => handleSwitchVersion(version.id)}
                        disabled={version.id === currentVersion}
                      />
                    </Tooltip>,
                    <Tooltip title="删除版本">
                      <Button
                        type="link"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteVersion(version.id)}
                        disabled={version.id === currentVersion}
                      />
                    </Tooltip>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <code>{version.id.slice(0, 8)}</code>
                        {version.id === currentVersion && <Tag color="green">当前</Tag>}
                        <span>{version.description}</span>
                      </Space>
                    }
                    description={
                      <Space size="large">
                        <span>时间: {formatTimestamp(version.timestamp)}</span>
                        <span>大小: {(version.size / 1024).toFixed(1)} KB</span>
                        <span>路径: {version.xmlPath}</span>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>

        {/* 创建版本模态框 */}
        <Modal
          title="创建新版本"
          open={createVersionModal}
          onCancel={() => setCreateVersionModal(false)}
          onOk={() => form.submit()}
          okText="创建"
          cancelText="取消"
        >
          <Form form={form} onFinish={handleCreateVersion} layout="vertical">
            <Form.Item
              name="description"
              label="版本描述"
              rules={[{ required: true, message: '请输入版本描述' }]}
            >
              <Input.TextArea 
                placeholder="描述这个版本的变更内容..."
                rows={3}
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* 创建分支模态框 */}
        <Modal
          title="创建新分支"
          open={createBranchModal}
          onCancel={() => setCreateBranchModal(false)}
          onOk={() => form.submit()}
          okText="创建"
          cancelText="取消"
        >
          <Form form={form} onFinish={handleCreateBranch} layout="vertical">
            <Form.Item
              name="branchName"
              label="分支名称"
              rules={[{ required: true, message: '请输入分支名称' }]}
            >
              <Input placeholder="输入新分支名称..." />
            </Form.Item>
            <Form.Item
              name="fromVersion"
              label="基于版本"
            >
              <Select placeholder="选择基于的版本 (可选)" allowClear>
                {versions.map(version => (
                  <Select.Option key={version.id} value={version.id}>
                    {version.id.slice(0, 8)} - {version.description}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};