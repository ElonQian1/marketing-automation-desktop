// src/components/smart/SmartAppList.tsx
// module: smart | layer: ui | role: app-list
// summary: 智能应用选择器的应用列表组件

import React from 'react';
import { Spin, Empty, List, Button, Avatar, Space, Typography, Tag, Popconfirm, message } from 'antd';
import { StarOutlined, SettingOutlined, AppstoreOutlined, DeleteOutlined } from '@ant-design/icons';
import { AppInfo } from '../../types/smartComponents';
import { smartAppService } from '../../services/smart-app-service';
import { appRegistryService } from '../../services/app-registry-service';

const { Text } = Typography;

export interface SmartAppListProps {
  loading: boolean;
  total: number;
  apps: AppInfo[];
  selectedApp?: AppInfo | null;
  onSelect: (app: AppInfo) => void;
  icons: Record<string, string | null>;
  searchQuery: string;
  activeTab: string;
  onAppsChanged?: () => void;
}

export const SmartAppList: React.FC<SmartAppListProps> = ({
  loading,
  total,
  apps,
  selectedApp,
  onSelect,
  icons,
  searchQuery,
  activeTab,
  onAppsChanged
}) => {

  const getAppIcon = (app: AppInfo) => {
    if (smartAppService.isPopularApp(app.package_name)) {
      return <StarOutlined style={{ color: '#faad14' }} />;
    }
    
    if (app.is_system_app) {
      return <SettingOutlined style={{ color: '#722ed1' }} />;
    }
    
    return <AppstoreOutlined style={{ color: '#1890ff' }} />;
  };

  const handleForgetApp = (e: React.MouseEvent, app: AppInfo) => {
    e.stopPropagation();
    appRegistryService.forgetApp(app.package_name);
    message.success(`已移除应用: ${app.app_name}`);
    onAppsChanged?.();
  };

  return (
    <Spin spinning={loading} tip={`正在扫描应用... (${total})`}>
      {apps.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            searchQuery ? '没有找到匹配的应用' : '没有可用的应用'
          }
        />
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={apps}
          style={{ maxHeight: '400px', overflowY: 'auto' }}
          renderItem={(app) => (
            <List.Item
              actions={[
                <Button 
                  type="primary" 
                  size="small"
                  onClick={(e) => { e.stopPropagation(); onSelect(app); }}
                >
                  选择
                </Button>,
                (activeTab === 'library' && app.source === 'learned') && (
                  <Popconfirm
                    title="确定要移除这个已学习的应用吗？"
                    onConfirm={(e) => e && handleForgetApp(e, app)}
                    onCancel={(e) => e?.stopPropagation()}
                    okText="移除"
                    cancelText="取消"
                  >
                    <Button 
                      type="text" 
                      danger 
                      size="small" 
                      icon={<DeleteOutlined />}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>
                )
              ]}
              style={{
                cursor: 'pointer',
                backgroundColor: selectedApp?.package_name === app.package_name ? '#f0f8ff' : undefined
              }}
              onClick={() => onSelect(app)}
            >
              <List.Item.Meta
                avatar={
                  <Avatar 
                    src={icons[app.package_name] || undefined}
                    icon={!icons[app.package_name] ? getAppIcon(app) : undefined}
                    style={{
                      backgroundColor: app.is_system_app ? 'var(--bg-elevated)' : 'var(--brand-100)'
                    }}
                  />
                }
                title={
                  <Space>
                    <Text strong>{app.app_name}</Text>
                    {smartAppService.isPopularApp(app.package_name) && (
                      <Tag color="orange" icon={<StarOutlined />}>
                        热门
                      </Tag>
                    )}
                    {app.is_system_app && (
                      <Tag color="purple">
                        系统
                      </Tag>
                    )}
                    {!app.is_enabled && (
                      <Tag color="red">
                        已禁用
                      </Tag>
                    )}
                    {activeTab === 'library' && (
                       <Tag color={app.source === 'preset' ? 'blue' : 'cyan'}>
                         {app.source === 'preset' ? '预设' : '已学习'}
                       </Tag>
                    )}
                  </Space>
                }
                description={
                  <div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {app.package_name}
                    </Text>
                    {app.version_name && (
                      <Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>
                        v{app.version_name}
                      </Text>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Spin>
  );
};
