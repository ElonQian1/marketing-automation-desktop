/**
 * 查重频控管理主界面
 * 
 * 整合配置管理、监控面板、白名单/黑名单管理等功能
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Button,
  Space,
  Alert,
  Spin,
  Result,
  Typography,
  Row,
  Col,
  Statistic,
  Badge,
  Divider
} from 'antd';
import {
  SettingOutlined,
  MonitorOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

import { SafetyConfigPanel } from './SafetyConfigPanel';
import { SafetyMonitorPanel } from './SafetyMonitorPanel';
import { WhiteBlacklistManager } from './WhiteBlacklistManager';
import { useSafetyControl } from '../hooks/useSafetyControl';
import type { 
  SafetyConfig,
  SafetyStatistics,
  SafetyCheckResult,
  WhitelistEntry,
  BlacklistEntry,
  ListType
} from '../types';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

/**
 * 系统状态概览组件
 */
const SystemOverview: React.FC<{
  config: SafetyConfig | null;
  statistics: SafetyStatistics | null;
  healthStatus: any;
  whitelist: WhitelistEntry[];
  blacklist: BlacklistEntry[];
  onRefresh: () => void;
  loading?: boolean;
}> = ({ 
  config, 
  statistics, 
  healthStatus, 
  whitelist, 
  blacklist, 
  onRefresh, 
  loading 
}) => {
  const getSystemStatus = () => {
    if (!config) return { status: 'error', text: '配置未加载' };
    
    const enabledSystems = [
      config.deduplication.strategies.length > 0,
      Object.values(config.rateLimit).some(config => config.enabled),
      config.circuitBreaker.enabled
    ].filter(Boolean).length;
    
    if (enabledSystems === 0) return { status: 'warning', text: '所有系统已关闭' };
    if (enabledSystems === 3) return { status: 'success', text: '所有系统正常运行' };
    return { status: 'processing', text: `${enabledSystems}/3 系统运行中` };
  };
  
  const systemStatus = getSystemStatus();
  const passRate = statistics && statistics.totalChecks > 0 
    ? (statistics.passedChecks / statistics.totalChecks * 100) 
    : 0;
  
  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <SafetyCertificateOutlined />
            <Title level={4} style={{ margin: 0, color: 'var(--text-inverse)' }}>
              系统状态概览
            </Title>
          </Space>
          <Button 
            icon={<ReloadOutlined />} 
            size="small" 
            onClick={onRefresh}
            loading={loading}
          >
            刷新
          </Button>
        </div>
      }
      style={{ background: 'var(--bg-light-base)' }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* 系统运行状态 */}
        <Alert
          type={systemStatus.status as any}
          message={
            <Space>
              <Badge status={systemStatus.status as any} />
              {systemStatus.text}
            </Space>
          }
          showIcon
        />
        
        {/* 关键指标 */}
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card size="small" style={{ background: 'var(--bg-light-secondary)' }}>
              <Statistic
                title={<span style={{ color: 'var(--text-inverse)' }}>系统健康度</span>}
                value={healthStatus?.score || 0}
                suffix="%"
                valueStyle={{ 
                  color: healthStatus?.score >= 90 ? '#52c41a' : 
                         healthStatus?.score >= 70 ? '#faad14' : '#f5222d'
                }}
              />
            </Card>
          </Col>
          
          <Col span={6}>
            <Card size="small" style={{ background: 'var(--bg-light-secondary)' }}>
              <Statistic
                title={<span style={{ color: 'var(--text-inverse)' }}>通过率</span>}
                value={passRate}
                precision={1}
                suffix="%"
                valueStyle={{ 
                  color: passRate >= 90 ? '#52c41a' : 
                         passRate >= 70 ? '#faad14' : '#f5222d'
                }}
              />
            </Card>
          </Col>
          
          <Col span={6}>
            <Card size="small" style={{ background: 'var(--bg-light-secondary)' }}>
              <Statistic
                title={<span style={{ color: 'var(--text-inverse)' }}>白名单数量</span>}
                value={whitelist.length}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          
          <Col span={6}>
            <Card size="small" style={{ background: 'var(--bg-light-secondary)' }}>
              <Statistic
                title={<span style={{ color: 'var(--text-inverse)' }}>黑名单数量</span>}
                value={blacklist.length}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
        </Row>
        
        {/* 系统组件状态 */}
        <div>
          <Text strong style={{ color: 'var(--text-inverse)' }}>系统组件状态：</Text>
          <Divider type="vertical" />
          <Space>
            <Badge 
              status={config?.deduplication.strategies.length > 0 ? 'success' : 'default'} 
              text="去重检测" 
            />
            <Badge 
              status={Object.values(config?.rateLimit || {}).some(config => typeof config === 'object' && config.enabled) ? 'success' : 'default'} 
              text="频率控制" 
            />
            <Badge 
              status={config?.circuitBreaker.enabled ? 'success' : 'default'} 
              text="熔断保护" 
            />
          </Space>
        </div>
        
        {/* 今日统计 */}
        {statistics && (
          <Row gutter={[8, 8]}>
            <Col span={8}>
              <Text type="secondary">今日检查：</Text>
              <Text strong style={{ color: 'var(--text-inverse)' }}>{statistics.totalChecks}</Text>
            </Col>
            <Col span={8}>
              <Text type="secondary">通过：</Text>
              <Text strong style={{ color: '#52c41a' }}>{statistics.passedChecks}</Text>
            </Col>
            <Col span={8}>
              <Text type="secondary">拦截：</Text>
              <Text strong style={{ color: '#f5222d' }}>{statistics.blockedChecks}</Text>
            </Col>
          </Row>
        )}
      </Space>
    </Card>
  );
};

