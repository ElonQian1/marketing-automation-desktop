// src/pages/StrategyBackendDemo.tsx
// module: demo | layer: pages | role: 策略选择器真实后端集成演示
// summary: 展示策略选择器与真实智能分析后端的完整集成

import React, { useState } from 'react';
import SmartStepCardWithBackend from '../components/SmartStepCardWithBackend';
import { SmartScriptStep, DeviceInfo } from '../components/DraggableStepCard';
import type { UIElement } from '../api/universalUIAPI';

const StrategyBackendDemo: React.FC = () => {
  // Mock 设备数据
  const mockDevices: DeviceInfo[] = [
    { id: 'device1', name: 'Android Device 1', status: 'connected' as const },
    { id: 'device2', name: 'iPhone 12', status: 'connected' as const },
  ];

  // Mock 元素数据 - 模拟从XML分析中获取的元素信息
  const mockElement: UIElement = {
    id: 'login-button-element',
    xpath: '//android.widget.Button[@text="登录"]',
    text: '登录',
    bounds: { 
      left: 100, 
      top: 200, 
      right: 220, 
      bottom: 248
    },
    element_type: 'Button',
    resource_id: 'com.example.app:id/login_button',
    content_desc: '登录按钮',
    class_name: 'android.widget.Button',
    is_clickable: true,
    is_scrollable: false,
    is_enabled: true,
    is_focused: false,
    checkable: false,
    checked: false,
    selected: false,
    password: false
  };

  // Mock 步骤数据 - 启用策略选择器
  const [mockStep, setMockStep] = useState<SmartScriptStep>({
    id: 'step-backend-demo-1',
    name: '智能点击登录按钮（真实后端）',
    step_type: 'click',
    description: '使用真实智能分析后端的策略选择器演示',
    parameters: {
      element_selector: '//android.widget.Button[@text="登录"]',
      action_type: 'click',
      wait_after: 1000,
      strategy: 'standard'
    },
    enabled: true,
    enableStrategySelector: true,  // 启用策略选择器
    // 注意：strategySelector 将由 SmartStepCardWithBackend 通过 Hook 动态设置
  });

  // 步骤更新处理
  const handleStepUpdate = (updatedStep: SmartScriptStep) => {
    console.log('📝 [BackendDemo] 步骤更新:', updatedStep);
    setMockStep(updatedStep);
  };

  return (
    <div style={{
      padding: '20px',
      background: '#0F172A',
      minHeight: '100vh',
      color: '#F8FAFC'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <h1 style={{ 
          marginBottom: '20px',
          color: '#6E8BFF',
          textAlign: 'center'
        }}>
          🚀 策略选择器真实后端集成演示
        </h1>
        
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>真实后端功能：</h2>
          <ul style={{ 
            fontSize: '14px', 
            lineHeight: '1.6',
            color: '#CBD5E1',
            listStyle: 'none',
            padding: 0
          }}>
            <li>🔗 <strong>Tauri 后端集成</strong>：调用 Rust 后端的智能分析服务</li>
            <li>📊 <strong>实时进度监控</strong>：通过事件监听获取真实分析进度</li>
            <li>🧠 <strong>智能候选生成</strong>：Step1~Step6 真实分析结果</li>
            <li>📌 <strong>静态策略管理</strong>：与用户策略库真实交互</li>
            <li>✨ <strong>推荐算法</strong>：基于置信度的智能推荐</li>
            <li>⚡ <strong>任务管理</strong>：支持取消、重试等完整任务控制</li>
          </ul>
        </div>

        <div style={{
          background: '#1E293B',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #334155',
          marginBottom: '20px'
        }}>
          <h3 style={{ 
            margin: '0 0 15px 0', 
            color: '#60A5FA',
            fontSize: '16px'
          }}>
            📋 当前元素上下文
          </h3>
          <div style={{ 
            background: '#0F172A', 
            padding: '12px', 
            borderRadius: '6px',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}>
            <div><strong>XPath:</strong> {mockElement.xpath}</div>
            <div><strong>Text:</strong> {mockElement.text}</div>
            <div><strong>Resource ID:</strong> {mockElement.resource_id}</div>
            <div><strong>Class:</strong> {mockElement.class_name}</div>
            <div><strong>Bounds:</strong> {JSON.stringify(mockElement.bounds)}</div>
          </div>
        </div>

        <div style={{
          background: '#1E293B',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #334155'
        }}>
          <SmartStepCardWithBackend
            step={mockStep}
            index={0}
            devices={mockDevices}
            currentDeviceId="device1"
            element={mockElement}
            onEdit={(step) => {
              console.log('编辑步骤:', step);
              setMockStep(step);
            }}
            onDelete={(id) => console.log('删除步骤:', id)}
            onToggle={(id) => {
              console.log('切换启用状态:', id);
              setMockStep(prev => ({ ...prev, enabled: !prev.enabled }));
            }}
            onStepUpdate={handleStepUpdate}
          />
        </div>

        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: '#334155',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#E2E8F0'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#F8FAFC' }}>🔧 后端集成特性：</h3>
          <p style={{ margin: '5px 0' }}>• <strong>真实分析</strong>：点击"🔄 重新分析"调用 Rust 后端智能分析</p>
          <p style={{ margin: '5px 0' }}>• <strong>实时进度</strong>：分析进度通过 Tauri 事件实时更新</p>
          <p style={{ margin: '5px 0' }}>• <strong>候选策略</strong>：智能和静态策略来自真实后端分析</p>
          <p style={{ margin: '5px 0' }}>• <strong>推荐系统</strong>：基于置信度的智能推荐算法</p>
          <p style={{ margin: '5px 0' }}>• <strong>任务控制</strong>：支持取消正在进行的分析任务</p>
          <p style={{ margin: '5px 0' }}>• <strong>策略保存</strong>：将智能策略保存为用户静态策略</p>
        </div>

        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: '#059669',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#F0FDF4'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#F0FDF4' }}>
            ✅ 与演示版本的区别：
          </h3>
          <p style={{ margin: '5px 0' }}>• <strong>数据来源</strong>：真实后端分析 vs 模拟数据</p>
          <p style={{ margin: '5px 0' }}>• <strong>进度更新</strong>：事件驱动 vs 定时器模拟</p>
          <p style={{ margin: '5px 0' }}>• <strong>策略质量</strong>：算法生成 vs 随机生成</p>
          <p style={{ margin: '5px 0' }}>• <strong>任务管理</strong>：真实job管理 vs 前端状态</p>
          <p style={{ margin: '5px 0' }}>• <strong>持久化</strong>：数据库存储 vs 内存状态</p>
        </div>
      </div>
    </div>
  );
};

export default StrategyBackendDemo;