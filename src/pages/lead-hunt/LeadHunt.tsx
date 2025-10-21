// src/pages/lead-hunt/LeadHunt.tsx
// module: lead-hunt | layer: pages | role: 精准获客主页面
// summary: 展示评论列表、导入评论、生成回放计划等功能

import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, Table, Button, Space, Tag, message, Tooltip } from "antd";
import { 
  ReloadOutlined, 
  ImportOutlined, 
  ThunderboltOutlined,
  PlayCircleOutlined 
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

type RawComment = {
  id: string;
  platform: "douyin" | "xhs";
  videoUrl?: string;
  author: string;
  content: string;
  ts?: number;
  analysis?: any;
};

type ReplayPlan = {
  id: string;
  platform: string;
  videoUrl: string;
  author: string;
  comment: string;
  suggestedReply?: string;
};

export default function LeadHunt() {
  const [rows, setRows] = useState<RawComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

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

  const createPlan = async (row: RawComment) => {
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

  const columns: ColumnsType<RawComment> = [
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
      render: (_: any, record: RawComment) => (
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
            <Tag>状态: PR-1 数据初始化完成</Tag>
            <Tag color="orange">待完成: PR-2 AI意图识别</Tag>
            <Tag color="red">待完成: PR-3 执行模拟</Tag>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={rows}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条评论`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
}
