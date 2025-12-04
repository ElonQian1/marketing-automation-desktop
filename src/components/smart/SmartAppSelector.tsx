// src/components/smart/SmartAppSelector.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Tabs, Card, Row, Col, Button, Space, Typography, Alert, Form, message, Input, Empty, Tag } from 'antd';
import { RocketOutlined, MobileOutlined, HistoryOutlined, EditOutlined, CheckCircleOutlined, AppstoreOutlined, StarOutlined } from '@ant-design/icons';
import { listen } from '@tauri-apps/api/event';
import { smartAppService } from '../../services/smart-app-service';
import { appRegistryService } from '../../services/app-registry-service';
import { AppInfo } from '../../types/smartComponents';
import { useOverlayTheme } from '../ui/overlay';
import { SmartAppFilterBar } from './SmartAppFilterBar';
import { SmartAppList } from './SmartAppList';

const { TabPane } = Tabs;

export interface SmartAppSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (app: AppInfo) => void;
  deviceId?: string;
  selectedApp?: AppInfo | null;
}

const HISTORY_STORAGE_KEY = 'smart_app_selector_history';

export const SmartAppSelector: React.FC<SmartAppSelectorProps> = ({
  visible,
  onClose,
  onSelect,
  deviceId,
  selectedApp
}) => {
  // 统一该组件内部所有下拉的弹层主题为暗色（黑底白字）
  const { popupProps } = useOverlayTheme('dark');
  const [activeTab, setActiveTab] = useState<string>('library'); // 默认显示应用库
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [libraryApps, setLibraryApps] = useState<AppInfo[]>([]); // 全局应用库
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'user' | 'system'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('enabled');
  const [viewMode, setViewMode] = useState<'popular' | 'all' | 'search'>('popular');
  const [icons, setIcons] = useState<Record<string, string | null>>({});
  const [iconLoadingSet, setIconLoadingSet] = useState<Set<string>>(new Set());
  const [refreshStrategy, setRefreshStrategy] = useState<'cache_first' | 'force_refresh'>('cache_first');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(60);
  const [total, setTotal] = useState(0);

  // 历史记录状态
  const [historyApps, setHistoryApps] = useState<AppInfo[]>([]);
  
  // 手动输入表单
  const [manualForm] = Form.useForm();

  // 初始化：加载应用库
  useEffect(() => {
    if (visible) {
      const allKnownApps = appRegistryService.getAllApps();
      setLibraryApps(allKnownApps);
      // 如果没有连接设备，默认显示库中的应用
      if (!deviceId) {
        setApps(allKnownApps);
      }
    }
  }, [visible, deviceId]);

  // 加载历史记录
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        setHistoryApps(JSON.parse(stored));
      }
    } catch (e) {
      console.error('读取历史记录失败', e);
    }
  }, []);

  // 保存历史记录
  const saveToHistory = (app: AppInfo) => {
    try {
      const newHistory = [app, ...historyApps.filter(h => h.package_name !== app.package_name)].slice(0, 20);
      setHistoryApps(newHistory);
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
    } catch (e) {
      console.error('保存历史记录失败', e);
    }
  };

  // 加载设备应用（流式）
  const loadDeviceApps = React.useCallback(async () => {
    if (!deviceId) {
      // 如果在设备标签页且无设备，切回库
      if (activeTab === 'device') {
        setActiveTab('library');
      }
      return;
    }

    // 只有在设备标签页才自动扫描
    if (activeTab !== 'device') return;

    setLoading(true);
    setApps([]); // 清空列表，准备接收新数据
    // setTotal(0); // total 将随着扫描动态增加

    try {
      smartAppService.setRefreshStrategy(refreshStrategy);
      const filterMode: 'all' | 'only_user' | 'only_system' =
        categoryFilter === 'all' ? 'all' : categoryFilter === 'user' ? 'only_user' : 'only_system';
      
      // 启动流式扫描
      await smartAppService.scanDeviceApps(deviceId, filterMode);
    } catch (error) {
      message.error('启动应用扫描失败');
      console.error('启动应用扫描失败:', error);
      setLoading(false);
    }
  }, [deviceId, activeTab, refreshStrategy, categoryFilter]);

  // 监听流式事件
  useEffect(() => {
    if (!visible || !deviceId) return;

    let unlistenScanned: () => void;
    let unlistenComplete: () => void;
    let unlistenError: () => void;

    const setupListeners = async () => {
      // 监听扫描到的应用
      unlistenScanned = await listen<AppInfo>(`app-scanned://${deviceId}`, (event) => {
        const app = event.payload;
        
        // 1. 更新当前设备列表
        setApps(prev => {
          if (prev.some(a => a.package_name === app.package_name)) return prev;
          return [...prev, app];
        });
        
        // 2. 自动学习到应用库
        appRegistryService.learnApp(app);
        
        setTotal(prev => prev + 1);
      });

      // 监听扫描完成
      unlistenComplete = await listen(`scan-complete://${deviceId}`, () => {
        setLoading(false);
        // 扫描完成后刷新库列表，确保新学习的应用可见
        setLibraryApps(appRegistryService.getAllApps());
      });

      // 监听扫描错误
      unlistenError = await listen(`scan-error://${deviceId}`, (event) => {
        console.error('扫描出错:', event.payload);
        message.error('应用扫描过程中发生错误');
        setLoading(false);
      });
    };

    setupListeners();

    return () => {
      if (unlistenScanned) unlistenScanned();
      if (unlistenComplete) unlistenComplete();
      if (unlistenError) unlistenError();
    };
  }, [visible, deviceId]);

  // 初始化加载
  useEffect(() => {
    if (visible) {
      // 总是先加载库
      setLibraryApps(appRegistryService.getAllApps());
      
      // 如果没有选定标签，默认去库
      if (!activeTab) {
        setActiveTab('library');
      }
    }
  }, [visible, activeTab]);

  // 当过滤/策略/标签变化时刷新
  useEffect(() => {
    if (visible && deviceId && activeTab === 'device') {
      loadDeviceApps();
    }
  }, [categoryFilter, refreshStrategy, deviceId, visible, activeTab, loadDeviceApps]);

  // 过滤和搜索应用
  const filteredApps = useMemo(() => {
    // 根据标签页决定数据源
    let sourceApps = activeTab === 'library' ? libraryApps : apps;
    let result = [...sourceApps];

    // 按类别过滤
    if (activeTab === 'device') {
        // 设备模式下，后端已经过滤了一部分，但前端可能还需要二次过滤（如果后端只支持部分过滤）
        // 这里假设后端已经处理了 user/system 过滤，但为了保险起见，前端也保留逻辑
        result = smartAppService.filterAppsByCategory(result, categoryFilter);
    } else {
        // 库模式下，完全由前端过滤
        if (categoryFilter === 'user') {
            result = result.filter(a => !a.is_system_app);
        } else if (categoryFilter === 'system') {
            result = result.filter(a => a.is_system_app);
        }
    }
    
    // 按状态过滤
    result = smartAppService.filterAppsByStatus(result, statusFilter);

    // 搜索过滤
    if (searchQuery.trim()) {
      result = smartAppService.intelligentSearch(result, searchQuery);
    }

    // 根据视图模式排序
    if (viewMode === 'popular') {
      result = smartAppService.sortAppsByPopularity(result);
      // 只显示前20个热门应用
      result = result.slice(0, 20);
    } else {
      // 按应用名称排序
      result = result.sort((a, b) => a.app_name.localeCompare(b.app_name));
    }

    return result;
  }, [apps, libraryApps, activeTab, categoryFilter, statusFilter, searchQuery, viewMode]);

  // 前端分页切片
  const currentPageApps = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredApps.slice(start, end);
  }, [filteredApps, page, pageSize]);

  // 懒加载当前可见列表的图标（限制并发）
  useEffect(() => {
    let cancelled = false;
    const toLoad = currentPageApps // 修改为只加载当前页的图标
      .filter((a) => icons[a.package_name] === undefined && !iconLoadingSet.has(a.package_name))
      .slice(0, 12); // 每次最多加载12个

    if (toLoad.length === 0 || !deviceId) return;

    const run = async () => {
      const concurrency = 4;
      const queue = [...toLoad];
      const loading = new Set(iconLoadingSet);
      toLoad.forEach((a) => loading.add(a.package_name));
      setIconLoadingSet(loading);

      const workers = Array.from({ length: concurrency }).map(async () => {
        while (queue.length && !cancelled) {
          const app = queue.shift();
          if (!app) break;
          const dataUrl = await smartAppService.getAppIcon(deviceId, app.package_name);
          if (cancelled) break;
          setIcons((prev) => ({ ...prev, [app.package_name]: dataUrl }));
        }
      });
      await Promise.all(workers);
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [currentPageApps, deviceId, icons, iconLoadingSet]);

  // 处理应用选择
  const handleSelectApp = (app: AppInfo) => {
    saveToHistory(app);
    onSelect(app);
    onClose();
    message.success(`已选择应用: ${app.app_name}`);
  };

  // 处理手动提交
  const handleManualSubmit = async () => {
    try {
      const values = await manualForm.validateFields();
      const app: AppInfo = {
        package_name: values.package_name,
        app_name: values.app_name || values.package_name,
        is_system_app: false,
        is_enabled: true
      };
      handleSelectApp(app);
    } catch {
      // 验证失败
    }
  };

  // 获取应用图标
  const getAppIcon = (app: AppInfo) => {
    if (smartAppService.isPopularApp(app.package_name)) {
      return <StarOutlined style={{ color: '#faad14' }} />;
    }
    
    if (app.is_system_app) {
      return <SettingOutlined style={{ color: '#722ed1' }} />;
    }
    
    return <AppstoreOutlined style={{ color: '#1890ff' }} />;
  };

  // 快速选择热门应用
  const popularApps = useMemo(() => {
    const source = activeTab === 'library' ? libraryApps : apps;
    return source.filter(app => smartAppService.isPopularApp(app.package_name))
      .sort((a, b) => a.app_name.localeCompare(b.app_name))
      .slice(0, 8);
  }, [apps, libraryApps, activeTab]);

  const renderAppList = () => (
    <>
      <SmartAppFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        viewMode={viewMode}
        setViewMode={setViewMode}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        refreshStrategy={refreshStrategy}
        setRefreshStrategy={setRefreshStrategy}
        pageSize={pageSize}
        setPageSize={setPageSize}
        setPage={setPage}
        onRefresh={() => { if(activeTab === 'device') loadDeviceApps(); }}
        showRefresh={activeTab === 'device'}
        popupProps={popupProps}
      />

      {/* 快速选择热门应用 */}
      {viewMode === 'popular' && popularApps.length > 0 && (
        <Card 
          title="热门应用快捷选择" 
          size="small"
          style={{ marginBottom: 16 }}
          bodyStyle={{ padding: '12px' }}
        >
          <Row gutter={[8, 8]}>
            {popularApps.map((app) => (
              <Col span={6} key={app.package_name}>
                <Button
                  block
                  size="small"
                  icon={getAppIcon(app)}
                  onClick={() => handleSelectApp(app)}
                  style={{
                    height: 'auto',
                    whiteSpace: 'normal',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontSize: '12px', marginTop: '2px' }}>
                    {app.app_name}
                  </div>
                </Button>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      <SmartAppList
        loading={loading && activeTab === 'device'}
        total={total}
        apps={currentPageApps}
        selectedApp={selectedApp}
        onSelect={handleSelectApp}
        icons={icons}
        searchQuery={searchQuery}
        activeTab={activeTab}
        onAppsChanged={() => setLibraryApps(appRegistryService.getAllApps())}
      />

      {/* 底部统计信息 */}
      <div style={{ 
        marginTop: 16, 
        padding: '8px 0', 
        borderTop: '1px solid #f0f0f0',
        textAlign: 'center'
      }}>
        <Space direction="vertical" size={4}>
          <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
            共 {filteredApps.length} 个应用，当前第 {page} / {Math.max(1, Math.ceil(filteredApps.length / pageSize))} 页
            {searchQuery && ` (搜索: "${searchQuery}")`}
          </Typography.Text>
          <Space>
            <Button size="small" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>上一页</Button>
            <Button size="small" disabled={page >= Math.max(1, Math.ceil(filteredApps.length / pageSize))} onClick={() => setPage((p) => p + 1)}>下一页</Button>
          </Space>
        </Space>
      </div>
    </>
  );

  return (
    <Modal
      title={
        <Space>
          <RocketOutlined />
          智能应用选择器
          {selectedApp && (
            <Tag color="green">
              已选: {selectedApp.app_name}
            </Tag>
          )}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      style={{ top: 20 }}
      bodyStyle={{ maxHeight: '80vh', overflowY: 'auto', padding: '0 24px 24px' }}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane 
          tab={<span><AppstoreOutlined />应用库</span>} 
          key="library"
        >
          {renderAppList()}
        </TabPane>

        <TabPane 
          tab={<span><MobileOutlined />设备扫描</span>} 
          key="device"
        >
          {!deviceId ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="未连接设备，无法加载实时应用列表"
            >
              <Button type="primary" onClick={() => setActiveTab('history')}>
                查看历史记录
              </Button>
            </Empty>
          ) : (
            renderAppList()
          )}
        </TabPane>

        <TabPane 
          tab={<span><HistoryOutlined />历史记录</span>} 
          key="history"
        >
          <SmartAppList
            loading={false}
            total={historyApps.length}
            apps={historyApps}
            selectedApp={selectedApp}
            onSelect={handleSelectApp}
            icons={icons}
            searchQuery=""
            activeTab="history"
          />
        </TabPane>

        <TabPane 
          tab={<span><EditOutlined />手动输入</span>} 
          key="manual"
        >
          <Alert
            message="手动输入应用信息"
            description="如果您知道应用的包名，可以直接输入。这在未连接设备或编写离线脚本时非常有用。"
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
          <Form
            form={manualForm}
            layout="vertical"
            onFinish={handleManualSubmit}
          >
            <Form.Item
              name="package_name"
              label="应用包名 (Package Name)"
              required
              rules={[{ required: true, message: '请输入应用包名' }]}
              tooltip="例如: com.xingin.xhs (小红书)"
            >
              <Input placeholder="请输入应用包名，如 com.example.app" />
            </Form.Item>
            <Form.Item
              name="app_name"
              label="应用名称 (可选)"
              tooltip="用于显示的名称，不填则默认使用包名"
            >
              <Input placeholder="请输入应用名称" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block icon={<CheckCircleOutlined />}>
                确认使用
              </Button>
            </Form.Item>
          </Form>
        </TabPane>
      </Tabs>
    </Modal>
  );
};