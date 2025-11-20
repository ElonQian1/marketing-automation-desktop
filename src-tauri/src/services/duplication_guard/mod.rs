use serde::{Deserialize, Serialize};
use std::sync::{Mutex, OnceLock};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DuplicationRule {
    pub id: String,
    pub name: String,
    pub action: String, // follow | reply | like | share
    pub time_window_hours: u64,
    pub max_actions_per_target: u32,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DuplicationCheckRequest {
    pub target_id: String,
    pub action: String, // follow | reply | like | share
    pub device_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DuplicationCheckResult {
    pub result: String,    // pass | blocked
    pub reason: String,
    pub confidence: u8,    // 0-100
    pub rule_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActionRecord {
    pub target_id: String,
    pub action: String,
    pub device_id: String,
    pub timestamp: i64, // epoch millis
}

static STORE: OnceLock<Mutex<DuplicationStore>> = OnceLock::new();

#[derive(Default)]
pub struct DuplicationStore {
    pub rules: Vec<DuplicationRule>,
    pub records: Vec<ActionRecord>,
}

impl DuplicationStore {
    pub fn global() -> &'static Mutex<DuplicationStore> {
        STORE.get_or_init(|| {
            let mut store = DuplicationStore::default();
            // default basic rules
            store.rules.push(DuplicationRule {
                id: "default_follow_24h".into(),
                name: "关注防重复（24小时）".into(),
                action: "follow".into(),
                time_window_hours: 24,
                max_actions_per_target: 1,
                enabled: true,
            });
            store.rules.push(DuplicationRule {
                id: "default_reply_1h".into(),
                name: "回复防重复（1小时）".into(),
                action: "reply".into(),
                time_window_hours: 1,
                max_actions_per_target: 1,
                enabled: true,
            });
            Mutex::new(store)
        })
    }

    pub fn check(&self, req: &DuplicationCheckRequest) -> DuplicationCheckResult {
        // get applicable rules
        let rules: Vec<&DuplicationRule> = self
            .rules
            .iter()
            .filter(|r| r.enabled && r.action == req.action)
            .collect();

        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as i64;

        for rule in rules {
            let cutoff = now - (rule.time_window_hours as i64) * 60 * 60 * 1000;
            let count = self
                .records
                .iter()
                .filter(|rec| {
                    rec.action == req.action
                        && rec.target_id == req.target_id
                        && rec.timestamp > cutoff
                })
                .count() as u32;

            if count >= rule.max_actions_per_target {
                return DuplicationCheckResult {
                    result: "blocked".into(),
                    reason: format!(
                        "{} 内已对该目标执行 {} 次，超过上限 {}",
                        humanize_hours(rule.time_window_hours),
                        count,
                        rule.max_actions_per_target
                    ),
                    confidence: 95,
                    rule_id: Some(rule.id.clone()),
                };
            }
        }

        DuplicationCheckResult {
            result: "pass".into(),
            reason: "未检测到重复操作".into(),
            confidence: 0,
            rule_id: None,
        }
    }

    pub fn record(&mut self, record: ActionRecord) {
        self.records.push(record);
        if self.records.len() > 20_000 { // simple cap
            self.records.drain(0..10_000);
        }
    }
}

fn humanize_hours(h: u64) -> String {
    if h % 24 == 0 {
        format!("{}天", h / 24)
    } else {
        format!("{}小时", h)
    }
}

#[tauri::command]
pub fn check_duplication_action_cmd(req: DuplicationCheckRequest) -> DuplicationCheckResult {
    let store = DuplicationStore::global().lock().unwrap();
    store.check(&req)
}

#[tauri::command]
pub fn record_duplication_action_cmd(record: ActionRecord) {
    let mut store = DuplicationStore::global().lock().unwrap();
    store.record(record);
}

