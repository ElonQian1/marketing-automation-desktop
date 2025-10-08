use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct XmlElement {
	pub tag: String,
	pub attributes: HashMap<String, String>,
	pub text: Option<String>,
	pub children: Vec<XmlElement>,
	pub bounds: Option<(i32, i32, i32, i32)>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct XmlCondition {
	pub condition_type: String,
	pub selector: String,
	pub value: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct XmlJudgmentResult {
	pub success: bool,
	pub matched: bool,
	pub elements: Vec<XmlElement>,
	pub error: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MatchCriteriaDTO {
	pub strategy: String,
	pub fields: Vec<String>,
	pub values: HashMap<String, String>,
	#[serde(default)]
	pub excludes: HashMap<String, Vec<String>>,
	#[serde(default)]
	pub includes: HashMap<String, Vec<String>>,
	#[serde(default)]
	pub match_mode: HashMap<String, String>,
	#[serde(default)]
	pub regex_includes: HashMap<String, Vec<String>>,
	#[serde(default)]
	pub regex_excludes: HashMap<String, Vec<String>>,
	#[serde(default)]
	pub hidden_element_parent_config: Option<HiddenElementParentConfig>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct HiddenElementParentConfig {
	pub target_text: String,
	#[serde(default = "default_max_traversal_depth")]
	pub max_traversal_depth: usize,
	#[serde(default = "default_clickable_indicators")]
	pub clickable_indicators: Vec<String>,
	#[serde(default = "default_exclude_indicators")]
	pub exclude_indicators: Vec<String>,
	#[serde(default = "default_confidence_threshold")]
	pub confidence_threshold: f64,
}

fn default_max_traversal_depth() -> usize { 5 }
fn default_clickable_indicators() -> Vec<String> {
	vec![
		"Button".to_string(), 
		"ImageButton".to_string(), 
		"TextView".to_string(), 
		"LinearLayout".to_string(), 
		"RelativeLayout".to_string()
	]
}
fn default_exclude_indicators() -> Vec<String> {
	vec![
		"ScrollView".to_string(), 
		"ListView".to_string(), 
		"RecyclerView".to_string()
	]
}
fn default_confidence_threshold() -> f64 { 0.7 }

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct MatchPreviewDTO {
	pub text: Option<String>,
	pub resource_id: Option<String>,
	pub class_name: Option<String>,
	pub package: Option<String>,
	pub bounds: Option<String>,
	pub xpath: Option<String>,
}

#[allow(non_snake_case)]
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MatchResultDTO {
	pub ok: bool,
	pub message: String,
	pub total: Option<usize>,
	pub matchedIndex: Option<usize>,
	pub preview: Option<MatchPreviewDTO>,
}