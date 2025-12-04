// src/config/preset-apps.ts
// module: config | layer: config | role: preset-apps
// summary: 预设常用应用列表配置，包含社交、短视频等常用应用

import type { AppInfo } from '../types/smartComponents';

export const PRESET_APPS: AppInfo[] = [
  // === 社交通讯 ===
  {
    package_name: 'com.tencent.mm',
    app_name: '微信',
    is_system_app: false,
    is_enabled: true,
    category: 'social'
  },
  {
    package_name: 'com.tencent.mobileqq',
    app_name: 'QQ',
    is_system_app: false,
    is_enabled: true,
    category: 'social'
  },
  {
    package_name: 'com.sina.weibo',
    app_name: '微博',
    is_system_app: false,
    is_enabled: true,
    category: 'social'
  },
  {
    package_name: 'com.xingin.xhs',
    app_name: '小红书',
    is_system_app: false,
    is_enabled: true,
    category: 'social'
  },

  // === 视频娱乐 ===
  {
    package_name: 'com.ss.android.ugc.aweme',
    app_name: '抖音',
    is_system_app: false,
    is_enabled: true,
    category: 'video'
  },
  {
    package_name: 'com.kuaishou.nebula',
    app_name: '快手极速版',
    is_system_app: false,
    is_enabled: true,
    category: 'video'
  },
  {
    package_name: 'com.smile.gifmaker',
    app_name: '快手',
    is_system_app: false,
    is_enabled: true,
    category: 'video'
  },
  {
    package_name: 'tv.danmaku.bili',
    app_name: '哔哩哔哩',
    is_system_app: false,
    is_enabled: true,
    category: 'video'
  },

  // === 电商购物 ===
  {
    package_name: 'com.taobao.taobao',
    app_name: '淘宝',
    is_system_app: false,
    is_enabled: true,
    category: 'shopping'
  },
  {
    package_name: 'com.jingdong.app.mall',
    app_name: '京东',
    is_system_app: false,
    is_enabled: true,
    category: 'shopping'
  },
  {
    package_name: 'com.xunmeng.pinduoduo',
    app_name: '拼多多',
    is_system_app: false,
    is_enabled: true,
    category: 'shopping'
  },

  // === 生活工具 ===
  {
    package_name: 'com.eg.android.AlipayGphone',
    app_name: '支付宝',
    is_system_app: false,
    is_enabled: true,
    category: 'tool'
  },
  {
    package_name: 'com.autonavi.minimap',
    app_name: '高德地图',
    is_system_app: false,
    is_enabled: true,
    category: 'tool'
  },
  {
    package_name: 'com.sankuai.meituan',
    app_name: '美团',
    is_system_app: false,
    is_enabled: true,
    category: 'life'
  }
];
