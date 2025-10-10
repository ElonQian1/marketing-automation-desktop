/**
 * 精准获客系统使用演示
 * 
 * 展示如何初始化和使用精准获客系统的各个组件
 */

import {
  PreciseAcquisitionSystem,
  startPreciseAcquisitionSystem,
  stopPreciseAcquisitionSystem,
  getPreciseAcquisitionSystemInfo,
  diagnosePreciseAcquisitionSystem,
  getTagSystemService,
  getCsvValidationService,
  getReportingService,
  emergencySystemReset
} from './PreciseAcquisitionSystem';

// ==================== 系统初始化演示 ====================

/**
 * 初始化精准获客系统演示
 */
export async function demonstrateSystemInitialization(): Promise<void> {
  console.log('🚀 开始精准获客系统初始化演示...');

  try {
    // 1. 启动系统
    console.log('1. 启动系统...');
    await startPreciseAcquisitionSystem();
    console.log('✅ 系统启动成功');

    // 2. 获取系统信息
    console.log('\n2. 获取系统信息...');
    const systemInfo = await getPreciseAcquisitionSystemInfo();
    console.log('📊 系统信息:', {
      status: systemInfo.status,
      version: systemInfo.version,
      uptime: `${Math.round(systemInfo.uptime / 1000)}秒`,
      services: systemInfo.services
    });

    // 3. 执行系统诊断
    console.log('\n3. 执行系统诊断...');
    const diagnosis = await diagnosePreciseAcquisitionSystem();
    console.log('🔍 诊断结果:', {
      overall: diagnosis.overall,
      configurationStatus: diagnosis.details.configuration.status,
      servicesStatus: diagnosis.details.services.status,
      totalServices: diagnosis.details.performance.metrics.totalServices
    });

  } catch (error) {
    console.error('❌ 系统初始化失败:', error);
    throw error;
  }
}

// ==================== 服务使用演示 ====================

/**
 * 标签系统使用演示
 */
export async function demonstrateTagSystem(): Promise<void> {
  console.log('\n📋 开始标签系统使用演示...');

  try {
    const tagService = await getTagSystemService();

    // 创建标签
    console.log('1. 创建标签...');
    const newTag = await tagService.createTag('高价值客户', '客户分类');
    console.log('✅ 标签创建成功:', newTag);

    // 列出标签
    console.log('2. 列出所有标签...');
    const tags = await tagService.listTags();
    console.log('📝 标签列表:', tags);

  } catch (error) {
    console.error('❌ 标签系统演示失败:', error);
  }
}

/**
 * CSV验证服务使用演示
 */
export async function demonstrateCsvValidation(): Promise<void> {
  console.log('\n📄 开始CSV验证服务使用演示...');

  try {
    const csvService = await getCsvValidationService();

    // 验证CSV数据
    console.log('1. 验证CSV数据...');
    const testData = [
      { name: '张三', email: 'zhangsan@example.com', phone: '13800138000' },
      { name: '李四', email: 'lisi@example.com', phone: '13900139000' }
    ];

    const validationResult = await csvService.validateCsv(testData);
    console.log('✅ CSV验证结果:', validationResult);

  } catch (error) {
    console.error('❌ CSV验证服务演示失败:', error);
  }
}

/**
 * 报告服务使用演示
 */
export async function demonstrateReporting(): Promise<void> {
  console.log('\n📊 开始报告服务使用演示...');

  try {
    const reportingService = await getReportingService();

    // 生成日报
    console.log('1. 生成日报...');
    const today = new Date();
    const dailyReport = await reportingService.generateDailyReport(today);
    console.log('✅ 日报生成成功:', dailyReport);

  } catch (error) {
    console.error('❌ 报告服务演示失败:', error);
  }
}

// ==================== 完整系统演示 ====================

/**
 * 完整系统演示流程
 */
