// src/pages/test/sm-runtime-test-page.tsx
// module: pages | layer: ui | role: 结构匹配运行时测试页面
// summary: 测试结构匹配算法的端到端集成

import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, Button, Input, Select, Alert, Spin, Divider, Tag, Space } from 'antd';
import { PlayCircleOutlined, FileTextOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;

// ==================== 类型定义 ====================

interface SmMatchRequest {
  xmlContent: string;
  config: SmConfigDTO;
  containerHint: string | null;
}

interface SmConfigDTO {
  mode: string;
  skeletonRules: string | null;
  fieldRules: FieldRuleDTO[] | null;
  earlyStopEnabled: boolean | null;
}

interface FieldRuleDTO {
  fieldName: string;
  expected: string | null;
  regex: string | null;
}

interface SmMatchResponse {
  success: boolean;
  error: string | null;
  result: SmResultDTO | null;
  elapsedMs: number;
}

interface SmResultDTO {
  containerId: number;
  layoutType: string;
  items: SmItemDTO[];
  score: number;
}

interface SmItemDTO {
  nodeId: number;
  score: number;
  bounds: SmBoundsDTO;
}

interface SmBoundsDTO {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

// ==================== 示例XML数据 ====================

const SAMPLE_XML = `<?xml version='1.0' encoding='UTF-8' standalone='yes' ?>
<hierarchy rotation="0">
  <node index="0" text="" resource-id="" class="android.widget.FrameLayout" package="com.xingin.xhs" content-desc="" checkable="false" checked="false" clickable="false" enabled="true" focusable="false" focused="false" scrollable="false" long-clickable="false" password="false" selected="false" bounds="[0,0][1080,2400]">
    <node index="0" text="" resource-id="com.xingin.xhs:id/recycler_view" class="androidx.recyclerview.widget.RecyclerView" package="com.xingin.xhs" content-desc="" checkable="false" checked="false" clickable="false" enabled="true" focusable="true" focused="false" scrollable="true" long-clickable="false" password="false" selected="false" bounds="[0,168][1080,2148]">
      <node index="0" text="" resource-id="" class="android.view.ViewGroup" package="com.xingin.xhs" content-desc="" checkable="false" checked="false" clickable="true" enabled="true" focusable="true" focused="false" scrollable="false" long-clickable="false" password="false" selected="false" bounds="[24,188][516,680]">
        <node index="0" text="" resource-id="com.xingin.xhs:id/cover_image" class="android.widget.ImageView" package="com.xingin.xhs" content-desc="" checkable="false" checked="false" clickable="false" enabled="true" focusable="false" focused="false" scrollable="false" long-clickable="false" password="false" selected="false" bounds="[24,188][516,680]" />
        <node index="1" text="精美手工艺品" resource-id="com.xingin.xhs:id/title" class="android.widget.TextView" package="com.xingin.xhs" content-desc="" checkable="false" checked="false" clickable="false" enabled="true" focusable="false" focused="false" scrollable="false" long-clickable="false" password="false" selected="false" bounds="[24,700][516,752]" />
        <node index="2" text="小红薯123" resource-id="com.xingin.xhs:id/author" class="android.widget.TextView" package="com.xingin.xhs" content-desc="" checkable="false" checked="false" clickable="false" enabled="true" focusable="false" focused="false" scrollable="false" long-clickable="false" password="false" selected="false" bounds="[24,762][516,800]" />
      </node>
      <node index="1" text="" resource-id="" class="android.view.ViewGroup" package="com.xingin.xhs" content-desc="" checkable="false" checked="false" clickable="true" enabled="true" focusable="true" focused="false" scrollable="false" long-clickable="false" password="false" selected="false" bounds="[564,188][1056,680]">
        <node index="0" text="" resource-id="com.xingin.xhs:id/cover_image" class="android.widget.ImageView" package="com.xingin.xhs" content-desc="" checkable="false" checked="false" clickable="false" enabled="true" focusable="false" focused="false" scrollable="false" long-clickable="false" password="false" selected="false" bounds="[564,188][1056,680]" />
        <node index="1" text="美食探店" resource-id="com.xingin.xhs:id/title" class="android.widget.TextView" package="com.xingin.xhs" content-desc="" checkable="false" checked="false" clickable="false" enabled="true" focusable="false" focused="false" scrollable="false" long-clickable="false" password="false" selected="false" bounds="[564,700][1056,752]" />
        <node index="2" text="小红薯456" resource-id="com.xingin.xhs:id/author" class="android.widget.TextView" package="com.xingin.xhs" content-desc="" checkable="false" checked="false" clickable="false" enabled="true" focusable="false" focused="false" scrollable="false" long-clickable="false" password="false" selected="false" bounds="[564,762][1056,800]" />
      </node>
    </node>
  </node>
</hierarchy>`;

// ==================== 主组件 ====================

export const SmRuntimeTestPage: React.FC = () => {
  const [xmlContent, setXmlContent] = useState<string>(SAMPLE_XML);
  const [mode, setMode] = useState<string>('default');
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<SmMatchResponse | null>(null);

  const handleRunTest = async () => {
    setLoading(true);
    setResponse(null);

    try {
      const request: SmMatchRequest = {
        xmlContent,
        config: {
          mode,
          skeletonRules: null,
          fieldRules: null,
          earlyStopEnabled: true,
        },
        containerHint: null,
      };

      const result = await invoke<SmMatchResponse>('sm_match_once', { request });
      setResponse(result);
    } catch (error) {
      setResponse({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        result: null,
        elapsedMs: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = () => {
    setXmlContent(SAMPLE_XML);
  };

  const handleClearXml = () => {
    setXmlContent('');
  };

  return (
    <div className="light-theme-force min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            <FileTextOutlined className="mr-3" />
            结构匹配运行时测试
          </h1>
          <p className="mt-2 text-gray-600">
            测试 Rust 端结构匹配算法的端到端集成（Phase 3）
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 左侧：输入配置 */}
          <div className="space-y-6">
            {/* XML 输入 */}
            <Card title="📄 XML 输入" className="shadow-sm">
              <Space className="mb-3">
                <Button type="primary" onClick={handleLoadSample} icon={<FileTextOutlined />}>
                  加载示例XML
                </Button>
                <Button onClick={handleClearXml}>清空</Button>
              </Space>
              <TextArea
                value={xmlContent}
                onChange={(e) => setXmlContent(e.target.value)}
                placeholder="粘贴 UI Dump XML 内容..."
                rows={15}
                className="font-mono text-xs"
              />
              <div className="mt-2 text-xs text-gray-500">
                长度: {xmlContent.length} 字符
              </div>
            </Card>

            {/* 配置选项 */}
            <Card title="⚙️ 配置选项" className="shadow-sm">
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    匹配模式
                  </label>
                  <Select
                    value={mode}
                    onChange={setMode}
                    className="w-full"
                    size="large"
                  >
                    <Option value="speed">Speed（快速模式）</Option>
                    <Option value="default">Default（默认模式）</Option>
                    <Option value="robust">Robust（鲁棒模式）</Option>
                  </Select>
                </div>

                <Divider />

                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={handleRunTest}
                  loading={loading}
                  disabled={!xmlContent.trim()}
                  icon={<PlayCircleOutlined />}
                >
                  {loading ? '执行中...' : '执行匹配'}
                </Button>
              </div>
            </Card>
          </div>

          {/* 右侧：执行结果 */}
          <div className="space-y-6">
            {loading && (
              <Card className="shadow-sm">
                <div className="flex items-center justify-center py-12">
                  <Spin size="large" tip="正在执行结构匹配..." />
                </div>
              </Card>
            )}

            {!loading && response && (
              <>
                {/* 执行状态 */}
                <Card title="📊 执行结果" className="shadow-sm">
                  {response.success ? (
                    <Alert
                      message="✅ 执行成功"
                      description={`耗时: ${response.elapsedMs} ms`}
                      type="success"
                      showIcon
                      icon={<CheckCircleOutlined />}
                    />
                  ) : (
                    <Alert
                      message="❌ 执行失败"
                      description={response.error}
                      type="error"
                      showIcon
                      icon={<CloseCircleOutlined />}
                    />
                  )}
                </Card>

                {/* 匹配结果详情 */}
                {response.success && response.result && (
                  <>
                    <Card title="🎯 容器信息" className="shadow-sm">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">容器节点ID:</span>
                          <Tag color="blue">{response.result.containerId}</Tag>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">布局类型:</span>
                          <Tag color="green">{response.result.layoutType}</Tag>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">平均得分:</span>
                          <Tag color="orange">
                            {(response.result.score * 100).toFixed(1)}%
                          </Tag>
                        </div>
                      </div>
                    </Card>

                    <Card
                      title={`📦 匹配项列表 (${response.result.items.length})`}
                      className="shadow-sm"
                    >
                      <div className="max-h-96 space-y-3 overflow-y-auto">
                        {response.result.items.length === 0 ? (
                          <div className="py-8 text-center text-gray-500">
                            未找到匹配项
                          </div>
                        ) : (
                          response.result.items.map((item, index) => (
                            <Card
                              key={item.nodeId}
                              size="small"
                              className="border-l-4 border-blue-500"
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-gray-700">
                                    #{index + 1} 节点 {item.nodeId}
                                  </span>
                                  <Tag color="purple">
                                    得分: {(item.score * 100).toFixed(1)}%
                                  </Tag>
                                </div>
                                <div className="text-xs text-gray-600">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      左: {item.bounds.left} | 上: {item.bounds.top}
                                    </div>
                                    <div>
                                      右: {item.bounds.right} | 下: {item.bounds.bottom}
                                    </div>
                                  </div>
                                  <div className="mt-1">
                                    宽度: {item.bounds.right - item.bounds.left} | 高度:{' '}
                                    {item.bounds.bottom - item.bounds.top}
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))
                        )}
                      </div>
                    </Card>
                  </>
                )}
              </>
            )}

            {!loading && !response && (
              <Card className="shadow-sm">
                <div className="py-12 text-center text-gray-400">
                  点击"执行匹配"按钮开始测试
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmRuntimeTestPage;
