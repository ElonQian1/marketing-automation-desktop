import React from 'react';
import { Table, Button, Space, Tag, Typography } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { EmployeeData } from '../types';

const { Text } = Typography;

interface EmployeeTableProps {
  employees: EmployeeData[];
  onEdit: (employee: EmployeeData) => void;
  onDelete: (id: number) => void;
  isLoading?: boolean;
}

/**
 * 员工列表表格组件
 * 使用原生Ant Design Table组件
 */
export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  onEdit,
  onDelete,
  isLoading = false
}) => {
  const columns: ColumnsType<EmployeeData> = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
  render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: '职位',
      dataIndex: 'position',
      key: 'position',
    },
    {
      title: '薪资',
      dataIndex: 'salary',
      key: 'salary',
      render: (salary: number) => `¥${salary.toLocaleString()}`,
      sorter: (a, b) => a.salary - b.salary,
    },
    {
      title: '入职日期',
      dataIndex: 'hire_date',
      key: 'hire_date',
      sorter: (a, b) => new Date(a.hire_date).getTime() - new Date(b.hire_date).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => record.id && onDelete(Number(record.id))}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={employees}
      rowKey="id"
      loading={isLoading}
      pagination={{
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => 
          `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
      }}
      locale={{
        emptyText: '暂无员工数据',
      }}
    />
  );
};

