// 文件路径：src/pages/EmployeePageBrandNew.tsx
// 员工管理页面 - 品牌化重构版本 (简化版)
// 严格遵循品牌化架构：layout + patterns + ui + adapters

import React, { useState, useEffect } from 'react';
import { PlusOutlined, UserOutlined, ReloadOutlined } from '@ant-design/icons';
import { Space, Alert, Row, Col, Modal } from 'antd';

// Layout Layer - 页面布局组件
import { PageShell } from '../components/layout/PageShell';

// UI Layer - 品牌化轻组件
import { Button } from '../components/ui/button/Button';
import { CardShell } from '../components/ui/CardShell';
import { TagPill } from '../components/ui/TagPill';

// Business Layer - 现有组件和API
import { EmployeeAPI } from '../api';
import { EmployeeTable, EmployeeForm } from '../components';
import type { EmployeeData, EmployeeFormData } from '../types';

/**
 * 员工管理页面 - 品牌化重构版本
 * 
 * 架构原则：
 * - Layout: PageShell 提供页面容器
 * - UI: 品牌化轻组件 (Button, CardShell, TagPill)
 * - 适配现有: 保留EmployeeTable和EmployeeForm，逐步重构
 * - 禁止 .ant-* 覆盖和 !important
 * - 文件 ≤ 500行
 */
export const EmployeePageBrandNew: React.FC = () => {
  // 状态管理
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeData | null>(null);
  const [isShowingForm, setIsShowingForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 计算员工统计 (简化版 - 不依赖status字段)
  const stats = React.useMemo(() => {
    const total = employees.length;
    return { total };
  }, [employees]);

  // 数据加载
  const loadEmployees = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await EmployeeAPI.getEmployees();
      setEmployees(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : '加载员工列表失败');
      console.error('Failed to load employees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadEmployees();
  }, []);

  // 员工操作处理函数
  const handleAddEmployee = async (employeeData: EmployeeFormData) => {
    try {
      setIsFormLoading(true);
      setError(null);
      await EmployeeAPI.addEmployee(employeeData);
      await loadEmployees();
      setIsShowingForm(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : '添加员工失败');
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleEditEmployee = async (employeeData: EmployeeFormData) => {
    if (!editingEmployee) return;

    try {
      setIsFormLoading(true);
      setError(null);
      await EmployeeAPI.updateEmployee(editingEmployee);
      await loadEmployees();
      setEditingEmployee(null);
      setIsShowingForm(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : '更新员工失败');
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleDeleteEmployee = async (employeeId: number) => {
    try {
      setError(null);
      await EmployeeAPI.deleteEmployee(employeeId);
      await loadEmployees();
    } catch (error) {
      setError(error instanceof Error ? error.message : '删除员工失败');
    }
  };

  // UI 事件处理
  const handleOpenAddForm = () => {
    setEditingEmployee(null);
    setIsShowingForm(true);
  };

  const handleOpenEditForm = (employee: EmployeeData) => {
    setEditingEmployee(employee);
    setIsShowingForm(true);
  };

  const handleCloseForm = () => {
    setIsShowingForm(false);
    setEditingEmployee(null);
  };

  return (
    <PageShell className="p-6">
      {/* 页面标题区域 - 品牌化设计 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 bg-brand/10 rounded-[var(--radius)] text-brand">
              <UserOutlined className="text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white mb-1">员工管理</h1>
              <p className="text-sm text-gray-400">管理团队成员信息，维护组织架构</p>
            </div>
          </div>
          
          {/* 统计标签 - 使用品牌化 TagPill */}
          <div className="flex items-center gap-2">
            <TagPill variant="brand" size="sm">
              共 {stats.total} 人
            </TagPill>
          </div>
        </div>
      </div>

      {/* 错误提示 - 使用 AntD Alert (通过适配) */}
      {error && (
        <Alert
          type="error"
          message={error}
          closable
          onClose={() => setError(null)}
          className="mb-4"
          style={{
            backgroundColor: 'var(--error-bg)',
            borderColor: 'var(--error)',
            color: 'var(--error-text)',
            borderRadius: 'var(--radius)'
          }}
        />
      )}

      {/* 操作栏 - 使用品牌化按钮 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="default"
            leftIcon={<PlusOutlined />}
            onClick={handleOpenAddForm}
          >
            添加员工
          </Button>
          <Button
            variant="outline"
            leftIcon={<ReloadOutlined />}
            onClick={loadEmployees}
            loading={isLoading}
          >
            刷新列表
          </Button>
        </div>
      </div>

      {/* 员工列表 - 使用品牌化卡片容器 */}
      <CardShell variant="elevated" className="overflow-hidden">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              <UserOutlined />
              员工列表
            </h3>
            <TagPill variant="neutral" size="sm">
              {employees.length} 名员工
            </TagPill>
          </div>

          {/* 使用现有 EmployeeTable 组件，逐步重构 */}
          {isLoading ? (
            <div className="text-center py-8 text-gray-400">
              正在加载员工列表...
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl opacity-20 text-gray-500 mb-4">
                <UserOutlined />
              </div>
              <h3 className="text-lg font-medium text-gray-300 mb-2">
                暂无员工数据
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                点击"添加员工"开始建立您的团队
              </p>
              <Button
                variant="default"
                leftIcon={<PlusOutlined />}
                onClick={handleOpenAddForm}
              >
                添加第一个员工
              </Button>
            </div>
          ) : (
            <EmployeeTable
              employees={employees}
              isLoading={isLoading}
              onEdit={handleOpenEditForm}
              onDelete={handleDeleteEmployee}
            />
          )}
        </div>
      </CardShell>

      {/* 员工表单模态框 - 使用 AntD Modal (通过适配) */}
      <Modal
        title={editingEmployee ? '编辑员工' : '添加员工'}
        open={isShowingForm}
        onCancel={handleCloseForm}
        footer={null}
        width={500}
        style={{
          borderRadius: 'var(--radius)',
        }}
        styles={{
          content: {
            backgroundColor: 'var(--bg-elevated)',
            borderRadius: 'var(--radius)',
          },
          header: {
            backgroundColor: 'var(--bg-elevated)',
            borderBottom: '1px solid var(--border)',
          }
        }}
      >
        <EmployeeForm
          employee={editingEmployee}
          onSubmit={editingEmployee ? handleEditEmployee : handleAddEmployee}
          onCancel={handleCloseForm}
          isLoading={isFormLoading}
        />
      </Modal>
    </PageShell>
  );
};

export default EmployeePageBrandNew;