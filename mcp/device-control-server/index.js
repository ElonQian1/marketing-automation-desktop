#!/usr/bin/env node
/**
 * MCP Server for Android Device Control
 * 
 * 这个服务器是一个桥接层，将标准 MCP stdio 协议转换为 HTTP 请求，
 * 发送给运行中的 automation-desktop 后端 MCP 服务器 (端口 3100)。
 * 
 * 用法:
 *   1. 确保 automation-desktop (Tauri 应用) 正在运行
 *   2. VS Code Copilot 通过 stdio 与本脚本通信
 *   3. 本脚本将请求转发到 http://127.0.0.1:3100/mcp
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const BACKEND_URL = "http://127.0.0.1:3100";

/**
 * 调用后端 MCP 服务器
 * @param {string} method - MCP 方法名
 * @param {object} params - 参数
 * @param {number} timeoutMs - 超时时间（毫秒），默认 30 秒，脚本执行可能需要更长
 */
async function callBackend(method, params = {}, timeoutMs = 30000) {
  // 对于脚本执行，使用更长的超时时间（5分钟）
  if (method === "tools/call" && params?.name === "execute_script") {
    timeoutMs = 300000; // 5 分钟
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(`${BACKEND_URL}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method,
        params,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    if (result.error) {
      throw new Error(result.error.message || JSON.stringify(result.error));
    }
    return result.result;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // 检查是否超时
    if (error.name === "AbortError") {
      throw new Error(
        `❌ 请求超时 (${timeoutMs / 1000}秒)！如果是脚本执行，请检查设备状态。`
      );
    }
    // 检查是否后端未运行
    if (error.cause?.code === "ECONNREFUSED") {
      throw new Error(
        "❌ 无法连接到 automation-desktop 后端！请确保 Tauri 应用正在运行。"
      );
    }
    throw error;
  }
}

// 创建 MCP 服务器
const server = new Server(
  {
    name: "device-control-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 处理工具列表请求
server.setRequestHandler(ListToolsRequestSchema, async () => {
  try {
    const result = await callBackend("tools/list");
    return {
      tools: result.tools || [],
    };
  } catch (error) {
    console.error("获取工具列表失败:", error.message);
    // 返回离线时的基础工具定义
    return {
      tools: [
        {
          name: "list_devices",
          description: "列出所有已连接的 Android 设备（需要后端运行）",
          inputSchema: { type: "object", properties: {}, required: [] },
        },
        {
          name: "launch_app",
          description: "启动应用（需要后端运行）",
          inputSchema: {
            type: "object",
            properties: {
              device_id: { type: "string", description: "设备ID" },
              package_name: {
                type: "string",
                description:
                  "包名: 抖音=com.ss.android.ugc.aweme, 微信=com.tencent.mm",
              },
            },
            required: ["device_id", "package_name"],
          },
        },
        {
          name: "tap_element",
          description: "点击屏幕元素（需要后端运行）",
          inputSchema: {
            type: "object",
            properties: {
              device_id: { type: "string", description: "设备ID" },
              text: { type: "string", description: "元素文本" },
            },
            required: ["device_id", "text"],
          },
        },
        {
          name: "get_screen",
          description: "获取屏幕UI结构（需要后端运行）",
          inputSchema: {
            type: "object",
            properties: {
              device_id: { type: "string", description: "设备ID" },
            },
            required: ["device_id"],
          },
        },
      ],
    };
  }
});

// 处理工具调用请求
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const result = await callBackend("tools/call", {
      name,
      arguments: args || {},
    });

    // 处理 MCP 标准返回格式
    if (result.content) {
      return result;
    }

    // 处理后端的自定义返回格式
    return {
      content: [
        {
          type: "text",
          text:
            typeof result === "string" ? result : JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `❌ 错误: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("✅ Device Control MCP Server 已启动");
  console.error("📍 后端地址:", BACKEND_URL);
}

main().catch((error) => {
  console.error("启动失败:", error);
  process.exit(1);
});
