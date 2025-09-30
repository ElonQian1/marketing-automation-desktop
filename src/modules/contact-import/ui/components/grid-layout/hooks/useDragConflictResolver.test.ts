// 拖拽冲突解决器测试验证
import { useDragConflictResolver } from './useDragConflictResolver';

// 基础类型检查
const testBasicUsage = () => {
  const resolver = useDragConflictResolver();
  
  // 检查返回值类型
  const { detectedConflicts, isMonitoring } = resolver;
  
  console.log('检测到的冲突:', detectedConflicts);
  console.log('是否正在监控:', isMonitoring);
};

// 高级配置测试
const testAdvancedConfig = () => {
  const resolver = useDragConflictResolver({
    autoFix: true,
    debug: true,
    priority: 'table-resize',
    detectInterval: 500
  });
  
  return resolver;
};

export { testBasicUsage, testAdvancedConfig };