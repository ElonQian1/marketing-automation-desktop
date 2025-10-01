// src/pages/EmployeePage.refactored.tsx
// 员工管理页面 - 品牌化重构版本
// 使用 layout + patterns + ui + adapters 组合架构

import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import { PlusOutlined, UserOutlined } from '@ant-design/icons';

// Layout 层：页面编排
import { PageShell } from '@/components/layout/PageShell';

// Patterns 层：页面图元
import { FilterBar } from '@/components/patterns';

// UI 层：品牌化轻组件
import { Button, CardShell } from '@/components/ui';
import { FadeIn, SlideIn } from '@/components/ui/motion/MotionSystem';

// Adapters 层：AntD 重组件适配
import { TableAdapter } from '@/components/adapters';

// 业务逻辑
import { EmployeeAPI } from '../api';
import type { EmployeeData, EmployeeFormData } from '../types';

/**
 * 员工管理页面 - 品牌化重构版
 * 
 * 架构原则：
 * - 页面仅做编排，不写视觉硬编码
 * - 重组件通过 adapters 包装
 * - 轻组件使用品牌化 ui 组件
 * - 统一动效和 tokens 驱动
 */
export const EmployeePageRefactored: React.FC = () => {
  // === 状态管理 ===
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeData[]>([]);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeData | null>(null);
  const [isShowingForm, setIsShowingForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  // === 业务逻辑 ===
  
  // 加载员工列表
  const loadEmployees = async () => {
    try {
      setIsLoading(true);
      const data = await EmployeeAPI.getEmployees();
      setEmployees(data);
      setFilteredEmployees(data);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载员工列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 搜索过滤
  const handleSearch = (keyword: string) => {
    setSearchKeyword(keyword);
    if (!keyword.trim()) {
      setFilteredEmployees(employees);
      return;
    }
    
    const filtered = employees.filter(emp => 
      emp.name?.toLowerCase().includes(keyword.toLowerCase()) ||
      emp.email?.toLowerCase().includes(keyword.toLowerCase()) ||
      emp.position?.toLowerCase().includes(keyword.toLowerCase())
    );
    setFilteredEmployees(filtered);
  };

  // 添加员工
  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setIsShowingForm(true);
  };

  // 编辑员工
  const handleEditEmployee = (employee: EmployeeData) => {
    setEditingEmployee(employee);
    setIsShowingForm(true);
  };

  // 删除员工
  const handleDeleteEmployee = async (employeeId: string) => {
    try {
      await EmployeeAPI.deleteEmployee(Number(employeeId));
      message.success('删除成功');
      loadEmployees();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // === 数据准备 ===
  
  // 表格列定义
  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <span className="font-medium text-slate-900">{name}</span>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => (
        <span className="text-slate-600">{email}</span>
      ),
    },
    {
      title: '职位',
      dataIndex: 'position',
      key: 'position',
      render: (position: string) => (
        <span className="text-slate-700">{position}</span>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (record: EmployeeData) => (
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => handleEditEmployee(record)}
          >
            编辑
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => handleDeleteEmployee(String(record.id))}
          >
            删除
          </Button>
        </div>
      ),
    },
  ];

  // 组件初始化
  useEffect(() => {
    loadEmployees();
  }, []);

  // === 渲染层 ===
  return (
    <PageShell
      title="员工管理"
    >
      <FadeIn className="space-y-6">
        
        {/* 操作栏 - Patterns 层 */}
        <SlideIn direction="down">
          <CardShell variant="flat" className="p-4">
            <div className="flex items-center justify-between">
              <FilterBar
                searchValue={searchKeyword}
                onSearch={handleSearch}
              />
              
              <Button
                variant="primary"
                onClick={handleAddEmployee}
              >
                <PlusOutlined /> 添加员工
              </Button>
            </div>
          </CardShell>
        </SlideIn>

        {/* 数据统计 - UI 层 */}
        <SlideIn direction="up" className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CardShell variant="elevated" className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-brand-600">
                {employees.length}
              </div>
              <div className="text-sm text-slate-500">总员工数</div>
            </div>
          </CardShell>
          
          <CardShell variant="elevated" className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredEmployees.length}
              </div>
              <div className="text-sm text-slate-500">筛选结果</div>
            </div>
          </CardShell>
          
          <CardShell variant="elevated" className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {employees.length}
              </div>
              <div className="text-sm text-slate-500">活跃记录</div>
            </div>
          </CardShell>
        </SlideIn>

        {/* 员工表格 - Adapters 层 */}
        <SlideIn direction="up">
          <CardShell variant="elevated" className="overflow-hidden">
            <TableAdapter
              columns={columns}
              dataSource={filteredEmployees}
              rowKey="id"
              loading={isLoading}
              pagination={{
                total: filteredEmployees.length,
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
              }}
            />
          </CardShell>
        </SlideIn>
        
      </FadeIn>
    </PageShell>
  );
};

export default EmployeePageRefactored;