import React, { useState, useEffect } from 'react';
import { Layout, Card, Button, Typography, Space, Alert, Spin, Modal } from 'antd';
import { PlusOutlined, UserOutlined } from '@ant-design/icons';
import { EmployeeTable, EmployeeForm } from '../components';
import { EmployeeAPI } from '../api';
import type { EmployeeData, EmployeeFormData } from '../types';

const { Content } = Layout;
const { Title } = Typography;

/**
 * 员工管理主页面
 * 包含员工列表展示、添加、编辑、删除功能
 */
export const EmployeePage: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeData | null>(null);
  const [isShowingForm, setIsShowingForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 采用原生 AntD 样式：不做额外 token 配色与内联主题覆盖

  // 加载员工列表
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

  // 处理添加员工
  const handleAddEmployee = async (employeeData: EmployeeFormData) => {
    try {
      setIsFormLoading(true);
      setError(null);
      await EmployeeAPI.addEmployee(employeeData);
      await loadEmployees(); // 重新加载列表
      setIsShowingForm(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : '添加员工失败');
      console.error('Failed to add employee:', error);
    } finally {
      setIsFormLoading(false);
    }
  };

  // 处理更新员工
  const handleUpdateEmployee = async (employeeData: EmployeeFormData) => {
    if (!editingEmployee?.id) return;

    try {
      setIsFormLoading(true);
      setError(null);
      const updatedEmployee: EmployeeData = {
        ...employeeData,
        id: editingEmployee.id
      };
      await EmployeeAPI.updateEmployee(updatedEmployee);
      await loadEmployees(); // 重新加载列表
      setEditingEmployee(null);
      setIsShowingForm(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : '更新员工失败');
      console.error('Failed to update employee:', error);
    } finally {
      setIsFormLoading(false);
    }
  };

  // 处理删除员工
  const handleDeleteEmployee = async (id: number) => {
    const confirmed = await new Promise<boolean>((resolve) => {
      Modal.confirm({
        title: '确认删除',
        content: '确定要删除这个员工吗？此操作不可恢复。',
        okText: '删除',
        okButtonProps: { danger: true },
        cancelText: '取消',
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
    if (!confirmed) return;

    try {
      setError(null);
      await EmployeeAPI.deleteEmployee(id);
      await loadEmployees(); // 重新加载列表
    } catch (error) {
      setError(error instanceof Error ? error.message : '删除员工失败');
      console.error('Failed to delete employee:', error);
    }
  };

  // 处理编辑员工
  const handleEditEmployee = (employee: EmployeeData) => {
    setEditingEmployee(employee);
    setIsShowingForm(true);
  };

  // 处理取消表单
  const handleCancelForm = () => {
    setEditingEmployee(null);
    setIsShowingForm(false);
    setError(null);
  };

  // 处理表单提交
  const handleFormSubmit = (employeeData: EmployeeFormData) => {
    if (editingEmployee) {
      handleUpdateEmployee(employeeData);
    } else {
      handleAddEmployee(employeeData);
    }
  };

  return (
    <Layout>
      <Content>
        <Card
          title={
            <Space>
              <UserOutlined />
              <Title level={3}>员工管理系统</Title>
            </Space>
          }
          extra={!isShowingForm && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsShowingForm(true)}>
              添加员工
            </Button>
          )}
        >
          <Space direction="vertical" size="middle">

          {/* 错误提示 */}
          {error && (
            <Alert message={error} type="error" closable onClose={() => setError(null)} />
          )}

          {/* 表单区域 */}
          {isShowingForm && (
            <Card title={editingEmployee ? '编辑员工' : '添加员工'}>
              <Spin spinning={isFormLoading}>
                <EmployeeForm
                  employee={editingEmployee}
                  onSubmit={handleFormSubmit}
                  onCancel={handleCancelForm}
                  isLoading={isFormLoading}
                />
              </Spin>
            </Card>
          )}

          {/* 员工列表 */}
          {!isShowingForm && (
            <Card title="员工列表">
              <Spin spinning={isLoading}>
                <EmployeeTable
                  employees={employees}
                  onEdit={handleEditEmployee}
                  onDelete={handleDeleteEmployee}
                  isLoading={isLoading}
                />
              </Spin>
            </Card>
          )}
          </Space>
        </Card>
      </Content>
    </Layout>
  );
};

