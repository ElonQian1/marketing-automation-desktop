// src/pages/StrategyDemo.tsx
// module: demo | layer: pages | role: 策略选择器演示页面
// summary: 展示步骤卡片中集成的策略选择器功能

import React, { useState } from 'react';
import DraggableStepCard from '../components/DraggableStepCard';
import { SmartScriptStep } from '../components/DraggableStepCard';
import { StrategySelector as IStrategySelector, StrategyCandidate, StrategyType } from '../types/strategySelector';

const StrategyDemo: React.FC = () => {
  // Mock 设备数据
  const mockDevices = [
    { id: 'device1', name: 'Android Device 1', status: 'connected' as const },
    { id: 'device2', name: 'iPhone 12', status: 'connected' as const },
  ];

  // Mock 策略选择器数据
  const mockStrategySelector: IStrategySelector = {
    activeStrategy: {
      type: 'smart-auto'
    },
    analysis: {
      status: 'completed'
    },
    candidates: {
      smart: [
        {
          key: 'smart-auto-1',
          type: 'smart',
          name: '智能自动链策略',
          confidence: 0.89,
          selector: '//android.widget.Button[@text="登录"]',
          description: 'Step1→Step6 动态决策，置信度高',
          stepName: 'step3',
          estimatedTime: 150,
          riskLevel: 'low'
        },
        {
          key: 'smart-step4',
          type: 'smart',
          name: '语义理解策略',
          confidence: 0.76,
          selector: '//*[contains(@text, "登录") and @clickable="true"]',
          description: 'Step4 语义理解匹配',
          stepName: 'step4',
          estimatedTime: 200,
          riskLevel: 'medium'
        }
      ],
      static: [
        {
          key: 'static-xpath-1',
          type: 'static',
          name: '绝对XPath',
          confidence: 0.95,
          selector: '/hierarchy/android.widget.FrameLayout[1]/android.widget.LinearLayout[1]/android.widget.Button[2]',
          description: '用户保存的静态XPath策略',
          estimatedTime: 50,
          riskLevel: 'high'
        }
      ]
    },
    recommended: {
      key: 'smart-auto-1',
      confidence: 0.89
    },
    config: {
      autoFollowSmart: true,
      confidenceThreshold: 0.82,
      enableFallback: true
    }
  };

  // Mock 步骤数据 - 包含策略选择器
  const [mockStep, setMockStep] = useState<SmartScriptStep>({
    id: 'step-demo-1',
    name: '智能点击登录按钮',
    step_type: 'click',
    description: '演示策略选择器功能的步骤',
    parameters: {
      element_selector: '//android.widget.Button[@text="登录"]',
      action_type: 'click',
      wait_after: 1000,
      strategy: 'standard'
    },
    enabled: true,
    enableStrategySelector: true,  // 启用策略选择器
    strategySelector: mockStrategySelector
  });

  // 策略选择器事件处理
  const handleStrategyChange = (stepId: string, selection: { type: StrategyType; key?: string }) => {
    console.log('策略变更:', stepId, selection);
    setMockStep(prev => ({
      ...prev,
      strategySelector: {
        ...prev.strategySelector!,
        activeStrategy: selection
      }
    }));
  };

  const handleReanalyze = (stepId: string) => {
    console.log('重新分析:', stepId);
    setMockStep(prev => ({
      ...prev,
      strategySelector: {
        ...prev.strategySelector!,
        analysis: {
          status: 'analyzing',
          progress: 0,
          eta: 3000
        }
      }
    }));

    // 模拟分析进度
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      if (progress <= 100) {
        setMockStep(prev => ({
          ...prev,
          strategySelector: {
            ...prev.strategySelector!,
            analysis: {
              status: 'analyzing',
              progress,
              eta: Math.max(0, 3000 - progress * 30)
            }
          }
        }));
      } else {
        clearInterval(interval);
        setMockStep(prev => ({
          ...prev,
          strategySelector: {
            ...prev.strategySelector!,
            analysis: {
              status: 'completed',
              progress: 100,
              completedAt: new Date()
            }
          }
        }));
      }
    }, 200);
  };

  const handleSaveAsStatic = (stepId: string, candidate: StrategyCandidate) => {
    console.log('保存为静态策略:', stepId, candidate);
  };

  const handleOpenElementInspector = (stepId: string) => {
    console.log('打开元素检查器:', stepId);
  };

  const handleCancelAnalysis = (stepId: string, jobId: string) => {
    console.log('取消分析:', stepId, jobId);
    setMockStep(prev => ({
      ...prev,
      strategySelector: {
        ...prev.strategySelector!,
        analysis: {
          status: 'idle'
        }
      }
    }));
  };

  const handleApplyRecommendation = (stepId: string, key: string) => {
    console.log('应用推荐策略:', stepId, key);
    const candidate = [...mockStrategySelector.candidates.smart, ...mockStrategySelector.candidates.static]
      .find(c => c.key === key);
    
    if (candidate) {
      setMockStep(prev => ({
        ...prev,
        strategySelector: {
          ...prev.strategySelector!,
          activeStrategy: {
            type: candidate.type === 'smart' ? 'smart-auto' : 'static',
            key: candidate.key
          },
          recommended: {
            ...prev.strategySelector!.recommended!,
            autoApplied: true,
            appliedAt: new Date()
          }
        }
      }));
    }
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
          🧠 步骤卡片策略选择器演示
        </h1>
        
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>功能说明：</h2>
          <ul style={{ 
            fontSize: '14px', 
            lineHeight: '1.6',
            color: '#CBD5E1',
            listStyle: 'none',
            padding: 0
          }}>
            <li>🎯 <strong>智能·自动链</strong>：Step1→Step6 动态决策，必要时回退全局索引兜底</li>
            <li>🧠 <strong>智能·单步</strong>：从 Step1~Step6 指定某一步强制使用</li>
            <li>📌 <strong>静态策略</strong>：用户保存/自建的固定策略</li>
            <li>✨ <strong>智能推荐</strong>：分析完成后显示置信度最高的策略</li>
            <li>🔄 <strong>实时分析</strong>：支持重新分析和进度显示</li>
          </ul>
        </div>

        <div style={{
          background: '#1E293B',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #334155'
        }}>
          <DraggableStepCard
            step={mockStep}
            index={0}
            devices={mockDevices}
            currentDeviceId="device1"
            onEdit={(step) => console.log('编辑步骤:', step)}
            onDelete={(id) => console.log('删除步骤:', id)}
            onToggle={(id) => {
              console.log('切换启用状态:', id);
              setMockStep(prev => ({ ...prev, enabled: !prev.enabled }));
            }}
            onStrategyChange={handleStrategyChange}
            onReanalyze={handleReanalyze}
            onSaveAsStatic={handleSaveAsStatic}
            onOpenElementInspector={handleOpenElementInspector}
            onCancelAnalysis={handleCancelAnalysis}
            onApplyRecommendation={handleApplyRecommendation}
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
          <h3 style={{ margin: '0 0 10px 0', color: '#F8FAFC' }}>操作提示：</h3>
          <p style={{ margin: '5px 0' }}>• 点击不同的策略类型按钮切换模式</p>
          <p style={{ margin: '5px 0' }}>• 在"智能·单步"模式下选择具体的Step步骤</p>
          <p style={{ margin: '5px 0' }}>• 点击"🔄 重新分析"查看分析进度效果</p>
          <p style={{ margin: '5px 0' }}>• 点击"📋 查看候选"展开策略列表</p>
          <p style={{ margin: '5px 0' }}>• 点击"一键升级"应用推荐策略</p>
        </div>
      </div>
    </div>
  );
};

export default StrategyDemo;