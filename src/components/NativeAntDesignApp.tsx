// src/components/NativeAntDesignApp.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 原生Ant Design主应用组件
 * 移除所有自定义样式，使用纯原生Ant Design组件和样式
 */

import React, { useState, JSX } from "react";
import {
  Layout,
  Menu,
  Typography,
  Space,
  Button,
  Avatar,
  Badge,
  App as AntApp,
  theme,
} from "antd";
import {
  DashboardOutlined,
  MobileOutlined,
  ContactsOutlined,
  SecurityScanOutlined,
  UserAddOutlined,
  RobotOutlined,
  FolderOutlined,
  EyeOutlined,
  BgColorsOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SyncOutlined,
  AimOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";

import { GlobalAdbProvider } from "../providers";
import { EnhancedThemeProvider } from "../components/feature-modules/theme-system";
import { featureFlags } from "../config/featureFlags";

// 页面组件导入
import InspectorPage from "../pages/InspectorPage";
import PermissionTestPage from "../pages/PermissionTestPage";
import AdbCenterPage from "../pages/adb/AdbCenterPage";
import SmartScriptBuilderPageNativeWrapper from "../pages/native-wrappers/SmartScriptBuilderPage.native";
import RealTimeDeviceMonitorPage from "../pages/device-monitor/RealTimeDeviceMonitorPage";
import SmartVcfImporter from "./SmartVcfImporter";
import TemplateLibrary from "./template/TemplateLibrary";
import ContactImportPage from "../pages/contact-import/ContactImportPage";
import QuickPhoneMirror from "./QuickPhoneMirror";
import { PageFinderView } from "./universal-ui/page-finder";
import { ThemeSettingsPage } from "../pages/ThemeSettingsPage";
import { NativeAntDashboard } from "./native-dashboard/NativeAntDashboard";
import EmployeePageNativeWrapper from "../pages/native-wrappers/EmployeePage.native";

// 原生 Ant Design 页面版本导入
import { StatisticsPageNative } from "../pages/statistics/StatisticsPageNative";
import { DeviceManagementPageNative } from "../pages/device-management/DeviceManagementPageNative";
import { LoginPageNative } from "../pages/auth/LoginPageNative";
import { PreciseAcquisitionPage } from "../pages/precise-acquisition/PreciseAcquisitionPage";

// 优化后的商业化页面
import { StatisticsPageOptimized } from "../pages/statistics/StatisticsPageOptimized";
import { DeviceManagementPageOptimized } from "../pages/device-management/DeviceManagementPageOptimized";
import BusinessComponentsDemo from "../pages/BusinessComponentsDemo";

// Design Tokens 演示页面
import { DesignTokensDemo } from "../pages/DesignTokensDemo";
import ElementDiscoveryTestPage from "../pages/ElementDiscoveryTestPage";

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const NativeAntDesignApp: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [inspectorOpen, setInspectorOpen] = useState<{
    open: boolean;
    sessionId?: string;
    stepId?: string;
  }>({ open: false });

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDevice(deviceId);
  };

  const menuItems: MenuProps["items"] = [
    {
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: "仪表板",
    },
    {
      key: "adb-center",
      icon: <MobileOutlined />,
      label: "ADB 中心",
    },
    {
      key: "contact-import",
      icon: <ContactsOutlined />,
      label: "联系人导入向导",
    },
    {
      key: "precise-acquisition",
      icon: <AimOutlined />,
      label: "精准获客系统",
    },
    {
      key: "watch-targets-list",
      icon: <AimOutlined />,
      label: "候选池列表（验证）",
    },
    ...(featureFlags.SHOW_LEGACY_VCF_IMPORT
      ? [
          {
            key: "smart-vcf",
            icon: <UserAddOutlined />,
            label: "VCF 导入（旧版）",
          },
        ]
      : []),
    {
      key: "permission-test",
      icon: <SecurityScanOutlined />,
      label: "权限测试",
    },
    {
      key: "smart-script-builder",
      icon: <RobotOutlined />,
      label: "智能脚本构建器",
    },
    {
      key: "template-library",
      icon: <FolderOutlined />,
      label: "模板库",
    },
    {
      key: "page-finder",
      icon: <EyeOutlined />,
      label: "页面查找器",
    },
    {
      key: "theme-settings",
      icon: <BgColorsOutlined />,
      label: "主题设置",
    },
    {
      key: "design-tokens-demo",
      icon: <BgColorsOutlined />,
      label: "🎨 Design Tokens 演示",
    },
    {
      key: "element-discovery-test",
      icon: <EyeOutlined />,
      label: "🧪 元素发现调试测试",
    },
    {
      key: "statistics-native",
      icon: <DashboardOutlined />,
      label: "统计页面（原生）",
    },
    {
      key: "statistics-optimized",
      icon: <DashboardOutlined />,
      label: "📊 统计中心（商业版）",
    },
    {
      key: "device-management-native",
      icon: <MobileOutlined />,
      label: "设备管理（原生）",
    },
    {
      key: "device-management-optimized",
      icon: <MobileOutlined />,
      label: "📱 设备中心（商业版）",
    },
    {
      key: "business-demo",
      icon: <BgColorsOutlined />,
      label: "🎨 商业组件演示",
    },
    {
      key: "login-native",
      icon: <UserAddOutlined />,
      label: "登录页面（原生）",
    },
    {
      key: "employee-native",
      icon: <UserAddOutlined />,
      label: "员工管理（原生包装）",
    },
  ];

  const renderContent = () => {
    switch (selectedKey) {
      case "dashboard":
        return <NativeAntDashboard />;
      case "adb-center":
        return <AdbCenterPage />;
      case "contact-import":
        return <ContactImportPage />;
      case "precise-acquisition":
        return <PreciseAcquisitionPage />;
      case "watch-targets-list":
        return (awaitedWatchTargetsListPage)();
      case "smart-vcf":
        return <SmartVcfImporter />;
      case "permission-test":
        return <PermissionTestPage />;
      case "smart-script-builder":
        return <SmartScriptBuilderPageNativeWrapper />;
      case "template-library":
        return <TemplateLibrary />;
      case "page-finder":
        return <PageFinderView />;
      case "theme-settings":
        return <ThemeSettingsPage />;
      case "design-tokens-demo":
        return <DesignTokensDemo />;
      case "element-discovery-test":
        return <ElementDiscoveryTestPage />;
      case "statistics-native":
        return <StatisticsPageNative />;
      case "statistics-optimized":
        return <StatisticsPageOptimized />;
      case "device-management-native":
        return <DeviceManagementPageNative />;
      case "device-management-optimized":
        return <DeviceManagementPageOptimized />;
      case "business-demo":
        return <BusinessComponentsDemo />;
      case "login-native":
        return <LoginPageNative />;
      case "employee-native":
        return <EmployeePageNativeWrapper />;
      default:
        return <NativeAntDashboard />;
    }
  };

  // 动态导入 WatchTargetsListPage，避免主包体积膨胀
  const awaitedWatchTargetsListPage = (() => {
    let Comp: React.ComponentType | null = null;
    return () => {
      const [C, setC] = React.useState<React.ComponentType | null>(Comp);
      React.useEffect(() => {
        if (!C) {
          import('../pages/precise-acquisition/WatchTargetsListPage').then(m => {
            Comp = m.default;
            setC(() => m.default);
          });
        }
      }, [C]);
      return C ? <C /> : <div>加载中...</div>;
    };
  })();

  return (
    <AntApp 
      message={{ maxCount: 3 }}
      notification={{ maxCount: 3, placement: 'topRight' }}
    >
      <Layout style={{ minHeight: "100vh" }}>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          style={{
            background: colorBgContainer,
          }}
        >
          <div
            style={{
              height: 32,
              margin: 16,
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#1677ff",
              fontWeight: "bold",
            }}
          >
            {collapsed ? "EGI" : "EmployeeGUI"}
          </div>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            onClick={({ key }) => setSelectedKey(key)}
            style={{ borderRight: 0 }}
          />
        </Sider>

        <Layout>
          <Header
            style={{
              padding: 0,
              background: colorBgContainer,
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            <Space
              style={{
                width: "100%",
                justifyContent: "space-between",
                padding: "0 16px",
              }}
            >
              <Space>
                <Button
                  type="text"
                  icon={
                    collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />
                  }
                  onClick={() => setCollapsed(!collapsed)}
                  style={{
                    fontSize: "16px",
                    width: 64,
                    height: 64,
                  }}
                />
                <Title level={4} style={{ margin: 0 }}>
                  员工管理系统
                </Title>
              </Space>

              <Space>
                <Badge count={5}>
                  <Button
                    type="text"
                    icon={<SyncOutlined />}
                    onClick={() => console.log("刷新设备")}
                  >
                    刷新设备
                  </Button>
                </Badge>
                <Avatar style={{ backgroundColor: "#1677ff" }}>U</Avatar>
              </Space>
            </Space>
          </Header>

          <Content
            style={{
              margin: "24px 16px",
              padding: 24,
              minHeight: 280,
              background: colorBgContainer,
              borderRadius: 8,
            }}
          >
            {renderContent()}
          </Content>
        </Layout>
      </Layout>

      {/* Inspector 模态框 */}
      {inspectorOpen.open && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.45)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setInspectorOpen({ open: false })}
        >
          <div
            style={{
              width: "95vw",
              height: "90vh",
              backgroundColor: colorBgContainer,
              borderRadius: 8,
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <InspectorPage
              sessionId={inspectorOpen.sessionId}
              stepId={inspectorOpen.stepId}
            />
          </div>
        </div>
      )}
    </AntApp>
  );
};

export const NativeAntDesignIntegration: React.FC = () => {
  // 顶层已有 ThemeBridge/ConfigProvider，这里仅保留业务 Provider，避免重复主题包裹
  return (
    <GlobalAdbProvider>
      <NativeAntDesignApp />
    </GlobalAdbProvider>
  );
};
