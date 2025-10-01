import React, { useState } from 'react';import React, { useState } from 'react';

import { Layout, Typography, Space, Alert, Button, Card, Row, Col, Badge, Menu } from 'antd';<<<<<<< HEAD

import { WarningOutlined, ReloadOutlined, ThunderboltOutlined, SearchOutlined, UserOutlined, BarChartOutlined, SettingOutlined, FileTextOutlined, BellOutlined } from '@ant-design/icons';import { Layout, Menu, Card, Typography, Space, Button, Badge, Row, Col, Alert } from 'antd';

import { PreciseAcquisitionForm } from '../../components/task';import { 

import { useAdb } from '../../application/hooks/useAdb';  SearchOutlined, 

import { shouldBypassDeviceCheck, getMockDevices } from '../../config/developmentMode';  UserOutlined, 

  VideoCameraOutlined,

// 导入子模块组件 (cara分支的营销功能)  BarChartOutlined,

import { IndustryMonitoringModule } from './modules/IndustryMonitoringModule';  SettingOutlined,

import { TaskManagementCenter } from './modules/TaskManagementCenter';  ThunderboltOutlined,

import { DailyReportModule } from './modules/DailyReportModule';  BellOutlined,

  FileTextOutlined

const { Sider, Content } = Layout;} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;=======

import { Layout, Typography, Space, Alert, Button } from 'antd';

type ModuleType = 'form' | 'dashboard' | 'industry' | 'account' | 'tasks' | 'reports' | 'settings';import { WarningOutlined, ReloadOutlined } from '@ant-design/icons';

import { PreciseAcquisitionForm } from '../../components/task';

/**>>>>>>> main

 * 精准获客页面 - AI智能合并版本import { useAdb } from '../../application/hooks/useAdb';

 * 基于主分支的原生Ant Design架构，融合cara分支的营销自动化功能import { shouldBypassDeviceCheck, getMockDevices } from '../../config/developmentMode';

 */

