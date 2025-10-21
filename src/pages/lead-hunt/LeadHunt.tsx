// src/pages/lead-hunt/LeadHunt.tsx
// module: lead-hunt | layer: pages | role: 精准获客主页面
// summary: 展示评论列表、导入评论、生成回放计划等功能

import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Card, Table, Button, Space, Tag, message, Tooltip, Select, Progress, Timeline, Steps } from "antd";
import { 
  ReloadOutlined, 
  ImportOutlined, 
  ThunderboltOutlined,
  PlayCircleOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  ClockCircleOutlined
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { analyzeBatchWithProgress, type RawComment } from "@/features/leadHunt/analyzeLead";
import type { LeadAnalysis } from "@/ai/schemas/leadIntent.schema";

type Row = RawComment & { analysis?: LeadAnalysis };

// 执行步骤状态
type ExecutionStepStatus = {
  stepName: string;
  stepDescription: string;
  status: "running" | "success" | "error" | "pending";
  error?: string;
  startTime?: number;
  endTime?: number;
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
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [filter, setFilter] = useState<string>("全部");
  const [executionSteps, setExecutionSteps] = useState<ExecutionStepStatus[]>([]);
  const [executing, setExecuting] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState<string>("");

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

    // 监听执行状态事件
    const unlisten = listen<{
      planId: string;
      currentStep: number;
      totalSteps: number;
      stepName: string;
      stepDescription: string;
      status: string;
      error?: string;
    }>("orchestrator://status", (event) => {
      const { currentStep, stepName, stepDescription, status, error, totalSteps } = event.payload;

      setExecutionSteps((prev) => {
        const stepIndex = currentStep - 1;
        const newSteps = [...prev];
        
        // 确保步骤数组长度足够
        while (newSteps.length < totalSteps) {
          newSteps.push({
            stepName: "",
            stepDescription: "",
            status: "pending",
          });
        }

        // 更新当前步骤
        newSteps[stepIndex] = {
          stepName,
          stepDescription,
          status: status as "running" | "success" | "error",
          error,
          startTime: newSteps[stepIndex]?.startTime || Date.now(),
          endTime: status !== "running" ? Date.now() : undefined,
        };

        return newSteps;
      });

      if (status === "error" || currentStep === totalSteps) {
        setExecuting(false);
      }
    });

    return () => {
      unlisten.then(fn => fn());
    };
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

  const runReplay = async (row: Row) => {
    try {
      setExecuting(true);
      setCurrentPlanId(row.id);
      setExecutionSteps([]); // 清空之前的步骤
      
      await invoke("lh_run_replay_plan", { planId: row.id });
      message.success("回放计划已启动，请查看执行步骤");
    } catch (error) {
      message.error(`启动回放失败: ${error}`);
      setExecuting(false);
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
          <Tooltip title={!record.analysis ? "请先进行AI分析" : "执行模拟回复"}>
            <Button
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => runReplay(record)}
              disabled={!record.analysis || executing}
              loading={executing}
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
            <Tag color="blue">状态: PR-3 回放模拟完成</Tag>
            <Tag>共 {rows.length} 条评论</Tag>
            <Tag>已分析 {rows.filter(r => r.analysis).length} 条</Tag>
            {executing && <Tag color="orange">执行中...</Tag>}
          </Space>
        </div>

        {executionSteps.length > 0 && (
          <Card 
            title={
              <Space>
                <span>执行步骤时间线</span>
                {currentPlanId && <Tag color="blue">计划ID: {currentPlanId}</Tag>}
                {executing && <Tag color="processing" icon={<SyncOutlined spin />}>执行中</Tag>}
              </Space>
            } 
            size="small" 
            className="mb-4"
          >
            <Timeline
              items={executionSteps.map((step, index) => {
                const duration = step.startTime && step.endTime 
                  ? `${((step.endTime - step.startTime) / 1000).toFixed(2)}s` 
                  : "";

                let color = "gray";
                let icon = <ClockCircleOutlined />;
                
                if (step.status === "running") {
                  color = "blue";
                  icon = <SyncOutlined spin />;
                } else if (step.status === "success") {
                  color = "green";
                  icon = <CheckCircleOutlined />;
                } else if (step.status === "error") {
                  color = "red";
                  icon = <CloseCircleOutlined />;
                }

                return {
                  color,
                  dot: icon,
                  children: (
                    <div>
                      <div style={{ fontWeight: 500 }}>
                        步骤 {index + 1}: {step.stepName}
                        {duration && <span style={{ marginLeft: 8, color: "#999", fontSize: 12 }}>({duration})</span>}
                      </div>
                      <div style={{ color: "#666", fontSize: 13, marginTop: 4 }}>
                        {step.stepDescription}
                      </div>
                      {step.error && (
                        <div style={{ color: "#ff4d4f", fontSize: 12, marginTop: 4 }}>
                          错误: {step.error}
                        </div>
                      )}
                    </div>
                  ),
                };
              })}
            />
            
            {/* 进度统计 */}
            <div style={{ marginTop: 16, padding: "8px 12px", background: "#f5f5f5", borderRadius: 4 }}>
              <Space>
                <span>进度:</span>
                <Tag color="green">
                  成功 {executionSteps.filter(s => s.status === "success").length}
                </Tag>
                <Tag color="blue">
                  执行中 {executionSteps.filter(s => s.status === "running").length}
                </Tag>
                <Tag color="red">
                  失败 {executionSteps.filter(s => s.status === "error").length}
                </Tag>
                <Tag>
                  待执行 {executionSteps.filter(s => s.status === "pending").length}
                </Tag>
              </Space>
            </div>
          </Card>
        )}

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
