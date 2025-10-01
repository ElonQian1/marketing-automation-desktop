import React from 'react';
import { Card, Button, Space, Typography, Switch, Select, Tag, Alert, Input, Divider } from 'antd';
import { useTheme } from '../theme/ThemeBridge';
import type { ThemeConfig } from '../theme/ThemeBridge';

const { Title, Paragraph, Text } = Typography;

/**
 * Design Tokens Demo 页面
 * 
 * 展示完整的设计令牌系统功能：
 * 1. 主题切换（明亮/暗色）
 * 2. 密度模式（标准/紧凑）
 * 3. 所有令牌的实际应用效果
 */
export const DesignTokensDemo: React.FC = () => {
  const { mode, density, isDark, isCompact, setMode, setDensity, toggleTheme, toggleDensity } = useTheme();

  // 主题切换处理
  const handleThemeChange = (isDarkMode: boolean) => {
    if (isDarkMode) {
      setMode('dark');
    } else {
      setMode('light');
    }
  };

  // 密度切换处理
  const handleDensityChange = (value: string) => {
    const isCompactMode = value === 'compact';
    if (isCompactMode) {
      setDensity('compact');
    } else {
      setDensity('default');
    }
  };

  return (
    <div style={{ 
      padding: 'var(--space-6)',
      background: 'var(--bg-base)',
      minHeight: '100vh',
      fontFamily: 'var(--font-family)'
    }}>
      {/* 页面标题 */}
      <div style={{ 
        marginBottom: 'var(--space-8)',
        textAlign: 'center'
      }}>
        <Title level={1} style={{ 
          color: 'var(--text-1)',
          marginBottom: 'var(--space-2)'
        }}>
          🎨 Design Tokens 系统演示
        </Title>
        <Paragraph style={{ 
          color: 'var(--text-2)',
          fontSize: 'var(--text-lg)',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          展示基于 CSS 变量的设计令牌系统，统一管理颜色、间距、字体等设计元素，
          实现品牌一致性和主题切换功能。
        </Paragraph>
      </div>

      {/* 控制面板 */}
      <Card 
        title="🎛️ 主题控制面板" 
        style={{ 
          marginBottom: 'var(--space-6)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-2)'
        }}
      >
        <Space size="large" wrap>
          <div>
            <Text strong style={{ color: 'var(--text-1)' }}>主题模式：</Text>
            <Switch
              checkedChildren="🌙 暗色"
              unCheckedChildren="☀️ 明亮"
              onChange={handleThemeChange}
              style={{ marginLeft: 'var(--space-2)' }}
            />
          </div>
          
          <div>
            <Text strong style={{ color: 'var(--text-1)' }}>密度模式：</Text>
            <Select
              defaultValue="standard"
              onChange={handleDensityChange}
              style={{ 
                marginLeft: 'var(--space-2)',
                minWidth: '120px'
              }}
              options={[
                { label: '标准', value: 'standard' },
                { label: '紧凑', value: 'compact' }
              ]}
            />
          </div>
        </Space>
      </Card>

      {/* 颜色系统展示 */}
      <Card 
        title="🎨 颜色系统" 
        style={{ 
          marginBottom: 'var(--space-6)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-2)'
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
          
          {/* 品牌色 */}
          <div>
            <Title level={4} style={{ color: 'var(--text-1)' }}>品牌主色</Title>
            <div style={{ 
              background: 'var(--brand)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
              color: 'white',
              textAlign: 'center',
              fontWeight: 600
            }}>
              --brand: {getComputedStyle(document.documentElement).getPropertyValue('--brand')}
            </div>
          </div>

          {/* 背景色 */}
          <div>
            <Title level={4} style={{ color: 'var(--text-1)' }}>背景色系</Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ 
                background: 'var(--bg-base)',
                border: '1px solid var(--border-2)',
                padding: 'var(--space-2)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-sm)'
              }}>
                --bg-base (基础背景)
              </div>
              <div style={{ 
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-2)',
                padding: 'var(--space-2)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-sm)'
              }}>
                --bg-elevated (提升背景)
              </div>
            </Space>
          </div>

          {/* 文本色 */}
          <div>
            <Title level={4} style={{ color: 'var(--text-1)' }}>文本色系</Title>
            <Space direction="vertical">
              <Text style={{ color: 'var(--text-1)', fontSize: 'var(--text-base)' }}>
                主要文本 (--text-1)
              </Text>
              <Text style={{ color: 'var(--text-2)', fontSize: 'var(--text-base)' }}>
                次要文本 (--text-2)
              </Text>
              <Text style={{ color: 'var(--text-3)', fontSize: 'var(--text-base)' }}>
                辅助文本 (--text-3)
              </Text>
            </Space>
          </div>

        </div>
      </Card>

      {/* 组件展示 */}
      <Card 
        title="🧩 组件展示" 
        style={{ 
          marginBottom: 'var(--space-6)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-2)'
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          
          {/* 按钮组 */}
          <div>
            <Title level={4} style={{ color: 'var(--text-1)' }}>按钮组合</Title>
            <Space wrap>
              <Button type="primary">主要按钮</Button>
              <Button>默认按钮</Button>
              <Button type="dashed">虚线按钮</Button>
              <Button type="text">文本按钮</Button>
              <Button danger>危险按钮</Button>
            </Space>
          </div>

          {/* 表单组件 */}
          <div>
            <Title level={4} style={{ color: 'var(--text-1)' }}>表单组件</Title>
            <Space wrap>
              <Input placeholder="输入框示例" style={{ width: '200px' }} />
              <Select 
                placeholder="选择框示例"
                style={{ width: '150px' }}
                options={[
                  { label: '选项一', value: '1' },
                  { label: '选项二', value: '2' }
                ]}
              />
              <Switch defaultChecked />
            </Space>
          </div>

          {/* 状态标签 */}
          <div>
            <Title level={4} style={{ color: 'var(--text-1)' }}>状态标签</Title>
            <Space wrap>
              <Tag color="success">成功状态</Tag>
              <Tag color="processing">处理中</Tag>
              <Tag color="warning">警告状态</Tag>
              <Tag color="error">错误状态</Tag>
              <Tag>默认标签</Tag>
            </Space>
          </div>

        </Space>
      </Card>

      {/* 反馈组件 */}
      <Card 
        title="💬 反馈组件" 
        style={{ 
          marginBottom: 'var(--space-6)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-2)'
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Alert message="信息提示" description="这是一个信息提示的内容描述" type="info" showIcon />
          <Alert message="成功提示" description="这是一个成功提示的内容描述" type="success" showIcon />
          <Alert message="警告提示" description="这是一个警告提示的内容描述" type="warning" showIcon />
          <Alert message="错误提示" description="这是一个错误提示的内容描述" type="error" showIcon />
        </Space>
      </Card>

      {/* 间距系统 */}
      <Card 
        title="📏 间距系统" 
        style={{ 
          marginBottom: 'var(--space-6)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-2)'
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
          {['space-1', 'space-2', 'space-3', 'space-4', 'space-5', 'space-6'].map(space => (
            <div key={space} style={{ textAlign: 'center' }}>
              <Text style={{ color: 'var(--text-2)', fontSize: 'var(--text-sm)' }}>--{space}</Text>
              <div style={{
                background: 'var(--brand)',
                height: `var(--${space})`,
                width: `var(--${space})`,
                margin: 'var(--space-2) auto',
                borderRadius: 'var(--radius-sm)'
              }} />
              <Text style={{ color: 'var(--text-3)', fontSize: 'var(--text-xs)' }}>
                {getComputedStyle(document.documentElement).getPropertyValue(`--${space}`)}
              </Text>
            </div>
          ))}
        </div>
      </Card>

      {/* 架构信息 */}
      <Card 
        title="🏗️ 架构信息" 
        style={{ 
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-2)'
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
          
          <div>
            <Title level={4} style={{ color: 'var(--text-1)' }}>🎯 零覆盖原则</Title>
            <ul style={{ color: 'var(--text-2)', paddingLeft: 'var(--space-4)' }}>
              <li>禁止使用 .ant-* 选择器覆盖</li>
              <li>禁止使用 强制优先级 声明</li>
              <li>所有样式通过 CSS 变量管理</li>
              <li>ThemeBridge 统一集成 AntD</li>
            </ul>
          </div>

          <div>
            <Title level={4} style={{ color: 'var(--text-1)' }}>🔧 技术栈</Title>
            <ul style={{ color: 'var(--text-2)', paddingLeft: 'var(--space-4)' }}>
              <li>CSS Variables (设计令牌)</li>
              <li>Tailwind CSS v4 (工具类)</li>
              <li>AntD v5 ConfigProvider (主题)</li>
              <li>React Context (状态管理)</li>
            </ul>
          </div>

          <div>
            <Title level={4} style={{ color: 'var(--text-1)' }}>📊 当前状态</Title>
            <Space direction="vertical">
              <Tag color="success">✅ Design Tokens 已建立</Tag>
              <Tag color="success">✅ ThemeBridge 已集成</Tag>
              <Tag color="success">✅ 主题切换功能完整</Tag>
              <Tag color="processing">🔄 清理遗留覆盖中</Tag>
            </Space>
          </div>

        </div>

        <Divider style={{ margin: 'var(--space-5) 0' }} />

        <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
          <Text style={{ 
            color: 'var(--text-2)', 
            fontSize: 'var(--text-sm)',
            fontStyle: 'italic'
          }}>
            🎨 Design Tokens & 主题桥负责人 | 品牌一致性架构 | 零覆盖设计系统
          </Text>
        </div>
      </Card>

    </div>
  );
};