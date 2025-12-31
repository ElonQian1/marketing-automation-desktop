// server/src/api/admin.rs
// module: lead-server | layer: api | role: 管理后台 API
// summary: 用户管理、系统管理接口

use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use crate::db::users;
use crate::api::auth;

// ========== 用户管理 ==========

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserListResponse {
    pub success: bool,
    pub users: Vec<UserInfo>,
    pub total: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserInfo {
    pub id: i32,
    pub username: String,
    pub nickname: Option<String>,
    pub role: Option<String>,
    pub created_at: Option<String>,
}

/// 获取用户列表
pub async fn list_users(
    State(pool): State<PgPool>,
) -> Result<Json<UserListResponse>, (StatusCode, String)> {
    // 查询所有用户
    let users = sqlx::query_as::<_, users::User>(
        r#"
        SELECT id, username, password_hash, nickname, role, created_at, updated_at
        FROM users ORDER BY id DESC
        "#
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // 查询总数
    let total: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users")
        .fetch_one(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let user_infos: Vec<UserInfo> = users
        .into_iter()
        .map(|u| UserInfo {
            id: u.id,
            username: u.username,
            nickname: u.nickname,
            role: u.role,
            created_at: u.created_at.map(|dt| dt.format("%Y-%m-%d %H:%M").to_string()),
        })
        .collect();

    Ok(Json(UserListResponse {
        success: true,
        users: user_infos,
        total: total.0,
    }))
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateUserRequest {
    pub nickname: Option<String>,
    pub role: Option<String>,
    pub password: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiResponse {
    pub success: bool,
    pub message: Option<String>,
}

/// 更新用户信息
pub async fn update_user(
    State(pool): State<PgPool>,
    Path(user_id): Path<i32>,
    Json(req): Json<UpdateUserRequest>,
) -> Result<Json<ApiResponse>, (StatusCode, String)> {
    // 检查用户是否存在
    let user = users::find_by_id(&pool, user_id)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if user.is_none() {
        return Ok(Json(ApiResponse {
            success: false,
            message: Some("用户不存在".to_string()),
        }));
    }

    // 更新昵称
    if let Some(nickname) = &req.nickname {
        sqlx::query("UPDATE users SET nickname = $1, updated_at = NOW() WHERE id = $2")
            .bind(nickname)
            .bind(user_id)
            .execute(&pool)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    // 更新角色
    if let Some(role) = &req.role {
        sqlx::query("UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2")
            .bind(role)
            .bind(user_id)
            .execute(&pool)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    // 更新密码
    if let Some(password) = &req.password {
        if !password.is_empty() {
            let password_hash = auth::hash_password(password);
            sqlx::query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2")
                .bind(&password_hash)
                .bind(user_id)
                .execute(&pool)
                .await
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        }
    }

    Ok(Json(ApiResponse {
        success: true,
        message: Some("更新成功".to_string()),
    }))
}

/// 删除用户
pub async fn delete_user(
    State(pool): State<PgPool>,
    Path(user_id): Path<i32>,
) -> Result<Json<ApiResponse>, (StatusCode, String)> {
    // 不允许删除 ID 为 1 的管理员
    if user_id == 1 {
        return Ok(Json(ApiResponse {
            success: false,
            message: Some("不能删除超级管理员".to_string()),
        }));
    }

    sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(user_id)
        .execute(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(ApiResponse {
        success: true,
        message: Some("删除成功".to_string()),
    }))
}

// ========== 管理后台页面 ==========

/// 返回管理后台 HTML 页面
pub async fn admin_page() -> axum::response::Html<&'static str> {
    axum::response::Html(ADMIN_HTML)
}

const ADMIN_HTML: &str = r#"<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>营销助手 - 管理后台</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px 40px; }
        .header h1 { font-size: 24px; font-weight: 600; }
        .header p { opacity: 0.8; margin-top: 4px; }
        .container { max-width: 1200px; margin: 0 auto; padding: 24px; }
        .card { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-bottom: 24px; }
        .card-header { padding: 16px 24px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
        .card-header h2 { font-size: 18px; color: #333; }
        .card-body { padding: 24px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .stat-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .stat-card .value { font-size: 32px; font-weight: 700; color: #667eea; }
        .stat-card .label { color: #666; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #f8f9fa; font-weight: 600; color: #333; }
        tr:hover { background: #f8f9fa; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
        .badge-admin { background: #e3f2fd; color: #1976d2; }
        .badge-user { background: #e8f5e9; color: #388e3c; }
        .btn { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; transition: all 0.2s; }
        .btn-primary { background: #667eea; color: white; }
        .btn-primary:hover { background: #5a6fd6; }
        .btn-danger { background: #f44336; color: white; }
        .btn-danger:hover { background: #d32f2f; }
        .btn-sm { padding: 6px 12px; font-size: 12px; }
        .btn-group { display: flex; gap: 8px; }
        .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center; }
        .modal.active { display: flex; }
        .modal-content { background: white; border-radius: 12px; padding: 24px; width: 100%; max-width: 400px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .modal-header h3 { font-size: 18px; }
        .modal-close { background: none; border: none; font-size: 24px; cursor: pointer; color: #666; }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; margin-bottom: 6px; font-weight: 500; color: #333; }
        .form-group input, .form-group select { width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; }
        .form-group input:focus, .form-group select:focus { outline: none; border-color: #667eea; }
        .loading { text-align: center; padding: 40px; color: #666; }
        .empty { text-align: center; padding: 60px; color: #999; }
        .toast { position: fixed; bottom: 20px; right: 20px; padding: 12px 24px; border-radius: 8px; color: white; font-size: 14px; z-index: 2000; animation: slideIn 0.3s; }
        .toast-success { background: #4caf50; }
        .toast-error { background: #f44336; }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛠️ 营销助手管理后台</h1>
        <p>用户管理 · 系统监控</p>
    </div>
    
    <div class="container">
        <!-- 统计卡片 -->
        <div class="stats">
            <div class="stat-card">
                <div class="value" id="totalUsers">-</div>
                <div class="label">注册用户</div>
            </div>
            <div class="stat-card">
                <div class="value" id="totalComments">-</div>
                <div class="label">采集评论</div>
            </div>
            <div class="stat-card">
                <div class="value" id="totalDevices">-</div>
                <div class="label">设备数量</div>
            </div>
        </div>
        
        <!-- 用户列表 -->
        <div class="card">
            <div class="card-header">
                <h2>👥 用户管理</h2>
                <button class="btn btn-primary" onclick="showAddUserModal()">+ 添加用户</button>
            </div>
            <div class="card-body">
                <table id="userTable">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>用户名</th>
                            <th>昵称</th>
                            <th>角色</th>
                            <th>注册时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody id="userTableBody">
                        <tr><td colspan="6" class="loading">加载中...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    
    <!-- 编辑用户弹窗 -->
    <div class="modal" id="editModal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="modalTitle">编辑用户</h3>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <form id="editForm" onsubmit="submitForm(event)">
                <input type="hidden" id="editUserId">
                <div class="form-group">
                    <label>用户名</label>
                    <input type="text" id="editUsername" disabled>
                </div>
                <div class="form-group">
                    <label>昵称</label>
                    <input type="text" id="editNickname" placeholder="输入昵称">
                </div>
                <div class="form-group">
                    <label>角色</label>
                    <select id="editRole">
                        <option value="user">普通用户</option>
                        <option value="admin">管理员</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>新密码（留空不修改）</label>
                    <input type="password" id="editPassword" placeholder="输入新密码">
                </div>
                <div class="btn-group" style="justify-content: flex-end; margin-top: 20px;">
                    <button type="button" class="btn" onclick="closeModal()">取消</button>
                    <button type="submit" class="btn btn-primary">保存</button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- 添加用户弹窗 -->
    <div class="modal" id="addModal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>添加用户</h3>
                <button class="modal-close" onclick="closeAddModal()">&times;</button>
            </div>
            <form id="addForm" onsubmit="submitAddForm(event)">
                <div class="form-group">
                    <label>用户名</label>
                    <input type="text" id="addUsername" placeholder="至少3个字符" required>
                </div>
                <div class="form-group">
                    <label>密码</label>
                    <input type="password" id="addPassword" placeholder="至少6个字符" required>
                </div>
                <div class="form-group">
                    <label>昵称（选填）</label>
                    <input type="text" id="addNickname" placeholder="输入昵称">
                </div>
                <div class="btn-group" style="justify-content: flex-end; margin-top: 20px;">
                    <button type="button" class="btn" onclick="closeAddModal()">取消</button>
                    <button type="submit" class="btn btn-primary">创建</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        const API_BASE = '';
        
        // 加载用户列表
        async function loadUsers() {
            try {
                const res = await fetch(`${API_BASE}/api/admin/users`);
                const data = await res.json();
                if (data.success) {
                    document.getElementById('totalUsers').textContent = data.total;
                    renderUsers(data.users);
                }
            } catch (e) {
                showToast('加载失败: ' + e.message, 'error');
            }
        }
        
        // 加载统计
        async function loadStats() {
            try {
                const res = await fetch(`${API_BASE}/api/stats`);
                const data = await res.json();
                if (data.success) {
                    document.getElementById('totalComments').textContent = data.stats.totalComments || 0;
                    document.getElementById('totalDevices').textContent = data.stats.totalDevices || 0;
                }
            } catch (e) {
                console.error('Stats load error:', e);
            }
        }
        
        // 渲染用户表格
        function renderUsers(users) {
            const tbody = document.getElementById('userTableBody');
            if (users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="empty">暂无用户</td></tr>';
                return;
            }
            tbody.innerHTML = users.map(u => `
                <tr>
                    <td>${u.id}</td>
                    <td><strong>${u.username}</strong></td>
                    <td>${u.nickname || '-'}</td>
                    <td><span class="badge ${u.role === 'admin' ? 'badge-admin' : 'badge-user'}">${u.role || 'user'}</span></td>
                    <td>${u.createdAt || '-'}</td>
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-primary btn-sm" onclick="editUser(${u.id}, '${u.username}', '${u.nickname || ''}', '${u.role || 'user'}')">编辑</button>
                            ${u.id !== 1 ? `<button class="btn btn-danger btn-sm" onclick="deleteUser(${u.id}, '${u.username}')">删除</button>` : ''}
                        </div>
                    </td>
                </tr>
            `).join('');
        }
        
        // 编辑用户
        function editUser(id, username, nickname, role) {
            document.getElementById('editUserId').value = id;
            document.getElementById('editUsername').value = username;
            document.getElementById('editNickname').value = nickname;
            document.getElementById('editRole').value = role;
            document.getElementById('editPassword').value = '';
            document.getElementById('editModal').classList.add('active');
        }
        
        function closeModal() {
            document.getElementById('editModal').classList.remove('active');
        }
        
        async function submitForm(e) {
            e.preventDefault();
            const id = document.getElementById('editUserId').value;
            const data = {
                nickname: document.getElementById('editNickname').value || null,
                role: document.getElementById('editRole').value,
                password: document.getElementById('editPassword').value || null,
            };
            try {
                const res = await fetch(`${API_BASE}/api/admin/users/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await res.json();
                if (result.success) {
                    showToast('保存成功', 'success');
                    closeModal();
                    loadUsers();
                } else {
                    showToast(result.message || '保存失败', 'error');
                }
            } catch (e) {
                showToast('请求失败: ' + e.message, 'error');
            }
        }
        
        // 删除用户
        async function deleteUser(id, username) {
            if (!confirm(`确定要删除用户 "${username}" 吗？此操作不可撤销。`)) return;
            try {
                const res = await fetch(`${API_BASE}/api/admin/users/${id}`, { method: 'DELETE' });
                const result = await res.json();
                if (result.success) {
                    showToast('删除成功', 'success');
                    loadUsers();
                } else {
                    showToast(result.message || '删除失败', 'error');
                }
            } catch (e) {
                showToast('请求失败: ' + e.message, 'error');
            }
        }
        
        // 添加用户
        function showAddUserModal() {
            document.getElementById('addUsername').value = '';
            document.getElementById('addPassword').value = '';
            document.getElementById('addNickname').value = '';
            document.getElementById('addModal').classList.add('active');
        }
        
        function closeAddModal() {
            document.getElementById('addModal').classList.remove('active');
        }
        
        async function submitAddForm(e) {
            e.preventDefault();
            const data = {
                username: document.getElementById('addUsername').value,
                password: document.getElementById('addPassword').value,
                nickname: document.getElementById('addNickname').value || null,
            };
            if (data.username.length < 3) {
                showToast('用户名至少3个字符', 'error');
                return;
            }
            if (data.password.length < 6) {
                showToast('密码至少6个字符', 'error');
                return;
            }
            try {
                const res = await fetch(`${API_BASE}/api/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await res.json();
                if (result.success) {
                    showToast('创建成功', 'success');
                    closeAddModal();
                    loadUsers();
                } else {
                    showToast(result.message || '创建失败', 'error');
                }
            } catch (e) {
                showToast('请求失败: ' + e.message, 'error');
            }
        }
        
        // Toast 提示
        function showToast(message, type) {
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.textContent = message;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }
        
        // 初始化
        loadUsers();
        loadStats();
    </script>
</body>
</html>
"#;
