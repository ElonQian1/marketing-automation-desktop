// src-tauri/src/modules/ui_dump/strategies/android_service.rs
// module: ui_dump | layer: strategies | role: android-service
// summary: Android Agent 服务策略 - 通过 Socket 连接手机端 App 获取数据

use anyhow::{Context, Result};
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::time::{Duration, Instant};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::net::TcpStream;
use tracing::{debug, info, warn};

use crate::modules::ui_dump::domain::capturer_trait::ScreenCapturer;
use crate::modules::ui_dump::ui_dump_types::{DumpMode, DumpResult};
use crate::utils::adb_utils::get_adb_path;

/// Android Agent 服务策略
pub struct AndroidServiceStrategy {
    port: u16,
    timeout_ms: u64,
}

impl AndroidServiceStrategy {
    pub fn new(port: u16, timeout_ms: u64) -> Self {
        Self { port, timeout_ms }
    }

    /// 确保端口转发已设置
    /// 
    /// 执行 `adb -s <device_id> forward tcp:11451 tcp:11451`
    async fn ensure_port_forward(&self, device_id: &str) -> Result<()> {
        use tokio::process::Command;
        
        let port_str = self.port.to_string();
        let local_remote = format!("tcp:{}", port_str);
        let adb_path = get_adb_path();
        
        // 先检查是否已转发 (通过 adb forward --list)
        let list_output = Command::new(&adb_path)
            .args(["-s", device_id, "forward", "--list"])
            .output()
            .await
            .context("执行 adb forward --list 失败")?;
        
        let list_str = String::from_utf8_lossy(&list_output.stdout);
        let expected_forward = format!("{} tcp:{} tcp:{}", device_id, self.port, self.port);
        
        if list_str.contains(&expected_forward) {
            debug!("📡 端口转发已存在: {}", expected_forward);
            return Ok(());
        }
        
        // 执行 adb forward
        info!("📡 设置端口转发: {} -> tcp:{}", device_id, self.port);
        let output = Command::new(&adb_path)
            .args(["-s", device_id, "forward", &local_remote, &local_remote])
            .output()
            .await
            .context("执行 adb forward 失败")?;
        
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            anyhow::bail!("adb forward 失败: {}", stderr);
        }
        
        debug!("✅ 端口转发设置成功");
        Ok(())
    }

    /// 将 JSON 节点转换为 XML 字符串 (递归)
    fn json_to_xml(&self, node: &NodeData, depth: usize) -> String {
        let indent = "  ".repeat(depth);
        let mut xml = String::new();

        // 构建属性
        let resource_id = node.resource_id.as_deref().unwrap_or("");
        let text = node.text.as_deref().unwrap_or("");
        let content_desc = node.content_description.as_deref().unwrap_or("");
        let class_name = &node.class_name;
        
        // 转换 bounds 格式: "left,top,right,bottom" -> "[left,top][right,bottom]"
        let bounds_formatted = self.format_bounds(&node.bounds);

        // 简单的 XML 转义 (需要更完善的转义)
        let text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
        let content_desc = content_desc.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");

        // 模拟 uiautomator 的 XML 格式
        xml.push_str(&format!(
            "{}<node index=\"0\" text=\"{}\" resource-id=\"{}\" class=\"{}\" package=\"\" content-desc=\"{}\" checkable=\"false\" checked=\"false\" clickable=\"false\" enabled=\"true\" focusable=\"false\" focused=\"false\" scrollable=\"false\" long-clickable=\"false\" password=\"false\" selected=\"false\" bounds=\"{}\">\n",
            indent, text, resource_id, class_name, content_desc, bounds_formatted
        ));

        for child in &node.children {
            xml.push_str(&self.json_to_xml(child, depth + 1));
        }

        xml.push_str(&format!("{}</node>\n", indent));
        xml
    }
    
    /// 格式化 bounds: "left,top,right,bottom" -> "[left,top][right,bottom]"
    fn format_bounds(&self, bounds: &str) -> String {
        // 尝试解析 "left,top,right,bottom" 格式
        let parts: Vec<&str> = bounds.split(',').collect();
        if parts.len() == 4 {
            // 标准格式 "left,top,right,bottom"
            format!("[{},{}][{},{}]", parts[0], parts[1], parts[2], parts[3])
        } else if bounds.starts_with('[') && bounds.contains("][") {
            // 已经是 "[left,top][right,bottom]" 格式
            bounds.to_string()
        } else {
            // 未知格式，尝试包装
            format!("[{}]", bounds)
        }
    }
}

