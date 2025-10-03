// 使用 Node.js 调用 Tauri 命令测试"归档删除"
const { invoke } = require('@tauri-apps/api/core');

async function testArchiveDelete() {
  try {
    console.log('🧪 开始测试归档删除功能...');
    console.log('📋 测试参数: recordId=9, archiveNumbers=true');
    
    // 调用归档删除功能
    const result = await invoke('delete_txt_import_record_cmd', {
      recordId: 9,
      archiveNumbers: true
    });
    
    console.log('✅ 归档删除成功!');
    console.log('📊 结果:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ 归档删除失败:', error);
    console.error('🔍 错误详情:', error.message || error);
  }
}

// 调用测试
testArchiveDelete();