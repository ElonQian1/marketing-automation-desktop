// src-tauri/src/domain/structure_runtime_match/skeleton/predicates.rs
// module: structure_runtime_match | layer: domain | role: 结构匹配谓词系统
// summary: 定义可点父、祖先容器、子孙计数等谓词接口，实现硬约束与软约束评估

use super::super::ports::xml_view::SmXmlView;
use super::super::types::SmNodeId;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Severity {
    /// 软约束：只参与加权得分，不做硬失败
    Soft,
    /// 硬约束：不满足直接判失败
    Hard,
}

#[derive(Debug, Clone)]
pub struct PredicateResult {
    pub passed: bool,
    pub contribution: f32, // 软权；硬约束通过给加分，不通过直接失败
    pub name: &'static str,
    pub explain: String,
}

pub trait Predicate<V: SmXmlView> {
    fn evaluate(&self, view: &V, node: SmNodeId) -> PredicateResult;
    fn name(&self) -> &'static str;
    fn severity(&self) -> Severity;
}

/* ========== 具体谓词实现 ========== */

/// 祖先存在"可滚容器"（或类名命中一组容器类）
pub struct AncestorScrollableOrClass<'a> {
    pub acceptable_classes: &'a [&'a str],
    pub weight: f32,
    pub severity: Severity,
}

impl<'a, V: SmXmlView> Predicate<V> for AncestorScrollableOrClass<'a> {
    fn evaluate(&self, view: &V, node: SmNodeId) -> PredicateResult {
        let mut hit_scrollable = false;
        let mut hit_class = false;
        
        // 遍历所有祖先节点
        let mut current = node;
        while let Some(parent) = view.parent(current) {
            // 检查是否可滚动
            if view.is_scrollable(parent) {
                hit_scrollable = true;
                break;
            }
            
            // 检查类名
            let cls = view.class(parent).to_ascii_lowercase();
            if self.acceptable_classes.iter().any(|c| cls.contains(&c.to_lowercase())) {
                hit_class = true;
                break;
            }
            
            current = parent;
        }
        
        let ok = hit_scrollable || hit_class;
        PredicateResult {
            passed: ok || (self.severity == Severity::Soft),
            contribution: if ok { self.weight } else { 0.0 },
            name: <Self as Predicate<V>>::name(self),
            explain: format!("ancestor_scrollable={} class_hit={}", hit_scrollable, hit_class),
        }
    }
    
    fn name(&self) -> &'static str { "ancestor_scrollable_or_class" }
    fn severity(&self) -> Severity { self.severity }
}

/// 自身或最近父节点可点击（可点父）
pub struct ClickableOrClickableParent {
    pub search_depth: usize, // 向上查几层
    pub weight: f32,
    pub severity: Severity,
}

impl<V: SmXmlView> Predicate<V> for ClickableOrClickableParent {
    fn evaluate(&self, view: &V, mut node: SmNodeId) -> PredicateResult {
        let mut depth = 0usize;
        let mut ok = view.is_clickable(node);
        let mut hit_node = node;
        
        while !ok && depth < self.search_depth {
            if let Some(p) = view.parent(node) {
                node = p;
                hit_node = p;
                ok = view.is_clickable(p);
                depth += 1;
            } else {
                break;
            }
        }
        
        PredicateResult {
            passed: ok || (self.severity == Severity::Soft),
            contribution: if ok { self.weight } else { 0.0 },
            name: <Self as Predicate<V>>::name(self),
            explain: format!("clickable_node={} depth={} ok={}", hit_node, depth, ok),
        }
    }
    
    fn name(&self) -> &'static str { "clickable_or_parent" }
    fn severity(&self) -> Severity { self.severity }
}

/// 资源ID 存在性/等值（默认 presence_only，用于混淆id）
pub struct ResourceIdPredicate {
    pub value: String,
    pub presence_only: bool,
    pub weight: f32,
    pub severity: Severity,
}

