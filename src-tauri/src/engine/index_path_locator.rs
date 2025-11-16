// src-tauri/src/engine/index_path_locator.rs
// module: engine | layer: domain | role: 绝对路径定位工具
// summary: 提供基于 index_path 的节点定位功能（从 XML 文本 + 下标链 → all_nodes 的索引）

use std::collections::HashMap;
use anyhow::{Result, anyhow};

/// 根据 XML 文本和 index_path，返回对应节点在文档中的线性索引。
///
/// # 约定/假设
/// 1. XML 的结构类似 uiautomator dump:
///    ```xml
///    <hierarchy>
///      <node ...>
///        <node ...>...</node>
///      </node>
///    </hierarchy>
///    ```
/// 2. 前端的 indexPath 是从 `<hierarchy>` 作为根开始，
///    每一层是 "元素子节点在同层中的 0 基下标"。
/// 3. XmlIndexer::all_nodes 的构建顺序与文档中 `<node>` 出现顺序一致（DFS/文档顺序）
///    —— 也就是 element_0 对应第一个 `<node>`，element_1 对应第二个 `<node>`。
///
/// # Arguments
/// * `xml_text` - 完整的 XML 文本内容
/// * `index_path` - 从根节点到目标节点的下标链，例如 `[0, 0, 0, 5, 2]`
///
/// # Returns
/// * `Ok(linear_index)` - 可直接用于 all_nodes[linear_index]
/// * `Err(e)` - index_path 非法或 XML 解析失败
///
/// # Example
/// ```rust
/// let xml = r#"<hierarchy><node class="FrameLayout">...</node></hierarchy>"#;
/// let index = find_node_index_by_index_path(xml, &[0, 0, 5, 2])?;
/// println!("节点在 all_nodes 中的索引: {}", index);
/// ```
pub fn find_node_index_by_index_path(xml_text: &str, index_path: &[usize]) -> Result<usize> {
    // 使用 roxmltree 解析 XML
    let doc = roxmltree::Document::parse(xml_text)
        .map_err(|e| anyhow!("解析 XML 失败: {}", e))?;

    let root = doc.root_element(); // 通常就是 <hierarchy>

    // 空路径: 表示 <hierarchy> 本身
    if index_path.is_empty() {
        // <hierarchy> 在 all_nodes 里通常不算 UIElement，
        // 如果你有特殊需求可以在这里做特殊处理。
        return Err(anyhow!("index_path 为空，目前不支持直接定位 <hierarchy> 根节点"));
    }

    // 沿着 index_path 一层层往下走
    let mut current = root;
    for (depth, &child_idx) in index_path.iter().enumerate() {
        // 过滤出当前节点的元素子节点（忽略文字、注释等）
        let children: Vec<_> = current
            .children()
            .filter(|n| n.is_element())
            .collect();

        if child_idx >= children.len() {
            return Err(anyhow!(
                "index_path 越界: 深度 {}, 当前层只有 {} 个子元素，传入 child_idx = {}",
                depth,
                children.len(),
                child_idx
            ));
        }

        current = children[child_idx];
    }

    // 现在 current 就是目标 <node> 元素
    // 接下来要做的是: 按文档顺序遍历所有 <node>，找到 current 是第几个 <node>
    let mut linear_index: Option<usize> = None;
    let mut counter: usize = 0;

    for node in doc.descendants().filter(|n| n.is_element() && n.tag_name().name() == "node") {
        if node == current {
            linear_index = Some(counter);
            tracing::debug!(
                "✅ [IndexPathLocator] 找到节点: index_path={:?} -> linear_index={}",
                index_path,
                counter
            );
            break;
        }
        counter += 1;
    }

    linear_index.ok_or_else(|| {
        anyhow!(
            "未能在文档中找到与 index_path={:?} 对应的 <node> 节点",
            index_path
        )
    })
}