/**
 * 主管理界面组件
 */
export const DeduplicationControlManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAccount, setSelectedAccount] = useState('default');
  
  const {
    config,
    statistics,
    recentChecks,
    healthStatus,
    whitelist,
    blacklist,
    loading,
    error,
    updateConfig,
    loadStatistics,
    refreshHealth,
    addToWhitelist,
    addToBlacklist,
    updateWhitelistEntry,
    updateBlacklistEntry,
    deleteWhitelistEntry,
    deleteBlacklistEntry,
    batchImportWhitelist,
    batchImportBlacklist,
    exportWhitelist,
    exportBlacklist
  } = useSafetyControl();
  
  // 初始化加载
  useEffect(() => {
    const initializeData = async () => {
      try {
        await refreshHealth();
        
        // 加载今天的统计数据
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        
        await loadStatistics(selectedAccount, { start: startOfDay, end: endOfDay });
      } catch (error) {
        console.error('初始化数据失败:', error);
      }
    };
    
    initializeData();
  }, [selectedAccount, refreshHealth, loadStatistics]);
  
  // 处理配置更新
  const handleConfigUpdate = async (newConfig: SafetyConfig) => {
    try {
      await updateConfig(newConfig);
      // 配置更新后刷新健康状态
      await refreshHealth();
    } catch (error) {
      console.error('配置更新失败:', error);
    }
  };
  
  // 处理监控面板刷新
  const handleMonitorRefresh = async () => {
    try {
      await refreshHealth();
    } catch (error) {
      console.error('刷新失败:', error);
    }
  };
  
  // 处理统计数据加载
  const handleLoadStatistics = async (accountId: string, timeRange: { start: Date; end: Date }) => {
    try {
      await loadStatistics(accountId, timeRange);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };
  
  // 处理白名单/黑名单操作
  const handleAddEntry = async (type: ListType, entry: any) => {
    if (type === 'whitelist') {
      await addToWhitelist(entry);
    } else {
      await addToBlacklist(entry);
    }
  };
  
  const handleUpdateEntry = async (type: ListType, id: string, entry: any) => {
    if (type === 'whitelist') {
      await updateWhitelistEntry(id, entry);
    } else {
      await updateBlacklistEntry(id, entry);
    }
  };
  
  const handleDeleteEntry = async (type: ListType, id: string) => {
    if (type === 'whitelist') {
      await deleteWhitelistEntry(id);
    } else {
      await deleteBlacklistEntry(id);
    }
  };
  
  const handleBatchImport = async (type: ListType, entries: any[]) => {
    if (type === 'whitelist') {
      await batchImportWhitelist(entries);
    } else {
      await batchImportBlacklist(entries);
    }
  };
  
  const handleExport = async (type: ListType) => {
    if (type === 'whitelist') {
      await exportWhitelist();
    } else {
      await exportBlacklist();
    }
  };
  
  // 错误状态
  if (error) {
    return (
      <div className="light-theme-force" style={{ background: 'var(--bg-light-base)' }}>
        <Result
          status="error"
          title="加载失败"
          subTitle={error}
          extra={
            <Button type="primary" onClick={() => window.location.reload()}>
              重新加载
            </Button>
          }
        />
      </div>
    );
  }
  
  return (
    <div className="light-theme-force" style={{ background: 'var(--bg-light-base)', minHeight: '100vh' }}>
      <Spin spinning={loading} tip="加载中...">
        <Space direction="vertical" size="large" style={{ width: '100%', padding: 24 }}>
          {/* 页面标题 */}
          <div>
            <Title level={2} style={{ color: 'var(--text-inverse)' }}>
              查重频控管理系统
            </Title>
            <Text type="secondary">
              智能安全检测、去重控制、频率限制和熔断保护的统一管理平台
            </Text>
          </div>
          
          {/* 主要内容 */}
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            size="large"
            tabBarExtraContent={
              <Space>
                <Badge 
                  status={healthStatus?.status === 'healthy' ? 'success' : 'warning'} 
                  text={`系统${healthStatus?.status === 'healthy' ? '正常' : '异常'}`}
                />
              </Space>
            }
          >
            <TabPane
              tab={
                <span>
                  <SafetyCertificateOutlined />
                  系统概览
                </span>
              }
              key="overview"
            >
              <SystemOverview
                config={config}
                statistics={statistics}
                healthStatus={healthStatus}
                whitelist={whitelist}
                blacklist={blacklist}
                onRefresh={handleMonitorRefresh}
                loading={loading}
              />
            </TabPane>
            
            <TabPane
              tab={
                <span>
                  <SettingOutlined />
                  安全配置
                </span>
              }
              key="config"
            >
              <SafetyConfigPanel
                deduplicationConfig={config.deduplication}
                rateLimitConfig={config.rateLimit}
                circuitBreakerConfig={config.circuitBreaker}
                onDeduplicationChange={(changes) => handleConfigUpdate({
                  ...config,
                  deduplication: { ...config.deduplication, ...changes }
                })}
                onRateLimitChange={(changes) => handleConfigUpdate({
                  ...config,
                  rateLimit: { ...config.rateLimit, ...changes }
                })}
                onCircuitBreakerChange={(changes) => handleConfigUpdate({
                  ...config,
                  circuitBreaker: { ...config.circuitBreaker, ...changes }
                })}
                onReset={() => {
                  // TODO: 实现重置功能
                }}
                onExport={() => {
                  // TODO: 实现导出功能
                }}
                onImport={() => {
                  // TODO: 实现导入功能
                }}
              />
            </TabPane>
            
            <TabPane
              tab={
                <span>
                  <MonitorOutlined />
                  安全监控
                </span>
              }
              key="monitor"
            >
              <SafetyMonitorPanel
                statistics={statistics}
                recentChecks={recentChecks}
                healthStatus={healthStatus}
                onRefresh={handleMonitorRefresh}
                onLoadStatistics={handleLoadStatistics}
                loading={loading}
              />
            </TabPane>
            
            <TabPane
              tab={
                <span>
                  <TeamOutlined />
                  名单管理
                </span>
              }
              key="lists"
            >
              <WhiteBlacklistManager
                whitelist={whitelist}
                blacklist={blacklist}
                onAddEntry={handleAddEntry}
                onUpdateEntry={handleUpdateEntry}
                onDeleteEntry={handleDeleteEntry}
                onBatchImport={handleBatchImport}
                onExport={handleExport}
                loading={loading}
              />
            </TabPane>
          </Tabs>
        </Space>
      </Spin>
    </div>
  );
};