#[async_trait]
impl ScreenCapturer for AndroidServiceStrategy {
    fn name(&self) -> &'static str {
        "AndroidService"
    }

    async fn capture(&self, device_id: &str) -> Result<DumpResult> {
        let start = Instant::now();
        debug!("🚀 AndroidService 模式开始: device={}", device_id);

        // 1. 确保端口转发
        if let Err(e) = self.ensure_port_forward(device_id).await {
            warn!("⚠️ 设置端口转发失败: {}", e);
            return Ok(DumpResult::failure(
                device_id.to_string(),
                DumpMode::A11y,
                format!("端口转发失败: {}", e),
                start.elapsed().as_millis() as u64
            ));
        }

        // 2. 连接 Socket
        let addr = format!("127.0.0.1:{}", self.port);
        let mut stream = match tokio::time::timeout(
            Duration::from_millis(self.timeout_ms),
            TcpStream::connect(&addr)
        ).await {
            Ok(Ok(s)) => s,
            Ok(Err(e)) => return Ok(DumpResult::failure(
                device_id.to_string(),
                DumpMode::A11y,
                format!("连接失败 (请确认 Android App 已启动): {}", e),
                start.elapsed().as_millis() as u64
            )),
            Err(_) => return Ok(DumpResult::failure(
                device_id.to_string(),
                DumpMode::A11y,
                "连接超时 (请确认 Android App 已启动并授权无障碍权限)".to_string(),
                start.elapsed().as_millis() as u64
            )),
        };

        // 3. 发送 DUMP 命令
        if let Err(e) = stream.write_all(b"DUMP\n").await {
            return Ok(DumpResult::failure(
                device_id.to_string(),
                DumpMode::A11y,
                format!("发送命令失败: {}", e),
                start.elapsed().as_millis() as u64
            ));
        }

        // 4. 读取响应
        let mut reader = BufReader::new(stream);
        let mut response = String::new();
        if let Err(e) = reader.read_line(&mut response).await {
            return Ok(DumpResult::failure(
                device_id.to_string(),
                DumpMode::A11y,
                format!("读取响应失败: {}", e),
                start.elapsed().as_millis() as u64
            ));
        }

        // 5. 解析 JSON
        let node_data: NodeData = match serde_json::from_str(&response) {
            Ok(data) => data,
            Err(e) => return Ok(DumpResult::failure(
                device_id.to_string(),
                DumpMode::A11y,
                format!("JSON 解析失败: {}", e),
                start.elapsed().as_millis() as u64
            )),
        };

        // 6. 转换为 XML
        // 添加 XML 头和根 hierarchy 节点
        let mut xml_content = String::from("<?xml version='1.0' encoding='UTF-8' standalone='yes' ?>\n<hierarchy rotation=\"0\">\n");
        xml_content.push_str(&self.json_to_xml(&node_data, 1));
        xml_content.push_str("</hierarchy>");

        let elapsed = start.elapsed().as_millis() as u64;
        info!("✅ AndroidService 采集成功: {}ms, length={}", elapsed, xml_content.len());

        Ok(DumpResult::success(
            device_id.to_string(),
            DumpMode::A11y,
            xml_content,
            elapsed
        ))
    }
}

#[derive(Debug, Serialize, Deserialize)]
struct NodeData {
    #[serde(rename = "className")]
    class_name: String,
    text: Option<String>,
    #[serde(rename = "contentDescription")]
    content_description: Option<String>,
    #[serde(rename = "resourceId")]
    resource_id: Option<String>,
    bounds: String,
    children: Vec<NodeData>,
}
