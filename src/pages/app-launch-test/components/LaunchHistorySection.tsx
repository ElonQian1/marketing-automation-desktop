import React from 'react';
import { Card, Timeline, Tag, theme } from 'antd';
import type { LaunchHistoryProps } from '../types/AppLaunchTestTypes';

/**
 * 启动历史记录组件 - 显示启动历史记录的时间线
 */
export const LaunchHistorySection: React.FC<LaunchHistoryProps> = ({
  launchHistory,
  apps,
  getStateColor,
  getStateText,
}) => {
  const { token } = theme.useToken();

  if (launchHistory.length === 0) {
    return null;
  }

  return (
    <Card 
      title="启动历史" 
      style={{ 
        marginTop: token.margin, 
        backgroundColor: token.colorBgContainer 
      }}
    >
      <Timeline>
        {launchHistory.map((result, index) => (
          <Timeline.Item 
            key={index}
            color={result.success ? 'green' : 'red'}
          >
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between' 
              }}
            >
              <div>
                <span style={{ fontWeight: token.fontWeightStrong }}>
                  {apps.find(app => app.package_name === result.package_name)?.app_name || result.package_name}
                </span>
                <span 
                  style={{ 
                    marginLeft: token.marginXS, 
                    fontSize: token.fontSizeSM, 
                    color: token.colorTextTertiary 
                  }}
                >
                  {result.launch_time_ms}ms
                </span>
                {result.app_state && (
                  <Tag 
                    color={getStateColor(result.app_state.state)} 
                    style={{ 
                      marginLeft: token.marginXS, 
                      fontSize: token.fontSizeXS 
                    }}
                  >
                    {getStateText(result.app_state.state)}
                  </Tag>
                )}
              </div>
              <span 
                style={{ 
                  fontSize: token.fontSizeXS, 
                  color: token.colorTextQuaternary 
                }}
              >
                {new Date().toLocaleTimeString()}
              </span>
            </div>
            <p 
              style={{ 
                fontSize: token.fontSizeSM, 
                color: token.colorTextSecondary, 
                marginTop: token.marginXXS,
                margin: `${token.marginXXS}px 0 0 0`
              }}
            >
              {result.message}
            </p>
          </Timeline.Item>
        ))}
      </Timeline>
    </Card>
  );
};