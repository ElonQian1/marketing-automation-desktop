// src-tauri/src/domain/structure_runtime_match/ports/cache.rs
// module: structure_runtime_match | layer: domain | role: 缓存接口
// summary: 模板缓存的trait定义 + NoopCache/MemCache实现

use std::collections::HashMap;

pub trait SmCache {
    fn get(&mut self, k: &str) -> Option<Vec<u8>>;
    fn set(&mut self, k: &str, v: Vec<u8>);
}

#[derive(Default)]
pub struct NoopCache;

impl SmCache for NoopCache {
    fn get(&mut self, _k: &str) -> Option<Vec<u8>> {
        None
    }
    fn set(&mut self, _k: &str, _v: Vec<u8>) {}
}

#[derive(Default)]
pub struct MemCache {
    inner: HashMap<String, Vec<u8>>,
}

impl SmCache for MemCache {
    fn get(&mut self, k: &str) -> Option<Vec<u8>> {
        self.inner.get(k).cloned()
    }
    fn set(&mut self, k: &str, v: Vec<u8>) {
        self.inner.insert(k.to_string(), v);
    }
}
