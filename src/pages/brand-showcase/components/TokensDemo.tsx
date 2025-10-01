/**
 * 设计令牌展示区
 */
import React from 'react';
import { Card } from '../../../components/ui/card/Card';

export const TokensDemo: React.FC = () => {
  const colorTokens = [
    { name: '--brand', label: '主品牌色', value: 'var(--brand)' },
    { name: '--success', label: '成功色', value: 'var(--success)' },
    { name: '--warning', label: '警告色', value: 'var(--warning)' },
    { name: '--error', label: '错误色', value: 'var(--error)' },
    { name: '--info', label: '信息色', value: 'var(--info)' },
  ];

  const backgroundTokens = [
    { name: '--bg-base', label: '基础背景', value: 'var(--bg-base)' },
    { name: '--bg-elevated', label: '浮层背景', value: 'var(--bg-elevated)' },
    { name: '--bg-secondary', label: '二级背景', value: 'var(--bg-secondary)' },
  ];

  const textTokens = [
    { name: '--text-1', label: '主文本', value: 'var(--text-1)' },
    { name: '--text-2', label: '次文本', value: 'var(--text-2)' },
    { name: '--text-3', label: '辅助文本', value: 'var(--text-3)' },
  ];

  return (
    <Card variant="elevated" className="p-6">
      <h3 className="text-lg font-semibold text-text-1 mb-4">设计令牌系统</h3>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 颜色令牌 */}
        <div>
          <h4 className="text-sm font-medium text-text-2 mb-3">功能色彩</h4>
          <div className="space-y-2">
            {colorTokens.map(({ name, label, value }) => (
              <div key={name} className="flex items-center gap-3">
                <div 
                  className="w-6 h-6 rounded-full border border-border-primary"
                  style={{ backgroundColor: value }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-text-1 font-medium">{label}</div>
                  <div className="text-xs text-text-3 font-mono">{name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 背景令牌 */}
        <div>
          <h4 className="text-sm font-medium text-text-2 mb-3">背景色彩</h4>
          <div className="space-y-2">
            {backgroundTokens.map(({ name, label, value }) => (
              <div key={name} className="flex items-center gap-3">
                <div 
                  className="w-6 h-6 rounded-md border border-border-primary"
                  style={{ backgroundColor: value }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-text-1 font-medium">{label}</div>
                  <div className="text-xs text-text-3 font-mono">{name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 文本令牌 */}
        <div>
          <h4 className="text-sm font-medium text-text-2 mb-3">文本色彩</h4>
          <div className="space-y-2">
            {textTokens.map(({ name, label, value }) => (
              <div key={name} className="flex items-center gap-3">
                <div className="text-lg font-medium" style={{ color: value }}>Aa</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-text-1 font-medium">{label}</div>
                  <div className="text-xs text-text-3 font-mono">{name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 阴影和圆角展示 */}
      <div className="mt-6 pt-6 border-t border-border-primary">
        <h4 className="text-sm font-medium text-text-2 mb-3">阴影与圆角</h4>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex flex-col items-center gap-2">
            <div 
              className="w-16 h-16 bg-background-elevated"
              style={{ 
                borderRadius: 'var(--radius-sm)', 
                boxShadow: 'var(--shadow-sm)' 
              }}
            />
            <span className="text-xs text-text-3">小阴影+小圆角</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div 
              className="w-16 h-16 bg-background-elevated"
              style={{ 
                borderRadius: 'var(--radius)', 
                boxShadow: 'var(--shadow)' 
              }}
            />
            <span className="text-xs text-text-3">标准阴影+圆角</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div 
              className="w-16 h-16 bg-background-elevated"
              style={{ 
                borderRadius: 'var(--radius-lg)', 
                boxShadow: 'var(--shadow-lg)' 
              }}
            />
            <span className="text-xs text-text-3">大阴影+大圆角</span>
          </div>
        </div>
      </div>
    </Card>
  );
};