/**
 * 标签组件演示区
 */
import React from 'react';
import { TagPill } from '../../../components/ui/TagPill';
import { Card } from '../../../components/ui/card/Card';

export const TagDemo: React.FC = () => {
  return (
    <Card variant="default" className="p-6">
      <h3 className="text-lg font-semibold text-text-1 mb-4">标签组件演示 - 品牌渐变效果</h3>
      <div className="space-y-6">
        {/* 品牌标签 */}
        <div>
          <h4 className="text-sm font-medium text-text-2 mb-3">品牌标签（商业化渐变）</h4>
          <div className="flex items-center gap-3 flex-wrap">
            <TagPill variant="brand">VIP 用户</TagPill>
            <TagPill variant="brand">热门账号</TagPill>
            <TagPill variant="brand">官方认证</TagPill>
          </div>
        </div>

        {/* 状态标签 */}
        <div>
          <h4 className="text-sm font-medium text-text-2 mb-3">状态标签</h4>
          <div className="flex items-center gap-3 flex-wrap">
            <TagPill variant="success">已激活</TagPill>
            <TagPill variant="warning">待审核</TagPill>
            <TagPill variant="error">已禁用</TagPill>
            <TagPill variant="info">审核中</TagPill>
          </div>
        </div>

        {/* 基础标签 */}
        <div>
          <h4 className="text-sm font-medium text-text-2 mb-3">基础标签</h4>
          <div className="flex items-center gap-3 flex-wrap">
            <TagPill variant="neutral">默认标签</TagPill>
            <TagPill variant="outline">轮廓标签</TagPill>
            <TagPill variant="solid">实心标签</TagPill>
          </div>
        </div>
      </div>
    </Card>
  );
};