// src/modules/contact-import/ui/components/TxtImportRecordsManager.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

﻿import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Modal,
  Tooltip,
  message,
  Checkbox,
  Alert,
} from "antd";
import ConfirmPopover from "@/components/universal-ui/common-popover/ConfirmPopover";
import {
  FileTextOutlined,
  DeleteOutlined,
  InboxOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { ColumnsType } from "antd/es/table";
import {
  TxtImportRecordDto,
  listTxtImportRecords,
  deleteTxtImportRecord,
  bulkDeleteTxtImportRecords,
} from "../services/txtImportRecordService";

const { Text, Title } = Typography;

interface TxtImportRecordsManagerProps {
  /** 是否显示管理界面 */
  visible: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 数据刷新后的回调 */
  onDataRefresh?: () => void;
}

/**
 * TXT文件导入记录管理器
 * 显示历史导入记录，支持删除和归档操作
 */
// LEGACY BACKUP: Old monolithic implementation kept temporarily for reference. New modular version lives under components/txt-import.
export const TxtImportRecordsManager: React.FC<
  TxtImportRecordsManagerProps
> = ({ visible, onClose, onDataRefresh }) => {
  const [records, setRecords] = useState<TxtImportRecordDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // 分页设置
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  // 加载数据
  const loadRecords = async () => {
    try {
      setLoading(true);
      const { current, pageSize } = pagination;
      const offset = (current - 1) * pageSize;
      const result = await listTxtImportRecords({
        limit: pageSize,
        offset,
      });
      setRecords(result.items);
      setTotal(result.total);
    } catch (error) {
      console.error("加载TXT导入记录失败:", error);
      message.error("加载导入记录失败");
    } finally {
      setLoading(false);
    }
  };

  // 监听分页变化
  const handleTableChange = (newPagination: any) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };

  // 删除单个记录
  const handleDeleteRecord = async (
    record: TxtImportRecordDto,
    archiveNumbers: boolean
  ) => {
    try {
      const result = await deleteTxtImportRecord(record.id, archiveNumbers);
      if (result.success) {
        const actionText = archiveNumbers ? "归档并删除" : "删除";
        const archiveInfo =
          archiveNumbers && result.archivedNumberCount > 0
            ? `，恢复号码 ${result.archivedNumberCount} 个为未导入`
            : "";
        message.success(
          `已${actionText}记录"${record.fileName}"${archiveInfo}`
        );
        await loadRecords();
        onDataRefresh?.();
      } else {
        message.error("删除记录失败");
      }
    } catch (error) {
      console.error("删除记录失败:", error);
      message.error("删除记录失败");
    }
  };

  // 批量删除记录
  const handleBulkDelete = async (archiveNumbers: boolean) => {
    if (selectedRowKeys.length === 0) {
      message.warning("请选择要删除的记录");
      return;
    }

    const recordIds = selectedRowKeys
      .map((key) => Number(key))
      .filter((id) => !isNaN(id));
    const selectedRecords = records.filter((r) => recordIds.includes(r.id));

    Modal.confirm({
      title: `批量删除确认`,
      icon: <ExclamationCircleOutlined />,
      content: (
        <div style={{ fontSize: 12, lineHeight: 1.6 }}>
          <p>将删除以下 {selectedRecords.length} 个导入记录：</p>
          <ul style={{ paddingLeft: 18, marginBottom: 12 }}>
            {selectedRecords.slice(0, 5).map((record) => (
              <li key={record.id}>
                {record.fileName} ({record.importedNumbers} 个号码)
              </li>
            ))}
            {selectedRecords.length > 5 && (
              <li>... 另外 {selectedRecords.length - 5} 个记录</li>
            )}
          </ul>
          <p style={{ marginBottom: 0 }}>请选择删除方式：</p>
          <ul style={{ paddingLeft: 18, marginBottom: 0 }}>
            <li>
              <strong>直接删除</strong>：仅移除记录，保留号码当前状态。
            </li>
            <li>
              <strong>号码归档</strong>：将相关号码恢复为未导入并释放批次占用。
            </li>
          </ul>
        </div>
      ),
      okButtonProps: { style: { display: "none" } },
      cancelButtonProps: { style: { display: "none" } },
      footer: (_, { OkBtn, CancelBtn }) => (
        <Space style={{ width: "100%", justifyContent: "flex-end" }}>
          <Button onClick={() => Modal.destroyAll()}>取消</Button>
          <Button
            danger
            onClick={() => {
              Modal.destroyAll();
              performBulkDelete(false);
            }}
          >
            直接删除
          </Button>
          <Button
            type="primary"
            onClick={() => {
              Modal.destroyAll();
              performBulkDelete(true);
            }}
          >
            号码归档后删除
          </Button>
        </Space>
      ),
    });
  };

  const performBulkDelete = async (archiveNumbers: boolean) => {
    try {
      setBulkDeleting(true);
      const recordIds = selectedRowKeys
        .map((key) => Number(key))
        .filter((id) => !isNaN(id));
      const result = await bulkDeleteTxtImportRecords(
        recordIds,
        archiveNumbers
      );

      const actionText = archiveNumbers ? "归档并删除" : "删除";
      const archiveInfo =
        archiveNumbers && result.archivedNumberCount > 0
          ? `，恢复号码 ${result.archivedNumberCount} 个为未导入`
          : "";

      if (result.succeeded > 0) {
        message.success(
          `已${actionText} ${result.succeeded} 个记录${archiveInfo}`
        );
      }

      if (result.failed.length > 0) {
        message.error(`${result.failed.length} 个记录删除失败`);
      }

      setSelectedRowKeys([]);
      await loadRecords();
      onDataRefresh?.();
    } catch (error) {
      console.error("批量删除失败:", error);
      message.error("批量删除失败");
    } finally {
      setBulkDeleting(false);
    }
  };

  // 表格列定义
  const columns: ColumnsType<TxtImportRecordDto> = [
    {
      title: "文件名",
      dataIndex: "file_name",
      key: "file_name",
      width: 200,
      render: (fileName: string) => (
        <Space>
          <FileTextOutlined style={{ color: "#1890ff" }} />
          <Text ellipsis={{ tooltip: fileName }} style={{ maxWidth: 150 }}>
            {fileName}
          </Text>
        </Space>
      ),
    },
    {
      title: "总数",
      dataIndex: "total_numbers",
      key: "total_numbers",
      width: 80,
      align: "center",
      render: (count: number) => <Text>{count}</Text>,
    },
    {
      title: "成功",
      dataIndex: "imported_numbers",
      key: "imported_numbers",
      width: 80,
      align: "center",
      render: (count: number) => (
        <Text style={{ color: "#52c41a", fontWeight: "bold" }}>{count}</Text>
      ),
    },
    {
      title: "重复",
      dataIndex: "duplicate_numbers",
      key: "duplicate_numbers",
      width: 80,
      align: "center",
      render: (count: number) => (
        <Text style={{ color: "#fa8c16" }}>{count}</Text>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      align: "center",
      render: (status: string) => {
        const colors = {
          success: "green",
          failed: "red",
          partial: "orange",
        };
        const labels = {
          success: "成功",
          failed: "失败",
          partial: "部分成功",
        };
        return (
          <Tag color={colors[status as keyof typeof colors]}>
            {labels[status as keyof typeof labels] || status}
          </Tag>
        );
      },
    },
    {
      title: "导入时间",
      dataIndex: "created_at",
      key: "created_at",
      width: 160,
      render: (time: string) => (
        <Text style={{ fontSize: "12px" }}>
          {new Date(time).toLocaleString()}
        </Text>
      ),
    },
    {
      title: "操作",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          {record.errorMessage && (
            <Tooltip title={record.errorMessage}>
              <Button size="small" icon={<EyeOutlined />} />
            </Tooltip>
          )}
          <ConfirmPopover
            mode="default"
            title="删除确认"
            description={
              <div style={{ maxWidth: 250 }}>
                <p>请选择删除方式：</p>
                <ul
                  style={{ paddingLeft: 16, marginBottom: 0, fontSize: "12px" }}
                >
                  <li>
                    <strong>直接删除</strong>：仅移除记录
                  </li>
                  <li>
                    <strong>归档删除</strong>：重置相关号码为未导入
                  </li>
                </ul>
              </div>
            }
            okText="直接删除"
            cancelText="取消"
            onConfirm={() => handleDeleteRecord(record, false)}
            okButtonProps={{ danger: true }}
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => e.stopPropagation()}
            />
          </ConfirmPopover>
          <ConfirmPopover
            mode="default"
            title="归档确认"
            description={`将删除记录并重置 "${record.fileName}" 相关的号码为未导入状态？`}
            okText="确认归档"
            cancelText="取消"
            onConfirm={() => handleDeleteRecord(record, true)}
          >
            <Button
              size="small"
              icon={<InboxOutlined />}
              onClick={(e) => e.stopPropagation()}
            />
          </ConfirmPopover>
        </Space>
      ),
    },
  ];

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    getCheckboxProps: (record: TxtImportRecordDto) => ({
      name: record.fileName,
    }),
  };

  // 组件挂载时加载数据
  useEffect(() => {
    if (visible) {
      loadRecords();
    }
  }, [visible, pagination.current, pagination.pageSize]);

  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined />
          <span>TXT导入记录管理</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="refresh" icon={<ReloadOutlined />} onClick={loadRecords}>
          刷新
        </Button>,
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        {/* 操作栏 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Space>
            <Text>
              共 {total} 条记录
              {selectedRowKeys.length > 0 && (
                <span style={{ marginLeft: 8, color: "#1890ff" }}>
                  已选择 {selectedRowKeys.length} 条
                </span>
              )}
            </Text>
          </Space>

          {selectedRowKeys.length > 0 && (
            <Space>
              <Button size="small" onClick={() => setSelectedRowKeys([])}>
                取消选择
              </Button>
              <Button
                type="primary"
                size="small"
                danger
                loading={bulkDeleting}
                onClick={() => handleBulkDelete(false)}
              >
                批量删除
              </Button>
              <Button
                type="primary"
                size="small"
                loading={bulkDeleting}
                onClick={() => handleBulkDelete(true)}
                icon={<InboxOutlined />}
              >
                批量归档
              </Button>
            </Space>
          )}
        </div>

        {/* 说明信息 */}
        <Alert
          type="info"
          showIcon
          message="导入记录说明"
          description={
            <div style={{ fontSize: "12px" }}>
              <p style={{ marginBottom: 4 }}>
                • <strong>直接删除</strong>：仅移除导入记录，保留号码当前状态
              </p>
              <p style={{ marginBottom: 0 }}>
                • <strong>归档删除</strong>
                ：删除记录同时将相关号码重置为"未导入"状态，释放批次占用
              </p>
            </div>
          }
        />

        {/* 数据表格 */}
        <Table
          rowKey="id"
          columns={columns}
          dataSource={records}
          loading={loading}
          rowSelection={rowSelection}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          onChange={handleTableChange}
          size="small"
          scroll={{ y: 400 }}
        />
      </Space>
    </Modal>
  );
};
