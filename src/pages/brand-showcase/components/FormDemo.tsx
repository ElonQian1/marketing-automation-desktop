// src/pages/brand-showcase/components/FormDemo.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 表单组件演示区
 */
import React from 'react';
import { Input } from '../../../components/ui/forms/Input';
import { Select } from '../../../components/ui/forms/Select';
import { Button } from '../../../components/ui/button/Button';
import { Card } from '../../../components/ui/card/Card';

export const FormDemo: React.FC = () => {
  return (
    <Card variant="default" className="p-6">
      <h3 className="text-lg font-semibold text-text-1 mb-4">表单组件演示 - 聚焦发光效果</h3>
      <div className="space-y-6">
        {/* 基础表单控件 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-1 mb-2">
              员工姓名
            </label>
            <Input placeholder="请输入员工姓名" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-1 mb-2">
              所属部门
            </label>
            <Select placeholder="选择部门">
              <option value="marketing">营销部</option>
              <option value="operations">运营部</option>
              <option value="support">客服部</option>
            </Select>
          </div>
        </div>

        {/* 复合表单 */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-1 mb-2">
              联系电话
            </label>
            <Input placeholder="请输入手机号" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-1 mb-2">
              邮箱地址
            </label>
            <Input type="email" placeholder="employee@company.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-1 mb-2">
              入职日期
            </label>
            <Input type="date" />
          </div>
        </div>

        {/* 表单操作 */}
        <div className="flex justify-end gap-3">
          <Button variant="outline">取消</Button>
          <Button variant="default">保存信息</Button>
        </div>
      </div>
    </Card>
  );
};