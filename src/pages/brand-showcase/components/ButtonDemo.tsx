/**
 * 按钮组件演示区
 */
import React from 'react';
import { Plus, Users, Smartphone, TrendingUp } from 'lucide-react';
import { Button } from '../../../components/ui/button/Button';
import { Card } from '../../../components/ui/card/Card';

export const ButtonDemo: React.FC = () => {
  return (
    <Card variant="default" className="p-6">
      <h3 className="text-lg font-semibold text-text-1 mb-4">按钮组件演示</h3>
      <div className="space-y-6">
        {/* 主要按钮 */}
        <div>
          <h4 className="text-sm font-medium text-text-2 mb-3">主要按钮</h4>
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="default" size="lg">
              <Plus className="w-4 h-4 mr-2" />
              创建员工
            </Button>
            <Button variant="default">
              <Users className="w-4 h-4 mr-2" />
              管理团队
            </Button>
            <Button variant="default" size="sm">
              <Smartphone className="w-4 h-4 mr-2" />
              设备管理
            </Button>
            <Button variant="default" size="sm">保存</Button>
          </div>
        </div>

        {/* 次要按钮 */}
        <div>
          <h4 className="text-sm font-medium text-text-2 mb-3">次要按钮</h4>
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="outline" size="lg">
              <TrendingUp className="w-4 h-4 mr-2" />
              查看报告
            </Button>
            <Button variant="outline">导出数据</Button>
            <Button variant="outline" size="sm">取消</Button>
            <Button variant="ghost">跳过</Button>
            <Button variant="destructive" size="sm">删除</Button>
          </div>
        </div>

        {/* 状态演示 */}
        <div>
          <h4 className="text-sm font-medium text-text-2 mb-3">状态演示</h4>
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="default" loading>加载中...</Button>
            <Button variant="outline" disabled>已禁用</Button>
            <Button variant="ghost" loading size="sm">处理中</Button>
          </div>
        </div>
      </div>
    </Card>
  );
};