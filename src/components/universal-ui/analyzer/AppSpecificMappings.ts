/**
 * 应用特定的配置和映射
 * 包含各种应用的UI元素识别规则
 */

import { AppConfig, PatternConfig } from './types';

export class AppSpecificMappings {
  
  // 小红书应用配置
  static readonly XIAOHONGSHU_CONFIG: AppConfig = {
    packageName: 'com.xingin.xhs',
    bottomNavigation: {
      '首页': { icon: '🏠', function: 'navigate_to_home', description: '浏览推荐内容和关注动态' },
      '市集': { icon: '🛍️', function: 'navigate_to_shopping', description: '购买商品和浏览店铺' },
      '发布': { icon: '➕', function: 'create_content', description: '发布新的笔记或视频' },
      '消息': { icon: '💬', function: 'view_messages', description: '查看私信、评论和通知' },
      '我': { icon: '👤', function: 'view_profile', description: '个人中心和设置' }
    },
    topTabs: {
      '关注': { function: 'view_following', description: '查看关注用户的最新内容' },
      '发现': { function: 'discover_content', description: '发现推荐和热门内容' },
      '视频': { function: 'view_videos', description: '观看短视频内容' }
    },
    commonButtons: {
      '搜索': { function: 'search', description: '搜索用户、内容或商品' },
      '点赞': { function: 'like_content', description: '为内容点赞' },
      '收藏': { function: 'bookmark_content', description: '收藏内容到个人收藏夹' },
      '分享': { function: 'share_content', description: '分享内容到其他平台' },
      '关注': { function: 'follow_user', description: '关注用户获取更新' },
      '购买': { function: 'purchase_item', description: '购买商品' }
    }
  };
  
  // 微信应用配置
  static readonly WECHAT_CONFIG: AppConfig = {
    packageName: 'com.tencent.mm',
    bottomNavigation: {
      '微信': { icon: '💬', function: 'chat_list', description: '查看聊天列表和消息' },
      '通讯录': { icon: '📞', function: 'contacts', description: '管理联系人' },
      '发现': { icon: '🔍', function: 'discover', description: '朋友圈、小程序等功能' },
      '我': { icon: '👤', function: 'profile', description: '个人设置和钱包' }
    },
    commonButtons: {
      '发送': { function: 'send_message', description: '发送消息' },
      '语音': { function: 'voice_message', description: '录制语音消息' },
      '视频通话': { function: 'video_call', description: '发起视频通话' },
      '转账': { function: 'transfer_money', description: '转账给联系人' },
      '收付款': { function: 'payment', description: '扫码支付或收款' }
    }
  };
  
  // 淘宝应用配置
  static readonly TAOBAO_CONFIG: AppConfig = {
    packageName: 'com.taobao.taobao',
    bottomNavigation: {
      '首页': { icon: '🏠', function: 'home_browse', description: '浏览商品推荐' },
      '微淘': { icon: '📱', function: 'social_shopping', description: '关注店铺和达人' },
      '消息': { icon: '💬', function: 'messages', description: '查看订单和客服消息' },
      '购物车': { icon: '🛒', function: 'shopping_cart', description: '管理购物车商品' },
      '我的淘宝': { icon: '👤', function: 'user_center', description: '订单、收藏和设置' }
    },
    commonButtons: {
      '搜索': { function: 'search_products', description: '搜索商品' },
      '立即购买': { function: 'buy_now', description: '直接购买商品' },
      '加入购物车': { function: 'add_to_cart', description: '添加到购物车' },
      '收藏': { function: 'favorite_item', description: '收藏商品或店铺' },
      '联系卖家': { function: 'contact_seller', description: '咨询商品信息' }
    }
  };
  
  // 通用Android应用模式
  static readonly GENERIC_PATTERNS: Record<string, PatternConfig> = {
    navigation: {
      patterns: ['首页', '主页', 'Home', '发现', 'Discover', '我的', 'Profile', '设置', 'Settings'],
      bottomArea: { minY: 0.8 }, // 屏幕底部80%以下
      characteristics: { clickable: true, textLength: [1, 6] }
    },
    search: {
      patterns: ['搜索', 'Search', '查找', 'Find', '🔍'],
      contentDescPatterns: ['搜索', 'search'],
      characteristics: { clickable: true }
    },
    action: {
      patterns: ['确定', 'OK', '提交', 'Submit', '保存', 'Save', '发送', 'Send'],
      characteristics: { clickable: true, textLength: [1, 8] }
    },
    input: {
      patterns: ['输入', 'Input', '请输入', 'Enter', '搜索框'],
      characteristics: { clickable: true }
    }
  };

  /**
   * 根据包名获取应用配置
   */
  static getAppConfig(packageName: string): AppConfig | null {
    switch (packageName) {
      case 'com.xingin.xhs':
        return this.XIAOHONGSHU_CONFIG;
      case 'com.tencent.mm':
        return this.WECHAT_CONFIG;
      case 'com.taobao.taobao':
        return this.TAOBAO_CONFIG;
      default:
        return null;
    }
  }

  /**
   * 获取所有支持的应用配置
   */
  static getAllAppConfigs(): Record<string, AppConfig> {
    return {
      xiaohongshu: this.XIAOHONGSHU_CONFIG,
      wechat: this.WECHAT_CONFIG,
      taobao: this.TAOBAO_CONFIG
    };
  }
}