export async function demonstrateCompleteSystem(): Promise<void> {
  console.log('🎯 开始完整精准获客系统演示...\n');

  try {
    // 1. 系统初始化
    await demonstrateSystemInitialization();

    // 2. 服务功能演示
    await demonstrateTagSystem();
    await demonstrateCsvValidation();
    await demonstrateReporting();

    // 3. 系统停止
    console.log('\n4. 停止系统...');
    await stopPreciseAcquisitionSystem();
    console.log('✅ 系统停止成功');

    console.log('\n🎉 完整系统演示完成！');

  } catch (error) {
    console.error('❌ 系统演示过程中发生错误:', error);
    
    // 紧急重置
    try {
      console.log('\n🔧 执行紧急系统重置...');
      await emergencySystemReset();
      console.log('✅ 紧急重置完成');
    } catch (resetError) {
      console.error('❌ 紧急重置失败:', resetError);
    }
  }
}

// ==================== 错误处理演示 ====================

/**
 * 错误处理和恢复演示
 */
export async function demonstrateErrorHandling(): Promise<void> {
  console.log('\n🔧 开始错误处理演示...');

  try {
    const system = PreciseAcquisitionSystem.getInstance();

    // 1. 模拟系统错误
    console.log('1. 模拟系统错误...');
    
    // 人为触发一个错误（尝试在未初始化状态下获取服务）
    try {
      await getTagSystemService();
    } catch (error) {
      console.log('⚠️ 捕获到预期错误:', (error as Error).message);
    }

    // 2. 正常启动系统
    console.log('2. 正常启动系统进行恢复...');
    await system.start();
    console.log('✅ 系统恢复成功');

    // 3. 验证系统状态
    console.log('3. 验证系统状态...');
    const isRunning = system.isRunning();
    console.log('🔍 系统运行状态:', isRunning ? '正常运行' : '未运行');

    // 4. 清理
    await system.stop();
    console.log('✅ 错误处理演示完成');

  } catch (error) {
    console.error('❌ 错误处理演示失败:', error);
  }
}

// ==================== 性能测试演示 ====================

/**
 * 性能测试演示
 */
export async function demonstratePerformance(): Promise<void> {
  console.log('\n⚡ 开始性能测试演示...');

  try {
    // 1. 启动系统并计时
    console.log('1. 测试系统启动性能...');
    const startTime = Date.now();
    
    await startPreciseAcquisitionSystem();
    
    const initTime = Date.now() - startTime;
    console.log(`✅ 系统启动耗时: ${initTime}ms`);

    // 2. 测试服务获取性能
    console.log('2. 测试服务获取性能...');
    const serviceStartTime = Date.now();
    
    await Promise.all([
      getTagSystemService(),
      getCsvValidationService(),
      getReportingService()
    ]);
    
    const serviceTime = Date.now() - serviceStartTime;
    console.log(`✅ 服务获取耗时: ${serviceTime}ms`);

    // 3. 测试批量操作性能
    console.log('3. 测试批量操作性能...');
    const batchStartTime = Date.now();
    
    const tagService = await getTagSystemService();
    const promises = [];
    
    for (let i = 0; i < 10; i++) {
      promises.push(tagService.createTag(`测试标签${i}`, '性能测试'));
    }
    
    await Promise.all(promises);
    
    const batchTime = Date.now() - batchStartTime;
    console.log(`✅ 批量创建10个标签耗时: ${batchTime}ms`);

    // 4. 清理
    await stopPreciseAcquisitionSystem();
    console.log('✅ 性能测试完成');

  } catch (error) {
    console.error('❌ 性能测试失败:', error);
  }
}

// ==================== 导出主要演示函数 ====================

/**
 * 运行所有演示
 */
export async function runAllDemonstrations(): Promise<void> {
  console.log('🌟 开始运行所有精准获客系统演示...\n');

  const demonstrations = [
    { name: '完整系统演示', fn: demonstrateCompleteSystem },
    { name: '错误处理演示', fn: demonstrateErrorHandling },
    { name: '性能测试演示', fn: demonstratePerformance }
  ];

  for (const demo of demonstrations) {
    try {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`🎪 ${demo.name}`);
      console.log(`${'='.repeat(50)}`);
      
      await demo.fn();
      
      console.log(`✅ ${demo.name} 完成`);
      
      // 演示间等待
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ ${demo.name} 失败:`, error);
    }
  }

  console.log('\n🎉 所有演示运行完成！');
}

// ==================== 使用示例 ====================

// 如果直接运行此文件，执行演示
if (require.main === module) {
  runAllDemonstrations().catch(console.error);
}