export const PreciseAcquisitionPage: React.FC = () => {// 导入子模块组件

  const [activeModule, setActiveModule] = useState<ModuleType>('form');import { IndustryMonitoringModule } from './modules/IndustryMonitoringModule';

  import { TaskManagementCenter } from './modules/TaskManagementCenter';

  // 使用统一的ADB接口 - 遵循DDD架构约束import { DailyReportModule } from './modules/DailyReportModule';

  const { 

    devices,// TODO: 以下模块暂时注释，需要重新创建

    onlineDevices,// import { AccountMonitoringModule } from './modules/AccountMonitoringModule';

    refreshDevices,// import { MonitoringDashboard } from './modules/MonitoringDashboard';

    selectedDevice

  } = useAdb();const { Sider, Content } = Layout;

const { Title, Text } = Typography;

  // 开发模式处理

  const isDevelopmentBypass = shouldBypassDeviceCheck();type ModuleType = 'dashboard' | 'industry' | 'account' | 'tasks' | 'reports' | 'settings';

  const effectiveOnlineDevices = isDevelopmentBypass && onlineDevices.length === 0

    ? getMockDevices()const { Content } = Layout;

    : onlineDevices;const { Title, Paragraph } = Typography;

  const hasAvailableDevices = effectiveOnlineDevices.length > 0;

/**

  // 菜单项配置 (融合cara分支的模块化功能)<<<<<<< HEAD

  const menuItems = [ * 精准获客主页面

    { * 集成社交媒体监控和客户线索获取的综合平台

      key: 'form', * 

      icon: <ThunderboltOutlined />, * 功能模块：

      label: '精准获客', * 1. 行业监控 - 按关键词搜索和评论区分析

      description: '基础获客表单' * 2. 账号/视频监控 - 指定目标的持续监控

    }, * 3. 任务管理中心 - 关注和回复任务的统一管理

    { * 4. 数据分析与日报 - 统计分析和报告生成

      key: 'dashboard',=======

      icon: <BarChartOutlined />, * 精准获客页面 - 原生Ant Design版本

      label: '监控总览', * 专注于精准获客功能

      description: '实时监控数据概览'>>>>>>> main

    }, */

    {export const PreciseAcquisitionPage: React.FC = () => {

      key: 'industry',  const [activeModule, setActiveModule] = useState<ModuleType>('dashboard');

      icon: <SearchOutlined />,  

      label: '行业监控',  // 使用统一的ADB接口 - 遵循DDD架构约束

      description: '关键词搜索与评论分析'  const { 

    },    devices, 

    {    onlineDevices,

      key: 'account',    refreshDevices,

      icon: <UserOutlined />,    selectedDevice

      label: '账号监控',  } = useAdb();

      description: '指定账号/视频监控'

    },  // 开发模式处理

    {  const isDevelopmentBypass = shouldBypassDeviceCheck();

      key: 'tasks',  const effectiveOnlineDevices = isDevelopmentBypass && onlineDevices.length === 0 

      icon: <ThunderboltOutlined />,    ? getMockDevices() 

      label: '任务中心',    : onlineDevices;

      description: '关注和回复任务管理'  const hasAvailableDevices = effectiveOnlineDevices.length > 0;

    },

    {  // 菜单项配置

      key: 'reports',  const menuItems = [

      icon: <FileTextOutlined />,    {

      label: '数据报告',      key: 'dashboard',

      description: '日报统计与数据导出'      icon: <BarChartOutlined />,

    },      label: '监控总览',

    {      description: '实时监控数据概览'

      key: 'settings',    },

      icon: <SettingOutlined />,    {

      label: '系统设置',      key: 'industry',

      description: '监控参数与通知设置'      icon: <SearchOutlined />,

    }      label: '行业监控',

  ];      description: '关键词搜索与评论分析'

    },

  // 渲染模块内容 (AI智能合并逻辑)    {

  const renderModuleContent = () => {      key: 'account',

    const commonProps = {      icon: <UserOutlined />,

      onlineDevices: effectiveOnlineDevices,      label: '账号监控',

      selectedDevice,      description: '指定账号/视频监控'

      refreshDevices    },

    };    {

      key: 'tasks',

    switch (activeModule) {      icon: <ThunderboltOutlined />,

      case 'form':      label: '任务中心',

        // 主分支的原始精准获客表单      description: '关注和回复任务管理'

        return (    },

          <Card>    {

            <Title level={3}>精准获客</Title>      key: 'reports',

            <Paragraph type="secondary">      icon: <FileTextOutlined />,

              基于关键词和竞对分析的精准用户获取平台      label: '数据报告',

            </Paragraph>      description: '日报统计与数据导出'

            <div style={{ minHeight: '70vh' }}>    },

              <PreciseAcquisitionForm    {

                availableDevices={effectiveOnlineDevices.map(d => ({      key: 'settings',

                  id: d.id,      icon: <SettingOutlined />,

                  name: d.getDisplayName(),      label: '系统设置',

                  phone_name: d.id      description: '监控参数与通知设置'

                }))}    }

                isLoading={false}  ];

              />

            </div>  // 渲染当前模块内容

          </Card>  const renderModuleContent = () => {

        );    const commonProps = {

            onlineDevices: effectiveOnlineDevices,

      case 'dashboard':      selectedDevice,

        // cara分支的监控总览功能      refreshDevices

        return (    };

          <Card>

            <Title level={3}>监控总览</Title>    switch (activeModule) {

            <Text type="secondary">实时数据概览和系统状态监控</Text>      case 'dashboard':

                    return (

            <div className="mt-6">          <Card>

              <Row gutter={[16, 16]}>            <Title level={3}>监控总览</Title>

                <Col xs={24} sm={12} lg={6}>            <Text type="secondary">实时数据概览和系统状态监控</Text>

                  <Card>            

                    <div className="text-center">            <div className="mt-6">

                      <div className="text-2xl font-bold text-blue-600">1,234</div>              <Row gutter={[16, 16]}>

                      <div className="text-gray-500">总关注数</div>                <Col xs={24} sm={12} lg={6}>

                    </div>                  <Card>

                  </Card>                    <div className="text-center">

                </Col>                      <div className="text-2xl font-bold text-blue-600">1,234</div>

                <Col xs={24} sm={12} lg={6}>                      <div className="text-gray-500">总关注数</div>

                  <Card>                    </div>

                    <div className="text-center">                  </Card>

                      <div className="text-2xl font-bold text-green-600">856</div>                </Col>

                      <div className="text-gray-500">总回复数</div>                <Col xs={24} sm={12} lg={6}>

                    </div>                  <Card>

                  </Card>                    <div className="text-center">

                </Col>                      <div className="text-2xl font-bold text-green-600">856</div>

                <Col xs={24} sm={12} lg={6}>                      <div className="text-gray-500">总回复数</div>

                  <Card>                    </div>

                    <div className="text-center">                  </Card>

                      <div className="text-2xl font-bold text-orange-600">89.5%</div>                </Col>

                      <div className="text-gray-500">成功率</div>                <Col xs={24} sm={12} lg={6}>

                    </div>                  <Card>

                  </Card>                    <div className="text-center">

                </Col>                      <div className="text-2xl font-bold text-orange-600">89.5%</div>

                <Col xs={24} sm={12} lg={6}>                      <div className="text-gray-500">成功率</div>

                  <Card>                    </div>

                    <div className="text-center">                  </Card>

                      <div className="text-2xl font-bold text-purple-600">                </Col>

                        {effectiveOnlineDevices.length}                <Col xs={24} sm={12} lg={6}>

                        {isDevelopmentBypass && <span className="text-sm text-gray-400 ml-1">(模拟)</span>}                  <Card>

                      </div>                    <div className="text-center">

                      <div className="text-gray-500">在线设备</div>                      <div className="text-2xl font-bold text-purple-600">

                    </div>                        {effectiveOnlineDevices.length}

                  </Card>                        {isDevelopmentBypass && <span className="text-sm text-gray-400 ml-1">(模拟)</span>}

                </Col>                      </div>

              </Row>                      <div className="text-gray-500">在线设备</div>

            </div>                    </div>

                  </Card>

            <div className="mt-6">                </Col>

              <Alert              </Row>

                message="系统状态良好"            </div>

                description="所有监控任务正在正常执行，设备连接稳定。"

                type="success"            <div className="mt-6">

                showIcon              <Alert

              />                message="系统状态良好"

            </div>                description="所有监控任务正在正常执行，设备连接稳定。"

          </Card>                type="success"

        );                showIcon

                    />

      case 'industry':            </div>

        return <IndustryMonitoringModule {...commonProps} />;

                  <div className="mt-4">

      case 'tasks':              <Space>

        return <TaskManagementCenter {...commonProps} />;                <Button type="primary" onClick={() => setActiveModule('industry')}>

                        开始行业监控

      case 'reports':                </Button>

        return <DailyReportModule {...commonProps} />;                <Button onClick={() => setActiveModule('tasks')}>

                        查看任务队列

      case 'account':                </Button>

      case 'settings':                <Button onClick={() => setActiveModule('reports')}>

        return (                  生成数据报告

          <Card>                </Button>

            <Title level={3}>{activeModule === 'account' ? '账号监控' : '系统设置'}</Title>              </Space>

            <Text type="secondary">功能开发中...</Text>            </div>

          </Card>          </Card>

        );        );

            case 'industry':

      default:        return <IndustryMonitoringModule {...commonProps} />;

        return (      case 'account':

          <Card>        return (

            <Title level={3}>精准获客</Title>          <Card>

            <Text type="secondary">请选择功能模块</Text>            <Title level={3}>账号/视频监控</Title>

          </Card>            <Text type="secondary">监控特定账号或视频的数据变化，达到阈值时自动提醒</Text>

        );            

    }            <div className="mt-6">

  };              <Row gutter={[16, 16]}>

                <Col span={6}>

  // 设备状态检查 - 保持主分支的简洁设计                  <Card>

  if (!hasAvailableDevices) {                    <div className="text-center">

    return (                      <div className="text-2xl font-bold text-blue-600">0</div>

      <Layout>                      <div className="text-gray-500">监控目标</div>

        <Content style={{ padding: 24 }}>                    </div>

          <Space direction="vertical" style={{ width: '100%' }} size="large">                  </Card>

            <div>                </Col>

              <Title level={2}>精准获客</Title>                <Col span={6}>

            </div>                  <Card>

                    <div className="text-center">

            <Alert                      <div className="text-2xl font-bold text-green-600">0</div>

              message="暂无可用设备"                      <div className="text-gray-500">活跃监控</div>

              description="请先到设备管理页面连接设备后再执行获客操作。"                    </div>

              type="warning"                  </Card>

              showIcon                </Col>

              icon={<WarningOutlined />}                <Col span={6}>

              action={                  <Card>

                <Button                    <div className="text-center">

                  icon={<ReloadOutlined />}                      <div className="text-2xl font-bold text-orange-600">0</div>

                  onClick={refreshDevices}                      <div className="text-gray-500">待处理提醒</div>

                  type="primary"                    </div>

                >                  </Card>

                  刷新设备列表                </Col>

                </Button>                <Col span={6}>

              }                  <Card>

            />                    <div className="text-center">

                                  <div className="text-2xl font-bold text-purple-600">

            {/* cara分支的开发模式提示 */}                        {effectiveOnlineDevices.length}

            {isDevelopmentBypass && (                        {isDevelopmentBypass && <span className="text-sm text-gray-400 ml-1">(模拟)</span>}

              <Alert                      </div>

                message="开发模式提示"                      <div className="text-gray-500">可用设备</div>

                description="当前处于开发模式，可以启用演示功能"                    </div>

                type="info"                  </Card>

                showIcon                </Col>

                action={              </Row>

                  <Button            </div>

                    size="small"

                    onClick={() => window.location.reload()}            <div className="mt-6">

                  >              <Alert

                    启用演示模式                message="账号监控功能正在开发中"

                  </Button>                description="此功能将支持监控特定账号或视频的浏览量、点赞量、评论量等指标，并在达到阈值时自动提醒。"

                }                type="info"

              />                showIcon

            )}              />

          </Space>            </div>

        </Content>

      </Layout>            <div className="mt-4">

    );              <Space>

  }                <Button type="primary" disabled>

                  添加监控目标

  return (                </Button>

    <Layout className="min-h-screen">                <Button disabled>

      {/* cara分支的侧边栏导航 - 在主分支架构基础上添加 */}                  查看监控提醒

      <Sider                </Button>

        width={280}              </Space>

        className="bg-white shadow-sm"            </div>

        style={{          </Card>

          position: 'fixed',        );

          left: 0,      case 'tasks':

          top: 0,        return <TaskManagementCenter {...commonProps} />;

          bottom: 0,      case 'reports':

          zIndex: 100        return <DailyReportModule {...commonProps} />;

        }}      case 'settings':

      >        return (

        <div className="p-6 border-b">          <Card>

          <Space direction="vertical" size="small" className="w-full">            <Title level={3}>系统设置</Title>

            <Title level={4} className="m-0 text-blue-600">            <Text type="secondary">监控参数配置和通知设置（开发中...）</Text>

              <ThunderboltOutlined className="mr-2" />          </Card>

              精准获客        );

            </Title>      default:

            <Text type="secondary" className="text-xs">        return (

              智能社媒监控平台          <Card>

            </Text>            <Title level={3}>监控总览</Title>

            <Text type="secondary">监控总览面板正在开发中，请使用其他功能模块...</Text>

            {/* 设备状态指示 */}          </Card>

            <div className="mt-3 p-2 bg-green-50 rounded-lg">        );

              <Text type="success" className="text-xs">    }

                <Badge status="success" />  };

                已连接 {effectiveOnlineDevices.length} 台设备

                {isDevelopmentBypass && <span className="text-gray-400"> (开发模式)</span>}  // 设备状态检查 - 在开发模式下跳过

              </Text>  if (!hasAvailableDevices) {

            </div>    return (

          </Space><<<<<<< HEAD

        </div>      <div className="p-8">

        <div className="max-w-2xl mx-auto text-center">

        <Menu          <div className="mb-8">

          mode="inline"            <ThunderboltOutlined style={{ fontSize: '64px', color: '#faad14' }} />

          selectedKeys={[activeModule]}          </div>

          className="border-none bg-transparent"          <Title level={2}>精准获客系统</Title>

          style={{ height: 'calc(100vh - 140px)', overflow: 'auto' }}          <Text type="secondary" className="text-lg">

          onClick={({ key }) => setActiveModule(key as ModuleType)}            智能社交媒体监控与客户线索获取平台

        >          </Text>

          {menuItems.map(item => (          

            <Menu.Item key={item.key} className="!mx-3 !mb-2 !rounded-lg">          <Card className="mt-8 bg-yellow-50 border-yellow-200">

              <div className="flex items-start space-x-3">            <div className="text-center">

                <div className="mt-1 text-lg">              <BellOutlined style={{ fontSize: '32px', color: '#faad14' }} className="mb-4" />

                  {item.icon}              <Title level={4} type="warning">暂无可用设备</Title>

                </div>              <Text type="secondary">

                <div className="flex-1 min-w-0">                请先连接设备后再开始监控任务。系统需要通过ADB连接小红书、抖音等应用。

                  <div className="font-medium text-gray-900">              </Text>

                    {item.label}              {isDevelopmentBypass && (

                  </div>                <div className="mt-4">

                  <div className="text-xs text-gray-500 mt-1 leading-tight">                  <Alert

                    {item.description}                    message="开发模式提示"

                  </div>                    description="当前处于开发模式，可以继续查看功能演示"

                </div>                    type="info"

              </div>                    showIcon

            </Menu.Item>                    action={

          ))}                      <Button 

        </Menu>                        size="small"

      </Sider>                        onClick={() => window.location.reload()}

                      >

      {/* 主内容区域 - 保持主分支的布局结构 */}                        启用演示模式

      <Layout style={{ marginLeft: 280 }}>                      </Button>

        <Content style={{ padding: 24 }}>                    }

          <Space direction="vertical" style={{ width: '100%' }} size="large">                  />

            {renderModuleContent()}                </div>

          </Space>              )}

        </Content>              <div className="mt-6">

      </Layout>                <Button 

    </Layout>                  type="primary" 

  );                  size="large"

};                  onClick={refreshDevices}
                  loading={false}
                >
                  刷新设备列表
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
=======
      <Layout>
        <Content style={{ padding: 24 }}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Title level={2}>精准获客</Title>
            </div>
            
            <Alert
              message="暂无可用设备"
              description="请先到设备管理页面连接设备后再执行获客操作。"
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              action={
                <Button
                  icon={<ReloadOutlined />}
                  onClick={refreshDevices}
                  type="primary"
                >
                  刷新设备列表
                </Button>
              }
            />
          </Space>
        </Content>
      </Layout>
>>>>>>> main
    );
  }

  return (
<<<<<<< HEAD
    <Layout className="min-h-screen bg-gray-50">
      {/* 左侧导航菜单 */}
      <Sider 
        width={280} 
        className="bg-white shadow-sm"
        style={{ 
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100
        }}
      >
        <div className="p-6 border-b">
          <Space direction="vertical" size="small" className="w-full">
            <Title level={4} className="m-0 text-blue-600">
              <ThunderboltOutlined className="mr-2" />
              精准获客
            </Title>
            <Text type="secondary" className="text-xs">
              智能社媒监控平台
            </Text>
            
            {/* 设备状态指示 */}
            <div className="mt-3 p-2 bg-green-50 rounded-lg">
              <Text type="success" className="text-xs">
                <Badge status="success" />
                已连接 {effectiveOnlineDevices.length} 台设备
                {isDevelopmentBypass && <span className="text-gray-400"> (开发模式)</span>}
              </Text>
            </div>
          </Space>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[activeModule]}
          className="border-none bg-transparent"
          style={{ height: 'calc(100vh - 140px)', overflow: 'auto' }}
          onClick={({ key }) => setActiveModule(key as ModuleType)}
        >
          {menuItems.map(item => (
            <Menu.Item key={item.key} className="!mx-3 !mb-2 !rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="mt-1 text-lg">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900">
                    {item.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 leading-tight">
                    {item.description}
                  </div>
                </div>
              </div>
            </Menu.Item>
          ))}
        </Menu>
      </Sider>

      {/* 主内容区域 */}
      <Layout style={{ marginLeft: 280 }}>
        <Content className="p-6 overflow-auto">
          {renderModuleContent()}
        </Content>
      </Layout>
=======
    <Layout>
      <Content style={{ padding: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* 页面标题 */}
          <div>
            <Title level={2}>精准获客</Title>
            <Paragraph type="secondary">
              基于关键词和竞对分析的精准用户获取平台
            </Paragraph>
          </div>

          {/* 精准获客表单 */}
          <div style={{ minHeight: '70vh' }}>
            <PreciseAcquisitionForm
              platform={platform}
              onPlatformChange={setPlatform}
              balance={balance}
              onSubmit={handleAcquisitionSubmit}
              availableDevices={availableDevices}
              selectedDevices={selectedDevices}
              onDeviceSelectionChange={setSelectedDevices}
              isLoading={isLoading}
            />
          </div>
        </Space>
      </Content>
>>>>>>> main
    </Layout>
  );
};