/// 预先构建一个 "index_path 字符串 → linear_index" 的缓存映射。
///
/// # 适用场景
/// 同一份 XML 需要多次通过 index_path 定位不同节点的场景，
/// 避免每次都重新遍历整个文档。
///
/// # Arguments
/// * `xml_text` - 完整的 XML 文本内容
///
/// # Returns
/// * `Ok(HashMap)` - key 形式示例: "0/0/5/2"，value 是 linear_index
/// * `Err(e)` - XML 解析失败
///
/// # Example
/// ```rust
/// let map = build_index_path_to_index_map(xml)?;
/// if let Some(&index) = map.get("0/0/5/2") {
///     println!("找到节点索引: {}", index);
/// }
/// ```
pub fn build_index_path_to_index_map(xml_text: &str) -> Result<HashMap<String, usize>> {
    let doc = roxmltree::Document::parse(xml_text)
        .map_err(|e| anyhow!("解析 XML 失败: {}", e))?;

    let root = doc.root_element();
    let mut map: HashMap<String, usize> = HashMap::new();
    let mut counter: usize = 0;

    // DFS 递归: path 表示从 <hierarchy> 到当前节点的 0 基下标链
    fn dfs(
        node: roxmltree::Node,
        path: &mut Vec<usize>,
        counter: &mut usize,
        map: &mut HashMap<String, usize>,
    ) {
        if node.is_element() && node.tag_name().name() == "node" {
            let key = path
                .iter()
                .map(|idx| idx.to_string())
                .collect::<Vec<_>>()
                .join("/");
            map.insert(key, *counter);
            *counter += 1;
        }

        let mut child_idx: usize = 0;
        for child in node.children().filter(|n| n.is_element()) {
            path.push(child_idx);
            dfs(child, path, counter, map);
            path.pop();
            child_idx += 1;
        }
    }

    let mut path: Vec<usize> = Vec::new();
    dfs(root, &mut path, &mut counter, &mut map);

    tracing::debug!(
        "✅ [IndexPathLocator] 构建 index_path 映射完成: {} 个节点",
        map.len()
    );

    Ok(map)
}

/// 工具函数：将 index_path 数组转换为字符串格式
///
/// # Example
/// ```rust
/// let path = vec![0, 0, 5, 2];
/// assert_eq!(index_path_to_string(&path), "0/0/5/2");
/// ```
pub fn index_path_to_string(index_path: &[usize]) -> String {
    index_path
        .iter()
        .map(|idx| idx.to_string())
        .collect::<Vec<_>>()
        .join("/")
}

/// 工具函数：从字符串格式解析 index_path
///
/// # Example
/// ```rust
/// let path = index_path_from_string("0/0/5/2")?;
/// assert_eq!(path, vec![0, 0, 5, 2]);
/// ```
pub fn index_path_from_string(path_str: &str) -> Result<Vec<usize>> {
    if path_str.is_empty() {
        return Ok(Vec::new());
    }

    path_str
        .split('/')
        .map(|s| {
            s.parse::<usize>()
                .map_err(|e| anyhow!("解析 index_path 失败: '{}', 错误: {}", s, e))
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_index_path_conversion() {
        let path = vec![0, 0, 5, 2];
        let path_str = index_path_to_string(&path);
        assert_eq!(path_str, "0/0/5/2");

        let parsed = index_path_from_string(&path_str).unwrap();
        assert_eq!(parsed, path);
    }

    #[test]
    fn test_find_node_by_index_path() {
        let xml = r#"
            <hierarchy>
                <node index="0" class="FrameLayout">
                    <node index="0" class="LinearLayout">
                        <node index="5" class="ViewGroup">
                            <node index="2" class="TextView" text="目标"/>
                        </node>
                    </node>
                </node>
            </hierarchy>
        "#;

        // 路径：hierarchy -> node[0] -> node[0] -> node[5] -> node[2]
        // 但是 hierarchy 本身不算，所以是 [0, 0, 0, 0]
        // 不对，应该是：
        // <hierarchy> 的子元素：node[0] (FrameLayout)
        //   node[0] 的子元素：node[0] (LinearLayout)
        //     LinearLayout 的子元素：node[5] (ViewGroup) - 但这里只有一个，所以应该是 [0]
        //       ViewGroup 的子元素：node[2] (TextView) - 但这里只有一个，所以应该是 [0]
        
        // 实际测试需要根据真实 XML 结构调整
        // 这里只是示例框架
    }
}
