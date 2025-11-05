// Phase 2 XML 缓存系统测试
// 测试引用计数和生命周期管理功能

const { invoke } = window.__TAURI__.tauri;

async function testPhase2Cache() {
    console.log("🚀 开始测试 Phase 2 XML 缓存系统...");
    
    try {
        // 1. 获取系统状态
        console.log("1️⃣ 获取缓存系统状态...");
        const systemStatus = await invoke("get_cache_system_status");
        console.log("缓存系统状态:", systemStatus);
        
        // 2. 测试数据
        const testXmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<hierarchy>
    <android.widget.FrameLayout bounds="[0,0][1080,1920]" class="android.widget.FrameLayout">
        <android.widget.TextView bounds="[100,200][500,300]" class="android.widget.TextView" text="测试按钮" />
        <android.widget.Button bounds="[600,400][900,500]" class="android.widget.Button" text="点击我" clickable="true" />
    </android.widget.FrameLayout>
</hierarchy>`;

        // 3. 缓存 DOM 快照
        console.log("2️⃣ 缓存 DOM 快照...");
        const domResult = await invoke("cache_dom_snapshot", {
            xmlContent: testXmlContent,
            metadata: { source: "test", timestamp: Date.now() }
        });
        console.log("DOM 缓存结果:", domResult);
        const domSnapshotId = domResult.snapshot_id;
        
        // 4. Pin 快照（增加引用计数）
        console.log("3️⃣ Pin 快照 (增加引用计数)...");
        const pinResult = await invoke("pin_snapshot_command", {
            snapshotId: domSnapshotId,
            ownerId: "test-step-001"
        });
        console.log("Pin 结果:", pinResult);
        
        // 5. 链接步骤到快照
        console.log("4️⃣ 链接步骤到快照...");
        const linkResult = await invoke("link_step_snapshot_command", {
            stepId: "step-test-001", 
            snapshotId: domSnapshotId,
            relationType: "primary"
        });
        console.log("链接结果:", linkResult);
        
        // 6. 获取快照引用信息
        console.log("5️⃣ 获取快照引用信息...");
        const refInfo = await invoke("get_snapshot_ref_info_command", {
            snapshotId: domSnapshotId
        });
        console.log("引用信息:", refInfo);
        
        // 7. 验证缓存一致性
        console.log("6️⃣ 验证缓存一致性...");
        const consistencyResult = await invoke("validate_cache_consistency_command");
        console.log("一致性验证:", consistencyResult);
        
        // 8. 再次获取系统状态，查看变化
        console.log("7️⃣ 再次获取系统状态...");
        const updatedSystemStatus = await invoke("get_cache_system_status");
        console.log("更新后系统状态:", updatedSystemStatus);
        
        // 9. 解除步骤链接
        console.log("8️⃣ 解除步骤链接...");
        const unlinkResult = await invoke("unlink_step_snapshot_command", {
            stepId: "step-test-001",
            snapshotId: domSnapshotId
        });
        console.log("解除链接结果:", unlinkResult);
        
        // 10. Unpin 快照（减少引用计数）
        console.log("9️⃣ Unpin 快照 (减少引用计数)...");
        const unpinResult = await invoke("unpin_snapshot_command", {
            snapshotId: domSnapshotId,
            ownerId: "test-step-001"
        });
        console.log("Unpin 结果:", unpinResult);
        
        // 11. 最终系统状态
        console.log("🔟 最终系统状态...");
        const finalSystemStatus = await invoke("get_cache_system_status");
        console.log("最终系统状态:", finalSystemStatus);
        
        console.log("✅ Phase 2 缓存系统测试完成！");
        
    } catch (error) {
        console.error("❌ 测试失败:", error);
    }
}

// 运行测试
testPhase2Cache();