impl<V: SmXmlView> Predicate<V> for ResourceIdPredicate {
    fn evaluate(&self, view: &V, node: SmNodeId) -> PredicateResult {
        let rid = view.resource_id(node);
        let ok = if self.presence_only {
            !rid.is_empty()
        } else {
            rid == self.value
        };
        
        PredicateResult {
            passed: ok || (self.severity == Severity::Soft),
            contribution: if ok { self.weight } else { 0.0 },
            name: <Self as Predicate<V>>::name(self),
            explain: format!("resource_id='{}' presence_only={} ok={}", rid, self.presence_only, ok),
        }
    }
    
    fn name(&self) -> &'static str { "resource_id" }
    fn severity(&self) -> Severity { self.severity }
}

/// 类名包含
pub struct ClassContains {
    pub value: String,
    pub weight: f32,
    pub severity: Severity,
}

impl<V: SmXmlView> Predicate<V> for ClassContains {
    fn evaluate(&self, view: &V, node: SmNodeId) -> PredicateResult {
        let cls = view.class(node).to_ascii_lowercase();
        let ok = cls.contains(&self.value.to_lowercase());
        
        PredicateResult {
            passed: ok || (self.severity == Severity::Soft),
            contribution: if ok { self.weight } else { 0.0 },
            name: <Self as Predicate<V>>::name(self),
            explain: format!("class='{}' contains='{}' ok={}", cls, self.value, ok),
        }
    }
    
    fn name(&self) -> &'static str { "class_contains" }
    fn severity(&self) -> Severity { self.severity }
}

/// 属性必须为空（content-desc="" 或 text=""）
pub struct MustBeEmpty {
    pub attr_type: EmptyAttrType,
    pub weight: f32,
    pub severity: Severity,
}

#[derive(Debug, Clone, Copy)]
pub enum EmptyAttrType {
    ContentDesc,
    Text,
}

impl<V: SmXmlView> Predicate<V> for MustBeEmpty {
    fn evaluate(&self, view: &V, node: SmNodeId) -> PredicateResult {
        let ok = match self.attr_type {
            EmptyAttrType::ContentDesc => view.content_desc(node).is_empty(),
            EmptyAttrType::Text => view.text(node).is_empty(),
        };
        
        PredicateResult {
            passed: ok || (self.severity == Severity::Soft),
            contribution: if ok { self.weight } else { 0.0 },
            name: <Self as Predicate<V>>::name(self),
            explain: format!("{:?}_empty={}", self.attr_type, ok),
        }
    }
    
    fn name(&self) -> &'static str { "must_be_empty" }
    fn severity(&self) -> Severity { self.severity }
}

/// 子孙计数约束（如：至少1个TextView且text非空，至少1个ImageView）
pub struct DescendantCount {
    pub class_pattern: String,
    pub text_non_empty: bool,
    pub min_count: usize,
    pub weight: f32,
    pub severity: Severity,
}

impl<V: SmXmlView> Predicate<V> for DescendantCount {
    fn evaluate(&self, view: &V, node: SmNodeId) -> PredicateResult {
        let count = self.count_descendants(view, node);
        let ok = count >= self.min_count;
        
        PredicateResult {
            passed: ok || (self.severity == Severity::Soft),
            contribution: if ok { self.weight } else { 0.0 },
            name: <Self as Predicate<V>>::name(self),
            explain: format!("{}(text_non_empty={}) count={} min={} ok={}", 
                self.class_pattern, self.text_non_empty, count, self.min_count, ok),
        }
    }
    
    fn name(&self) -> &'static str { "descendant_count" }
    fn severity(&self) -> Severity { self.severity }
}

impl DescendantCount {
    fn count_descendants<V: SmXmlView>(&self, view: &V, node: SmNodeId) -> usize {
        let mut count = 0;
        let pattern_lower = self.class_pattern.to_lowercase();
        
        // 递归遍历所有子孙节点
        self.count_recursive(view, node, &pattern_lower, &mut count);
        count
    }
    
    fn count_recursive<V: SmXmlView>(&self, view: &V, node: SmNodeId, pattern: &str, count: &mut usize) {
        let children = view.children(node);
        for child in children {
            let cls = view.class(child).to_ascii_lowercase();
            
            if cls.contains(pattern) {
                if self.text_non_empty {
                    if !view.text(child).is_empty() {
                        *count += 1;
                    }
                } else {
                    *count += 1;
                }
            }
            
            // 递归检查子节点
            self.count_recursive(view, child, pattern, count);
        }
    }
}
