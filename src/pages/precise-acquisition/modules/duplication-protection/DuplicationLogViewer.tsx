/**
 * 查重日志查看器
 * 展示详细的查重检测历史和事件记录
 */

import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Modal,
  DatePicker,
  Select,
  Input,
  Typography,
  Row,
  Col,
  Statistic,
  Timeline,
  Alert,
  Tooltip,
  List,
  Progress,
} from "antd";
import {
  EyeOutlined,
  ExportOutlined,
  FilterOutlined,
  ReloadOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import type {
  DuplicationCheck,
  DuplicationEvent,
  DuplicationHistory,
} from "./types";
import { DuplicationDetector } from "./DuplicationDetector";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface DuplicationLogViewerProps {
  onExport?: (data: any[]) => void;
}

export const DuplicationLogViewer: React.FC<DuplicationLogViewerProps> = ({
  onExport,
}) => {
  const [loading, setLoading] = useState(false);
  const [checks, setChecks] = useState<DuplicationCheck[]>([]);
  const [events, setEvents] = useState<DuplicationEvent[]>([]);
  const [history, setHistory] = useState<DuplicationHistory[]>([]);

  // 筛选状态
  const [filters, setFilters] = useState({
    dateRange: null as any,
    result: "all",
    actionType: "all",
    deviceId: "all",
    searchText: "",
  });

  // 模态框状态
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalType, setModalType] = useState<"check" | "event" | "history">(
    "check"
  );

  const detector = new DuplicationDetector();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // 加载检查记录
      const checksData = await detector.getChecks(200);
      setChecks(checksData);

      // 加载事件记录
      const eventsData = await detector.getEvents(100);
      setEvents(eventsData);

      // 加载历史记录
      const historyData = await detector.getHistory();
      setHistory(historyData);
    } catch (error) {
      console.error("加载数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 应用筛选
  const getFilteredChecks = () => {
    return checks.filter((check) => {
      // 日期筛选
      if (filters.dateRange) {
        const checkDate = new Date(check.timestamp);
        const [start, end] = filters.dateRange;
        if (checkDate < start || checkDate > end) return false;
      }

      // 结果筛选
      if (filters.result !== "all" && check.result !== filters.result) {
        return false;
      }

      // 操作类型筛选
      if (
        filters.actionType !== "all" &&
        check.actionType !== filters.actionType
      ) {
        return false;
      }

      // 设备筛选
      if (filters.deviceId !== "all" && check.deviceId !== filters.deviceId) {
        return false;
      }

      // 文本搜索
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        return (
          check.targetId.toLowerCase().includes(searchLower) ||
          check.reason.toLowerCase().includes(searchLower) ||
          check.deviceId.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  };

  // 获取唯一设备列表
  const getUniqueDevices = () => {
    const devices = new Set(checks.map((c) => c.deviceId));
    return Array.from(devices);
  };

  // 计算统计数据
  const getStats = () => {
    const filteredChecks = getFilteredChecks();
    const total = filteredChecks.length;
    const blocked = filteredChecks.filter((c) => c.result === "blocked").length;
    const warned = filteredChecks.filter((c) => c.result === "warning").length;
    const passed = filteredChecks.filter((c) => c.result === "pass").length;

    return {
      total,
      blocked,
      warned,
      passed,
      blockRate: total > 0 ? ((blocked / total) * 100).toFixed(1) : "0",
    };
  };

  const stats = getStats();

  // 查看详情
  const handleViewDetail = (item: any, type: "check" | "event" | "history") => {
    setSelectedItem(item);
    setModalType(type);
    setDetailModalVisible(true);
  };

  // 导出数据
  const handleExport = () => {
    const filteredData = getFilteredChecks();
    if (onExport) {
      onExport(filteredData);
    }
  };

  // 表格列定义
  const checkColumns = [
    {
      title: "时间",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 180,
      render: (timestamp: string) => (
        <Tooltip title={new Date(timestamp).toLocaleString()}>
          {new Date(timestamp).toLocaleTimeString()}
        </Tooltip>
      ),
      sorter: (a: DuplicationCheck, b: DuplicationCheck) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    },
    {
      title: "目标",
      key: "target",
      width: 200,
      render: (_, record: DuplicationCheck) => (
        <div>
          <Text className="font-mono text-xs">
            {record.targetId.slice(0, 12)}...
          </Text>
          <br />
          <Tag color="blue">{record.targetType}</Tag>
        </div>
      ),
    },
    {
      title: "操作",
      dataIndex: "actionType",
      key: "actionType",
      width: 100,
      render: (actionType: string) => {
        const colors = {
          follow: "blue",
          reply: "green",
          like: "orange",
          share: "purple",
        };
        return (
          <Tag color={colors[actionType as keyof typeof colors]}>
            {actionType === "follow"
              ? "关注"
              : actionType === "reply"
              ? "回复"
              : actionType === "like"
              ? "点赞"
              : "分享"}
          </Tag>
        );
      },
    },
    {
      title: "结果",
      dataIndex: "result",
      key: "result",
      width: 100,
      render: (result: string) => {
        const config = {
          pass: { color: "green", icon: <CheckCircleOutlined />, text: "通过" },
          blocked: {
            color: "red",
            icon: <CloseCircleOutlined />,
            text: "阻止",
          },
          warning: { color: "orange", icon: <WarningOutlined />, text: "警告" },
          delayed: {
            color: "blue",
            icon: <ClockCircleOutlined />,
            text: "延迟",
          },
        };
        const cfg = config[result as keyof typeof config] || config.pass;

        return (
          <Tag color={cfg.color} icon={cfg.icon}>
            {cfg.text}
          </Tag>
        );
      },
    },
    {
      title: "置信度",
      dataIndex: "confidence",
      key: "confidence",
      width: 120,
      render: (confidence: number) => (
        <div className="flex items-center space-x-2">
          <Progress
            percent={confidence}
            size="small"
            showInfo={false}
            strokeColor={
              confidence >= 80
                ? "#52c41a"
                : confidence >= 60
                ? "#faad14"
                : "#ff4d4f"
            }
          />
          <Text className="text-xs">{confidence}%</Text>
        </div>
      ),
    },
    {
      title: "设备",
      dataIndex: "deviceId",
      key: "deviceId",
      width: 120,
      render: (deviceId: string) => (
        <Text className="font-mono text-xs">{deviceId.slice(0, 8)}...</Text>
      ),
    },
    {
      title: "操作",
      key: "actions",
      width: 80,
      render: (_, record: DuplicationCheck) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record, "check")}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 统计概览 */}
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总检查次数"
              value={stats.total}
              prefix={<EyeOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="阻止次数"
              value={stats.blocked}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="警告次数"
              value={stats.warned}
              prefix={<WarningOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="阻止率"
              value={parseFloat(stats.blockRate)}
              suffix="%"
              precision={1}
              valueStyle={{
                color: parseFloat(stats.blockRate) > 10 ? "#cf1322" : "#52c41a",
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* 筛选控件 */}
      <Card title="筛选条件" size="small">
        <Row gutter={16}>
          <Col span={6}>
            <RangePicker
              placeholder={["开始时间", "结束时间"]}
              onChange={(dates) =>
                setFilters((prev) => ({ ...prev, dateRange: dates }))
              }
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="检查结果"
              value={filters.result}
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, result: value }))
              }
              style={{ width: "100%" }}
            >
              <Option value="all">全部结果</Option>
              <Option value="pass">通过</Option>
              <Option value="blocked">阻止</Option>
              <Option value="warning">警告</Option>
              <Option value="delayed">延迟</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="操作类型"
              value={filters.actionType}
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, actionType: value }))
              }
              style={{ width: "100%" }}
            >
              <Option value="all">全部操作</Option>
              <Option value="follow">关注</Option>
              <Option value="reply">回复</Option>
              <Option value="like">点赞</Option>
              <Option value="share">分享</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="设备"
              value={filters.deviceId}
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, deviceId: value }))
              }
              style={{ width: "100%" }}
            >
              <Option value="all">全部设备</Option>
              {getUniqueDevices().map((deviceId) => (
                <Option key={deviceId} value={deviceId}>
                  {deviceId.slice(0, 8)}...
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Input.Search
              placeholder="搜索目标ID、原因或设备"
              value={filters.searchText}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, searchText: e.target.value }))
              }
              allowClear
            />
          </Col>
        </Row>
      </Card>

      {/* 主表格 */}
      <Card
        title={
          <div className="flex items-center justify-between">
            <span>检查记录</span>
            <Space>
              <Button icon={<FilterOutlined />} size="small">
                高级筛选
              </Button>
              <Button icon={<ReloadOutlined />} size="small" onClick={loadData}>
                刷新
              </Button>
              <Button
                icon={<ExportOutlined />}
                size="small"
                onClick={handleExport}
              >
                导出
              </Button>
            </Space>
          </div>
        }
      >
        <Table
          columns={checkColumns}
          dataSource={getFilteredChecks()}
          rowKey="id"
          loading={loading}
          size="small"
          scroll={{ x: 1000 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 详情模态框 */}
      <Modal
        title={
          modalType === "check"
            ? "检查详情"
            : modalType === "event"
            ? "事件详情"
            : "历史记录"
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedItem && modalType === "check" && (
          <div className="space-y-4">
            {/* 基础信息 */}
            <Row gutter={16}>
              <Col span={12}>
                <Card title="基础信息" size="small">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Text type="secondary">检查ID:</Text>
                      <Text className="font-mono">{selectedItem.id}</Text>
                    </div>
                    <div className="flex justify-between">
                      <Text type="secondary">时间:</Text>
                      <Text>
                        {new Date(selectedItem.timestamp).toLocaleString()}
                      </Text>
                    </div>
                    <div className="flex justify-between">
                      <Text type="secondary">目标类型:</Text>
                      <Tag>{selectedItem.targetType}</Tag>
                    </div>
                    <div className="flex justify-between">
                      <Text type="secondary">操作类型:</Text>
                      <Tag color="blue">{selectedItem.actionType}</Tag>
                    </div>
                    <div className="flex justify-between">
                      <Text type="secondary">检查结果:</Text>
                      <Tag
                        color={selectedItem.result === "pass" ? "green" : "red"}
                      >
                        {selectedItem.result}
                      </Tag>
                    </div>
                    <div className="flex justify-between">
                      <Text type="secondary">置信度:</Text>
                      <Text>{selectedItem.confidence}%</Text>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="处理信息" size="small">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Text type="secondary">规则ID:</Text>
                      <Text className="font-mono">{selectedItem.ruleId}</Text>
                    </div>
                    <div className="flex justify-between">
                      <Text type="secondary">设备ID:</Text>
                      <Text className="font-mono">{selectedItem.deviceId}</Text>
                    </div>
                    <div className="flex justify-between">
                      <Text type="secondary">任务ID:</Text>
                      <Text className="font-mono">
                        {selectedItem.taskId || "无"}
                      </Text>
                    </div>
                    <div className="flex justify-between">
                      <Text type="secondary">执行动作:</Text>
                      <Tag>{selectedItem.actionTaken}</Tag>
                    </div>
                    {selectedItem.delayUntil && (
                      <div className="flex justify-between">
                        <Text type="secondary">延迟至:</Text>
                        <Text>
                          {new Date(selectedItem.delayUntil).toLocaleString()}
                        </Text>
                      </div>
                    )}
                  </div>
                </Card>
              </Col>
            </Row>

            {/* 检查原因 */}
            <Card title="检查原因" size="small">
              <Alert
                message={selectedItem.reason}
                type={selectedItem.result === "pass" ? "success" : "warning"}
                showIcon
              />
            </Card>

            {/* 历史操作 */}
            {selectedItem.details.previousActions.length > 0 && (
              <Card title="历史操作" size="small">
                <Timeline>
                  {selectedItem.details.previousActions.map(
                    (action: any, index: number) => (
                      <Timeline.Item key={index}>
                        <div className="flex justify-between items-center">
                          <div>
                            <Tag color="blue">{action.actionType}</Tag>
                            <Text className="ml-2">{action.targetId}</Text>
                          </div>
                          <Text type="secondary" className="text-xs">
                            {new Date(action.timestamp).toLocaleString()}
                          </Text>
                        </div>
                      </Timeline.Item>
                    )
                  )}
                </Timeline>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
