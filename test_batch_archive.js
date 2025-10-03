// 测试"批量归档为未导入"功能的完整脚本
// 在浏览器开发者工具控制台中运行

async function testBatchArchiveFunction() {
  try {
    console.log('🧪 开始测试批量归档功能...');
    
    // 测试记录ID (之前设置为不同状态)
    const testIds = [6, 7]; // assigned 和 imported 状态的记录
    
    console.log('📋 测试前 - 查询当前状态...');
    const beforeList = await window.__TAURI__.invoke('list_contact_numbers', {
      limit: 10,
      offset: 0
    });
    const beforeRecords = beforeList.items.filter(item => testIds.includes(item.id));
    console.log('🔍 测试前记录状态:', beforeRecords);
    
    console.log(`📤 调用 mark_contact_numbers_as_not_imported 命令，参数:`, testIds);
    
    // 调用批量归档功能
    const result = await window.__TAURI__.invoke('mark_contact_numbers_as_not_imported', {
      number_ids: testIds,
      numberIds: testIds  // 兼容性参数
    });
    
    console.log('✅ 命令执行成功，影响行数:', result);
    
    // 验证结果
    console.log('📋 测试后 - 查询结果状态...');
    const afterList = await window.__TAURI__.invoke('list_contact_numbers', {
      limit: 10,
      offset: 0
    });
    const afterRecords = afterList.items.filter(item => testIds.includes(item.id));
    console.log('🎯 测试后记录状态:', afterRecords);
    
    // 验证状态变化
    const statusChanges = afterRecords.map(after => {
      const before = beforeRecords.find(b => b.id === after.id);
      return {
        id: after.id,
        phone: after.phone,
        beforeStatus: before?.status || 'unknown',
        afterStatus: after.status,
        assignedBatchCleared: !after.assigned_batch_id,
        importedDeviceCleared: !after.imported_device_id,
        success: after.status === 'available'
      };
    });
    
    console.log('� 状态变化汇总:', statusChanges);
    
    const allSuccess = statusChanges.every(change => change.success);
    
    return { 
      success: allSuccess, 
      affectedRows: result, 
      beforeRecords, 
      afterRecords, 
      statusChanges,
      summary: `${statusChanges.filter(c => c.success).length}/${statusChanges.length} 条记录成功归档为可用状态`
    };
  } catch (error) {
    console.error('❌ 测试失败:', error);
    return { success: false, error: error.message };
  }
}

// 测试前端服务层调用
async function testFrontendServiceCall() {
  try {
    console.log('🧪 测试前端服务层调用...');
    
    // 模拟前端服务调用 (需要确保已导入相关模块)
    // 这里直接调用Tauri命令，因为在控制台中无法导入模块
    
    const testIds = [6, 7];
    
    // 调用前端兼容的服务方法
    const serviceLevelResult = await window.__TAURI__.invoke('mark_contact_numbers_as_not_imported', {
      number_ids: testIds,
      numberIds: testIds
    });
    
    console.log('✅ 前端服务层调用成功，结果:', serviceLevelResult);
    return { success: true, result: serviceLevelResult };
    
  } catch (error) {
    console.error('❌ 前端服务层测试失败:', error);
    return { success: false, error: error.message };
  }
}

// 运行完整测试
console.log('🚀 开始批量归档功能测试...');
testBatchArchiveFunction().then(result => {
  console.log('🏁 完整测试结果:', result);
  
  if (result.success) {
    console.log('✅ 批量归档功能修复成功！');
    console.log('📊 测试摘要:', result.summary);
  } else {
    console.log('❌ 批量归档功能仍有问题');
  }
});