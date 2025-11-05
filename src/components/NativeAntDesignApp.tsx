// src/components/NativeAntDesignApp.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 原生Ant Design主应用组件
 * 移除所有自定义样式，使用纯原生Ant Design组件和样式
 */

import React, { useState, useEffect } from "react";
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
  Dropdown,
  Tag,
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
  ThunderboltOutlined,
  BugOutlined,
  UserOutlined,
  LogoutOutlined,
  ClockCircleOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";

import { GlobalAdbProvider } from "../providers";
import { featureFlags } from "../config/featureFlags";
import { EnhancedThemeProvider } from "../components/feature-modules/theme-system";
import { useAuthStore } from "../stores/authStore";

// 页面组件导入
import InspectorPage from "../pages/InspectorPage";
import AdbCenterPage from "../pages/adb/AdbCenterPage";
import SmartScriptBuilderPageNativeWrapper from "../pages/native-wrappers/SmartScriptBuilderPage.native";
import SmartVcfImporter from "./SmartVcfImporter";
import TemplateLibrary from "./template/TemplateLibrary";
import ContactImportPage from "../pages/contact-import/ContactImportPage";
import DatabaseDebugPage from "../pages/debug/DatabaseDebug";
import { XmlCacheDebugPanel } from "./debug/XmlCacheDebugPanel";
import { PageFinderView } from "./universal-ui/page-finder";
import { ThemeSettingsPage } from "../pages/ThemeSettingsPage";
import { NativeAntDashboard } from "./native-dashboard/NativeAntDashboard";
import EmployeePageNativeWrapper from "../pages/native-wrappers/EmployeePage.native";



import { SemanticAnalyzerSettingsPage } from "../pages/SemanticAnalyzerSettingsPage";
import { TextMatchingSettingsPage } from "../pages/TextMatchingSettingsPage";

// 业务页面导入
import { StatisticsPageNative } from "../pages/statistics/StatisticsPageNative";
import { DeviceManagementPageNative } from "../pages/device-management/DeviceManagementPageNative";
import { LoginPageNative } from "../pages/auth/LoginPageNative";
import { PreciseAcquisitionPage } from "../pages/precise-acquisition/PreciseAcquisitionPage";

// 优化后的商业化页面
import { StatisticsPageOptimized } from "../pages/statistics/StatisticsPageOptimized";
import { DeviceManagementPageOptimized } from "../pages/device-management/DeviceManagementPageOptimized";

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const NativeAntDesignApp: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState<{
    open: boolean;
    sessionId?: string;
    stepId?: string;
  }>({ open: false });

  // 🆕 认证相关
  const { user, logout, getTrialDaysRemaining } = useAuthStore();
  const trialDaysRemaining =
    user?.role === "trial" ? getTrialDaysRemaining() : -1;

  const {
    token: { colorBgContainer },
  } = theme.useToken();

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
    ...(import.meta.env.DEV
      ? [
          {
            key: "database-debug",
            icon: <SecurityScanOutlined />,
            label: "🗄️ 数据库调试",
          },
          {
            key: "xml-cache-debug",
            icon: <BugOutlined />,
            label: "📄 XML缓存调试",
          },
        ]
      : []),
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
      key: "semantic-analyzer-settings",
      icon: <SettingOutlined />,
      label: "🧠 语义分析器设置",
    },
    {
      key: "text-matching-settings",
      icon: <ThunderboltOutlined />,
      label: "📝 文本匹配设置",
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
        return WatchTargetsListComp ? (
          <WatchTargetsListComp />
        ) : (
          <div>加载中...</div>
        );
      case "database-debug":
        return <DatabaseDebugPage />;
      case "xml-cache-debug":
        return <XmlCacheDebugPanel />;
      case "smart-vcf":
        return <SmartVcfImporter />;
      case "smart-script-builder":
        return <SmartScriptBuilderPageNativeWrapper />;
      case "template-library":
        return <TemplateLibrary />;
      case "page-finder":
        return <PageFinderView />;
      case "theme-settings":
        return <ThemeSettingsPage />;
      case "semantic-analyzer-settings":
        return <SemanticAnalyzerSettingsPage />;
      case "text-matching-settings":
        return <TextMatchingSettingsPage />;
      case "statistics-native":
        return <StatisticsPageNative />;
      case "statistics-optimized":
        return <StatisticsPageOptimized />;
      case "device-management-native":
        return <DeviceManagementPageNative />;
      case "device-management-optimized":
        return <DeviceManagementPageOptimized />;
      case "login-native":
        return <LoginPageNative />;
      case "employee-native":
        return <EmployeePageNativeWrapper />;
      default:
        return <NativeAntDashboard />;
    }
  };

  // 动态导入 WatchTargetsListPage，避免主包体积膨胀
  const [WatchTargetsListComp, setWatchTargetsListComp] =
    useState<React.ComponentType | null>(null);

  useEffect(() => {
    if (selectedKey === "watch-targets" && !WatchTargetsListComp) {
      import("../pages/precise-acquisition/WatchTargetsListPage").then((m) => {
        setWatchTargetsListComp(() => m.default);
      });
    }
  }, [selectedKey, WatchTargetsListComp]);

  return (
    <AntApp
      message={{ maxCount: 3 }}
      notification={{ maxCount: 3, placement: "topRight" }}
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

                {/* 🆕 用户信息下拉菜单 */}
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: "user-info",
                        label: (
                          <Space
                            direction="vertical"
                            size="small"
                            style={{ padding: "8px 0" }}
                          >
                            <div>
                              <strong>{user?.username}</strong>
                              {user?.role === "admin" && (
                                <Tag color="blue" style={{ marginLeft: 8 }}>
                                  管理员
                                </Tag>
                              )}
                              {user?.role === "trial" && (
                                <Tag color="orange" style={{ marginLeft: 8 }}>
                                  试用
                                </Tag>
                              )}
                            </div>
                            {user?.email && (
                              <div style={{ fontSize: 12, color: "#999" }}>
                                {user.email}
                              </div>
                            )}
                            {trialDaysRemaining >= 0 && (
                              <div style={{ fontSize: 12 }}>
                                <ClockCircleOutlined
                                  style={{ marginRight: 4 }}
                                />
                                试用期剩余{" "}
                                <strong
                                  style={{
                                    color:
                                      trialDaysRemaining <= 3
                                        ? "#ff4d4f"
                                        : "#faad14",
                                  }}
                                >
                                  {trialDaysRemaining}
                                </strong>{" "}
                                天
                              </div>
                            )}
                          </Space>
                        ),
                        disabled: true,
                      },
                      {
                        type: "divider",
                      },
                      {
                        key: "logout",
                        icon: <LogoutOutlined />,
                        label: "退出登录",
                        onClick: () => {
                          logout();
                        },
                      },
                    ],
                  }}
                  placement="bottomRight"
                >
                  <Space style={{ cursor: "pointer" }}>
                    <Avatar
                      style={{
                        backgroundColor:
                          user?.role === "admin" ? "#1677ff" : "#faad14",
                      }}
                      icon={<UserOutlined />}
                    >
                      {user?.username?.[0]?.toUpperCase() || "U"}
                    </Avatar>
                  </Space>
                </Dropdown>
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
    <EnhancedThemeProvider>
      <GlobalAdbProvider>
        <NativeAntDesignApp />
      </GlobalAdbProvider>
    </EnhancedThemeProvider>
  );
};
