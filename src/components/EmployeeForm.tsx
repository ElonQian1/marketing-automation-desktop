// src/components/EmployeeForm.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React, { useEffect } from 'react';
import { 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  DatePicker, 
  Button, 
  Card,
  Row,
  Col,
  Space 
} from 'antd';
import dayjs from 'dayjs';
import type { EmployeeData, EmployeeFormData } from '../types';
import type { Dayjs } from 'dayjs';

interface FormValues {
  name: string;
  email: string;
  department: string;
  phone?: string;
  position?: string;
  salary?: number;
  hire_date?: Dayjs;
}

const { Option } = Select;

interface EmployeeFormProps {
  employee?: EmployeeData | null;
  onSubmit: (employee: EmployeeFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * 员工表单组件 - 原生 Ant Design 实现
 * 使用 Ant Design Form 组件提供完整的表单功能
 */
export const EmployeeForm: React.FC<EmployeeFormProps> = ({
  employee,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [form] = Form.useForm();
  const isEditing = !!employee;

  // 当employee prop变化时，更新表单数据
  useEffect(() => {
    if (employee) {
      form.setFieldsValue({
        name: employee.name,
        email: employee.email,
        department: employee.department,
        phone: employee.phone || '',
        position: employee.position || '',
        salary: employee.salary || 0,
        hire_date: employee.hire_date ? dayjs(employee.hire_date) : dayjs(),
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        hire_date: dayjs(),
      });
    }
  }, [employee, form]);

  const handleSubmit = (values: FormValues) => {
    const formData: EmployeeFormData = {
      name: values.name,
      email: values.email,
      department: values.department,
      phone: values.phone || '',
      position: values.position || '',
      salary: values.salary || 0,
      hire_date: values.hire_date?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD'),
    };
    onSubmit(formData);
  };

  return (
    <Card 
      title={isEditing ? '编辑员工' : '添加员工'}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
        disabled={isLoading}
        initialValues={{
          hire_date: dayjs(),
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="姓名"
              name="name"
              rules={[
                { required: true, message: '请输入员工姓名' },
                { min: 2, message: '姓名至少2个字符' },
              ]}
            >
              <Input placeholder="请输入员工姓名" />
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              label="邮箱"
              name="email"
              rules={[
                { required: true, message: '请输入邮箱地址' },
                { type: 'email', message: '请输入有效的邮箱地址' },
              ]}
            >
              <Input placeholder="请输入邮箱地址" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="部门"
              name="department"
              rules={[{ required: true, message: '请选择部门' }]}
            >
              <Select placeholder="请选择部门">
                <Option value="技术部">技术部</Option>
                <Option value="产品部">产品部</Option>
                <Option value="市场部">市场部</Option>
                <Option value="销售部">销售部</Option>
                <Option value="人事部">人事部</Option>
                <Option value="财务部">财务部</Option>
              </Select>
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              label="职位"
              name="position"
              rules={[{ required: true, message: '请输入职位' }]}
            >
              <Input placeholder="请输入职位" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="薪资"
              name="salary"
              rules={[
                { required: true, message: '请输入薪资' },
                { type: 'number', min: 0, message: '薪资不能为负数' },
              ]}
            >
              <InputNumber
                    placeholder="请输入薪资"
                formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => {
                  const parsed = value!.replace(/¥\s?|(,*)/g, '');
                  return (Number(parsed) || 0) as 0;
                }}
                precision={2}
                min={0}
              />
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              label="入职日期"
              name="hire_date"
              rules={[{ required: true, message: '请选择入职日期' }]}
            >
              <DatePicker 
                placeholder="请选择入职日期"
                format="YYYY-MM-DD"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="手机号码"
              name="phone"
              rules={[
                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' },
              ]}
            >
              <Input placeholder="请输入手机号码（可选）" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Space>
            <Button onClick={onCancel}>
              取消
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={isLoading}
            >
              {isEditing ? '更新' : '添加'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

