// src/pages/lead-hunt/LeadHunt.tsx
// module: lead-hunt | layer: pages | role: 精准获客主页面
// summary: 展示评论列表、导入评论、生成回放计划等功能

import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, Table, Button, Space, Tag, message, Tooltip, Select, Progress } from "antd";
import { 
  ReloadOutlined, 
  ImportOutlined, 
  ThunderboltOutlined,
  PlayCircleOutlined,
  RobotOutlined
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { analyzeBatchWithProgress, type RawComment } from "@/features/leadHunt/analyzeLead";
import type { LeadAnalysis } from "@/ai/schemas/leadIntent.schema";

type Row = RawComment & { analysis?: LeadAnalysis };

type ReplayPlan = {
  id: string;
  platform: string;
  videoUrl: string;
  author: string;
  comment: string;
  suggestedReply?: string;
};

export default function LeadHunt() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [filter, setFilter] = useState<string>("全部");

  const refresh = async () => {
    try {
      setLoading(true);
      const list = await invoke<RawComment[]>("lh_list_comments");
      setRows(list);
      message.success(`加载了 ${list.length} 条评论`);
    } catch (error) {
      message.error(`刷新失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const importMock = async () => {
    try {
      setImporting(true);
      await invoke("lh_import_comments");
      message.success("已导入 mock 评论数据");
      await refresh();
    } catch (error) {
      message.error(`导入失败: ${error}`);
    } finally {
      setImporting(false);
    }
  };

  const runAnalysis = async () => {
    if (rows.length === 0) {
      message.warning("没有可分析的评论");
      return;
    }

    try {
      setAnalyzing(true);
      setAnalysisProgress(0);

      const result = await analyzeBatchWithProgress(
        rows,
        (current, total) => {
          const percent = Math.round((current / total) * 100);
          setAnalysisProgress(percent);
        },
        4 // 并发数
      );

      // 将分析结果合并到rows中
      const analysisMap = new Map(result.map((r) => [r.id, r]));
      setRows((prev) =>
        prev.map((row) => ({
          ...row,
          analysis: analysisMap.get(row.id),
        }))
      );

      message.success(`成功分析 ${result.length} 条评论`);
    } catch (error) {
      message.error(`批量分析失败: ${error}`);
    } finally {
      setAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  const createPlan = async (row: Row) => {
    try {
      const plan: ReplayPlan = {
        id: row.id,
        platform: row.platform,
        videoUrl: row.videoUrl || "",
        author: row.author,
        comment: row.content,
        suggestedReply: row.analysis?.reply_suggestion || undefined,
      };
      
      await invoke("lh_create_replay_plan", { plan });
      message.success(`已生成回放计划: ${row.id}`);
      message.info("查看文件: debug/outbox/replay_plans.json");
    } catch (error) {
      message.error(`生成计划失败: ${error}`);
    }
  };

  const columns: ColumnsType<Row> = [
    {
      title: "平台",
      dataIndex: "platform",
      key: "platform",
      width: 100,
      render: (platform: string) => (
        <Tag color={platform === "douyin" ? "red" : "orange"}>
          {platform === "douyin" ? "抖音" : "小红书"}
        </Tag>
      ),
    },
    {
      title: "作者",
      dataIndex: "author",
      key: "author",
      width: 120,
    },
    {
      title: "评论内容",
      dataIndex: "content",
      key: "content",
      ellipsis: {
        showTitle: false,
      },
      render: (content: string) => (
        <Tooltip placement="topLeft" title={content}>
          {content}
        </Tooltip>
      ),
    },
    {
      title: "意图/置信度",
      key: "intent",
      width: 150,
      render: (_: any, record: Row) => {
        if (!record.analysis) return <Tag>未分析</Tag>;
        
        const { intent, confidence } = record.analysis;
        const color = 
          intent === "询价" ? "blue" :
          intent === "询地址" ? "green" :
          intent === "售后" ? "red" :
          intent === "咨询" ? "cyan" :
          "default";
        
        return (
          <Space direction="vertical" size={0}>
            <Tag color={color}>{intent}</Tag>
            <span className="text-xs text-gray-500">
              {Math.round(confidence * 100)}%
            </span>
          </Space>
        );
      },
    },
    {
      title: "建议回复",
      dataIndex: ["analysis", "reply_suggestion"],
      key: "reply",
      width: 200,
      ellipsis: true,
      render: (reply?: string) => reply || "-",
    },
    {
      title: "视频链接",
      dataIndex: "videoUrl",
      key: "videoUrl",
      width: 150,
      ellipsis: true,
      render: (url?: string) => url || "-",
    },
    {
      title: "时间",
      dataIndex: "ts",
      key: "ts",
      width: 180,
      render: (ts?: number) => {
        if (!ts) return "-";
        return new Date(ts).toLocaleString("zh-CN");
      },
    },
    {
      title: "操作",
      key: "action",
      width: 200,
      render: (_: any, record: Row) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<ThunderboltOutlined />}
            onClick={() => createPlan(record)}
          >
            生成计划
          </Button>
          <Tooltip title="执行模拟（PR-3 后可用）">
            <Button
              size="small"
              icon={<PlayCircleOutlined />}
              disabled
            >
              执行模拟
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 筛选后的数据
  const filteredRows = rows.filter((row) => {
    if (filter === "全部") return true;
    if (filter === "未分析") return !row.analysis;
    return row.analysis?.intent === filter;
  });

  return (
    <div className="p-6">
      <Card
        title={
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">精准获客 - Lead Hunt</span>
            <Space>
              <Button
                type="primary"
                icon={<ImportOutlined />}
                onClick={importMock}
                loading={importing}
              >
                导入评论（Mock）
              </Button>
              <Button
                type="primary"
                icon={<RobotOutlined />}
                onClick={runAnalysis}
                loading={analyzing}
                disabled={rows.length === 0}
              >
                AI 批量分析
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={refresh}
                loading={loading}
              >
                刷新
              </Button>
            </Space>
          </div>
        }
      >
        <div className="mb-4">
          <Space>
            <span>意图筛选：</span>
            <Select
              value={filter}
              onChange={setFilter}
              style={{ width: 120 }}
              options={[
                { value: "全部", label: "全部" },
                { value: "未分析", label: "未分析" },
                { value: "询价", label: "询价" },
                { value: "询地址", label: "询地址" },
                { value: "售后", label: "售后" },
                { value: "咨询", label: "咨询" },
                { value: "无效", label: "无效" },
              ]}
            />
            {analyzing && (
              <>
                <span>分析进度：</span>
                <Progress
                  percent={analysisProgress}
                  style={{ width: 200 }}
                  size="small"
                />
              </>
            )}
          </Space>
        </div>

        <div className="mb-4">
          <Space>
            <Tag color="green">状态: PR-2 AI意图识别完成</Tag>
            <Tag color="orange">待完成: PR-3 执行模拟</Tag>
            <Tag>共 {rows.length} 条评论</Tag>
            <Tag>已分析 {rows.filter(r => r.analysis).length} 条</Tag>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filteredRows}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条评论`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
}
