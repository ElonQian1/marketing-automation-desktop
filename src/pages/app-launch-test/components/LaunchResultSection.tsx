// src/pages/app-launch-test/components/LaunchResultSection.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Card, Alert, Progress, Tag, Spin, theme } from 'antd';
import type { LaunchResultProps } from '../types/AppLaunchTestTypes';

/**
 * 启动结果组件 - 显示应用启动结果、状态、进度等信息
 */
export const LaunchResultSection: React.FC<LaunchResultProps> = ({
  isLaunching,
  launchResult,
  getStateColor,
  getStateText,
}) => {
  const { token } = theme.useToken();

  return (
    <Card 
      title="启动结果" 
      className="h-fit"
      style={{ backgroundColor: token.colorBgContainer }}
    >
      {isLaunching && (
        <div style={{ textAlign: 'center', padding: token.paddingLG }}>
          <Spin size="large" />
          <p style={{ marginTop: token.margin, color: token.colorTextSecondary, margin: `${token.margin}px 0 0 0` }}>
            正在启动应用并检测状态...
          </p>
          <p style={{ fontSize: token.fontSizeSM, color: token.colorTextTertiary, margin: 0 }}>
            这可能需要15-45秒
          </p>
        </div>
      )}

      {launchResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: token.margin }}>
          <Alert
            type={launchResult.success ? 'success' : 'error'}
            message={launchResult.success ? '启动成功' : '启动失败'}
            description={launchResult.message}
            showIcon
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: token.margin }}>
            <div 
              style={{ 
                backgroundColor: token.colorFillSecondary, 
                padding: token.paddingSM, 
                borderRadius: token.borderRadius 
              }}
            >
              <p style={{ fontSize: token.fontSizeSM, color: token.colorTextSecondary, margin: 0 }}>
                启动时间
              </p>
              <p style={{ fontSize: token.fontSizeLG, fontWeight: token.fontWeightStrong, margin: 0 }}>
                {launchResult.launch_time_ms}ms
              </p>
            </div>
            {launchResult.ready_time_ms && (
              <div 
                style={{ 
                  backgroundColor: token.colorFillSecondary, 
                  padding: token.paddingSM, 
                  borderRadius: token.borderRadius 
                }}
              >
                <p style={{ fontSize: token.fontSizeSM, color: token.colorTextSecondary, margin: 0 }}>
                  就绪时间
                </p>
                <p style={{ fontSize: token.fontSizeLG, fontWeight: token.fontWeightStrong, margin: 0 }}>
                  {launchResult.ready_time_ms}ms
                </p>
              </div>
            )}
          </div>

          {launchResult.app_state && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: token.marginSM }}>
              <div>
                <p 
                  style={{ 
                    fontSize: token.fontSizeSM, 
                    fontWeight: token.fontWeightStrong,
                    color: token.colorText,
                    marginBottom: token.marginXS 
                  }}
                >
                  应用状态
                </p>
                <Tag 
                  color={getStateColor(launchResult.app_state.state)} 
                  style={{ fontSize: token.fontSizeSM }}
                >
                  {getStateText(launchResult.app_state.state)}
                </Tag>
              </div>

              <div>
                <p 
                  style={{ 
                    fontSize: token.fontSizeSM, 
                    fontWeight: token.fontWeightStrong,
                    color: token.colorText,
                    marginBottom: token.marginXS 
                  }}
                >
                  检测进度
                </p>
                <Progress 
                  percent={Math.round((launchResult.app_state.checked_elements / launchResult.app_state.total_checks) * 100)}
                  format={() => `${launchResult.app_state?.checked_elements}/${launchResult.app_state?.total_checks}`}
                />
              </div>

              <div>
                <p 
                  style={{ 
                    fontSize: token.fontSizeSM, 
                    fontWeight: token.fontWeightStrong,
                    color: token.colorText,
                    marginBottom: token.marginXS 
                  }}
                >
                  状态消息
                </p>
                <p 
                  style={{ 
                    fontSize: token.fontSizeSM, 
                    color: token.colorTextSecondary, 
                    backgroundColor: token.colorFillSecondary, 
                    padding: token.paddingXS, 
                    borderRadius: token.borderRadius,
                    margin: 0
                  }}
                >
                  {launchResult.app_state.message}
                </p>
              </div>
            </div>
          )}

          {launchResult.startup_issues.length > 0 && (
            <div>
              <p 
                style={{ 
                  fontSize: token.fontSizeSM, 
                  fontWeight: token.fontWeightStrong,
                  color: token.colorText,
                  marginBottom: token.marginXS 
                }}
              >
                启动问题
              </p>
              <ul style={{ fontSize: token.fontSizeSM, color: token.colorError, paddingLeft: token.paddingMD, margin: 0 }}>
                {launchResult.startup_issues.map((issue, index) => (
                  <li key={index}>• {issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};