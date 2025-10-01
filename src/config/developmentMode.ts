/**
 * 开发模式配置
 * 在开发阶段允许无设备情况下查看功能演示
 */

export const isDevelopmentMode = () => {
  // 检查是否为开发环境
  return (import.meta as any).env?.DEV || (typeof window !== 'undefined' && window.location.hostname === 'localhost');
};

export const shouldBypassDeviceCheck = () => {
  // 在开发模式下可以通过环境变量控制是否跳过设备检查
  return isDevelopmentMode() && (
    (import.meta as any).env?.VITE_BYPASS_DEVICE_CHECK === 'true' ||
    true // 默认在开发模式下跳过设备检查
  );
};

// 模拟设备数据 - 返回符合Device类型的简单对象
export const getMockDevices = () => {
  // 使用符合Device接口的简单对象，避免导入循环依赖
  return [
    {
      id: 'mock_device_1',
      name: '华为 P40 Pro (模拟)',
      status: 'online' as const,
      type: 'usb' as const,
      model: 'ELS-AN00',
      product: '华为 P40 Pro',
      transportId: 'mock_transport_1',
      lastSeen: new Date(),
      properties: {
        'ro.product.name': '华为 P40 Pro',
        'ro.build.version.release': '10.0',
        'ro.product.model': 'ELS-AN00'
      },
      // Device类的方法
      isOnline: () => true,
      isEmulator: () => false,
      getDisplayName: () => '华为 P40 Pro (模拟)',
      withStatus: function(status: any) { return { ...this, status }; },
      withProperties: function(props: any) { return { ...this, properties: { ...this.properties, ...props } }; }
    },
    {
      id: 'mock_device_2',
      name: '小米 12 (模拟)',
      status: 'online' as const,
      type: 'usb' as const,
      model: 'MI12',
      product: '小米 12',
      transportId: 'mock_transport_2',
      lastSeen: new Date(),
      properties: {
        'ro.product.name': '小米 12',
        'ro.build.version.release': '12.0',
        'ro.product.model': 'MI12'
      },
      // Device类的方法
      isOnline: () => true,
      isEmulator: () => false,
      getDisplayName: () => '小米 12 (模拟)',
      withStatus: function(status: any) { return { ...this, status }; },
      withProperties: function(props: any) { return { ...this, properties: { ...this.properties, ...props } }; }
    }
  ] as any[]; // 使用any来避免类型检查问题
};

// 模拟监控数据
export const getMockMonitoringData = () => ({
  tasks: [
    {
      id: '1',
      name: '美妆护肤监控',
      keywords: ['护肤品', '化妆品', '美妆博主'],
      platforms: ['xiaohongshu', 'douyin'] as ('xiaohongshu' | 'douyin')[],
      regions: ['shanghai', 'beijing', 'guangdong'],
      deviceIds: ['mock_device_1', 'mock_device_2'],
      targetCount: 500,
      currentCount: 234,
      status: 'running' as 'running' | 'paused' | 'stopped',
      createTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      lastActive: new Date(Date.now() - 5 * 60 * 1000),
      successRate: 89.5
    },
    {
      id: '2',
      name: '时尚穿搭监控',
      keywords: ['穿搭', '时尚', '搭配'],
      platforms: ['xiaohongshu'] as ('xiaohongshu' | 'douyin')[],
      regions: ['shanghai', 'beijing'],
      deviceIds: ['mock_device_1'],
      targetCount: 300,
      currentCount: 156,
      status: 'running' as 'running' | 'paused' | 'stopped',
      createTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      lastActive: new Date(Date.now() - 10 * 60 * 1000),
      successRate: 92.3
    }
  ],
  userComments: [
    {
      id: '1',
      content: '这个护肤品效果真的很好，用了一个月皮肤明显改善了',
      author: '小美爱护肤',
      authorId: 'user123',
      platform: 'xiaohongshu' as 'xiaohongshu' | 'douyin',
      videoTitle: '平价护肤品推荐',
      videoUrl: 'https://xiaohongshu.com/video/123',
      region: 'shanghai',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      isProcessed: false,
      taskId: '1'
    },
    {
      id: '2',
      content: '这个穿搭太好看了，想问一下上衣是哪里买的',
      author: '时尚小仙女',
      authorId: 'user456',
      platform: 'xiaohongshu' as 'xiaohongshu' | 'douyin',
      videoTitle: '秋冬穿搭分享',
      videoUrl: 'https://xiaohongshu.com/video/456',
      region: 'beijing',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      isProcessed: false,
      taskId: '2'
    },
    {
      id: '3',
      content: '求链接，这个化妆品在哪买？',
      author: '化妆新手',
      authorId: 'user789',
      platform: 'douyin' as 'xiaohongshu' | 'douyin',
      videoTitle: '新手化妆教程',
      videoUrl: 'https://douyin.com/video/789',
      region: 'guangdong',
      timestamp: new Date(Date.now() - 90 * 60 * 1000),
      isProcessed: true,
      taskId: '1'
    }
  ],
  industryKeywords: [
    { keyword: '护肤品', count: 156, trend: '+12%' },
    { keyword: '化妆品', count: 89, trend: '+8%' },
    { keyword: '美妆', count: 234, trend: '+15%' },
    { keyword: '口红', count: 67, trend: '+5%' },
    { keyword: '穿搭', count: 123, trend: '+18%' },
    { keyword: '时尚', count: 98, trend: '+7%' },
  ],
  taskItems: [
    {
      id: '1',
      type: 'follow',
      target: '美妆博主_001',
      status: 'completed',
      createdAt: new Date().toISOString(),
      platform: '小红书'
    },
    {
      id: '2',
      type: 'reply', 
      target: '用户评论_002',
      status: 'pending',
      createdAt: new Date().toISOString(),
      platform: '抖音'
    },
    {
      id: '3',
      type: 'follow',
      target: '护肤达人_003',
      status: 'running',
      createdAt: new Date().toISOString(),
      platform: '小红书'
    }
  ],
  analytics: {
    totalFollows: 156,
    totalReplies: 89,
    successRate: 92.5,
    dailyGrowth: '+15%',
    weeklyStats: [
      { date: '2025-09-24', follows: 12, replies: 8 },
      { date: '2025-09-25', follows: 15, replies: 12 },
      { date: '2025-09-26', follows: 18, replies: 10 },
      { date: '2025-09-27', follows: 20, replies: 15 },
      { date: '2025-09-28', follows: 16, replies: 9 },
      { date: '2025-09-29', follows: 22, replies: 18 },
      { date: '2025-09-30', follows: 25, replies: 20 }
    ]
  }
});