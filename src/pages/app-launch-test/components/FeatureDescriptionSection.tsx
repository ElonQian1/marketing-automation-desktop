// src/pages/app-launch-test/components/FeatureDescriptionSection.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Card, Tag, theme } from 'antd';
import type { FeatureDescriptionProps } from '../types/AppLaunchTestTypes';

/**
 * 功能说明组件 - 显示功能特点和状态说明
 */
export const FeatureDescriptionSection: React.FC<FeatureDescriptionProps> = () => {
  const { token } = theme.useToken();

  return (
    <Card 
      title="功能说明" 
      style={{ 
        marginTop: token.margin,
        backgroundColor: token.colorBgContainer 
      }}
    >
      <div style={{ maxWidth: 'none' }}>
        <h4 style={{ 
          color: token.colorText, 
          fontSize: token.fontSizeLG,
          marginBottom: token.margin 
        }}>
          新的应用启动检测功能特点：
        </h4>
        <ul style={{ 
          paddingLeft: token.paddingMD, 
          color: token.colorText,
          marginBottom: token.marginLG 
        }}>
          <li><strong>多层次检测</strong>：从进程启动到UI就绪的完整检测链</li>
          <li><strong>智能超时</strong>：针对不同应用的自适应超时设置</li>
          <li><strong>状态识别</strong>：识别启动画面、权限弹窗、登录页面等中间状态</li>
          <li><strong>小红书专用</strong>：特别优化了小红书应用的首页检测逻辑</li>
          <li><strong>详细报告</strong>：提供完整的启动时间线和问题诊断</li>
        </ul>
        
        <h4 style={{ 
          color: token.colorText, 
          fontSize: token.fontSizeLG,
          marginBottom: token.margin 
        }}>
          支持的应用状态：
        </h4>
        <ul style={{ 
          paddingLeft: token.paddingMD, 
          display: 'flex',
          flexDirection: 'column',
          gap: token.marginXS,
          margin: 0
        }}>
          <li style={{ display: 'flex', alignItems: 'center', gap: token.marginXS }}>
            <Tag color="success">Ready</Tag> - 应用完全就绪，可以执行自动化操作
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: token.marginXS }}>
            <Tag color="processing">Loading</Tag> - 应用正在加载中
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: token.marginXS }}>
            <Tag color="warning">SplashScreen</Tag> - 停留在启动画面
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: token.marginXS }}>
            <Tag color="warning">PermissionDialog</Tag> - 需要处理权限弹窗
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: token.marginXS }}>
            <Tag color="warning">LoginRequired</Tag> - 需要用户登录
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: token.marginXS }}>
            <Tag color="warning">NetworkCheck</Tag> - 网络连接检查中
          </li>
        </ul>
      </div>
    </Card>
  );
};