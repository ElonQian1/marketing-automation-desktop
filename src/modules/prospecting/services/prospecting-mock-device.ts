// src/modules/prospecting/services/prospecting-mock-device.ts
// module: prospecting | layer: services | role: 模拟设备操作服务
// summary: 模拟ADB设备操作，用于测试回复计划执行流程

import type { 
  ProspectingReplyPlan, 
  ProspectingReplyStep,
  ProspectingSocialPlatform 
} from '../domain';

/**
 * 模拟UI元素
 */
interface ProspectingMockUIElement {
  id: string;
  type: 'text' | 'button' | 'input' | 'list_item';
  text?: string;
  resourceId?: string;
  className?: string;
  bounds?: string;
}

/**
 * 模拟页面状态
 */
interface ProspectingMockPageState {
  platform: ProspectingSocialPlatform;
  page: 'home' | 'video_detail' | 'comments' | 'reply_input';
  elements: ProspectingMockUIElement[];
  currentVideoId?: string;
}

/**
 * 模拟设备操作器
 */
export class ProspectingMockDeviceService {
  private currentState: ProspectingMockPageState;

  constructor() {
    this.currentState = this.createInitialState();
  }

  /**
   * 模拟执行回复计划
   */
  async executeReplyPlan(plan: ProspectingReplyPlan): Promise<{
    success: boolean;
    completedSteps: number;
    error?: string;
  }> {
    let completedSteps = 0;
    
    try {
      for (const step of plan.steps) {
        await this.executeStep(step, plan);
        completedSteps++;
        
        // 模拟执行延迟
        await this.delay(500 + Math.random() * 1000);
      }
      
      return { success: true, completedSteps };
    } catch (error) {
      return {
        success: false,
        completedSteps,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 执行单个步骤
   */
  private async executeStep(step: ProspectingReplyStep, plan: ProspectingReplyPlan): Promise<void> {
    switch (step.type) {
      case 'open_app':
        await this.mockOpenApp(plan.platform);
        break;
      
      case 'navigate_to_video':
        await this.mockNavigateToVideo(plan.videoUrl);
        break;
      
      case 'find_comment':
        await this.mockFindComment(plan.targetAuthor, plan.targetComment);
        break;
      
      case 'input_reply':
        await this.mockInputReply(plan.replyContent);
        break;
      
      case 'send_reply':
        await this.mockSendReply();
        break;
      
      default:
        throw new Error(`不支持的步骤类型: ${step.type}`);
    }
  }

  /**
   * 模拟打开应用
   */
  private async mockOpenApp(platform: ProspectingSocialPlatform): Promise<void> {
    console.log(`[Mock] 正在打开 ${platform} 应用...`);
    
    this.currentState = {
      platform,
      page: 'home',
      elements: this.getHomePageElements(platform)
    };
    
    // 模拟可能的启动失败
    if (Math.random() < 0.05) {
      throw new Error('应用启动失败');
    }
  }

  /**
   * 模拟导航到视频
   */
  private async mockNavigateToVideo(videoUrl: string): Promise<void> {
    console.log(`[Mock] 正在导航到视频: ${videoUrl}`);
    
    // 从URL提取视频ID（模拟）
    const videoId = this.extractVideoId(videoUrl);
    
    this.currentState = {
      ...this.currentState,
      page: 'video_detail',
      currentVideoId: videoId,
      elements: this.getVideoDetailElements(videoId)
    };
    
    // 模拟网络延迟或视频不存在的情况
    if (Math.random() < 0.1) {
      throw new Error('视频不存在或网络错误');
    }
  }

  /**
   * 模拟查找评论
   */
  private async mockFindComment(author: string, content: string): Promise<void> {
    console.log(`[Mock] 正在查找评论: ${author} - ${content.substring(0, 20)}...`);
    
    // 切换到评论页面
    this.currentState = {
      ...this.currentState,
      page: 'comments',
      elements: this.getCommentsPageElements()
    };
    
    // 模拟评论查找
    const commentFound = this.currentState.elements.some(el => 
      el.type === 'text' && el.text?.includes(content.substring(0, 10))
    );
    
    if (!commentFound) {
      throw new Error('未找到目标评论');
    }
  }

  /**
   * 模拟输入回复
   */
  private async mockInputReply(replyContent: string): Promise<void> {
    console.log(`[Mock] 正在输入回复: ${replyContent.substring(0, 20)}...`);
    
    const inputElement = this.currentState.elements.find(el => 
      el.type === 'input' && el.resourceId?.includes('reply')
    );
    
    if (!inputElement) {
      throw new Error('未找到回复输入框');
    }
    
    // 模拟输入
    inputElement.text = replyContent;
  }

  /**
   * 模拟发送回复
   */
  private async mockSendReply(): Promise<void> {
    console.log('[Mock] 正在发送回复...');
    
    const sendButton = this.currentState.elements.find(el => 
      el.type === 'button' && (el.text === '发送' || el.resourceId?.includes('send'))
    );
    
    if (!sendButton) {
      throw new Error('未找到发送按钮');
    }
    
    // 模拟发送可能失败
    if (Math.random() < 0.05) {
      throw new Error('网络错误，发送失败');
    }
  }

  /**
   * 生成当前页面的模拟XML dump
   */
  generateMockXMLDump(): string {
    const elements = this.currentState.elements.map(el => {
      return `    <node index="${Math.floor(Math.random() * 100)}" 
              text="${el.text || ''}" 
              resource-id="${el.resourceId || ''}" 
              class="${el.className || 'android.widget.TextView'}"
              bounds="${el.bounds || '[0,0][100,50]'}"/>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<hierarchy rotation="0">
  <node index="0" text="" resource-id="android:id/content" class="android.widget.FrameLayout" bounds="[0,0][1080,1920]">
${elements}
  </node>
</hierarchy>`;
  }

  /**
   * 获取当前页面状态
   */
  getCurrentPageState(): ProspectingMockPageState {
    return { ...this.currentState };
  }

  /**
   * 辅助方法
   */
  private createInitialState(): ProspectingMockPageState {
    return {
      platform: 'douyin',
      page: 'home',
      elements: []
    };
  }

  private getHomePageElements(platform: ProspectingSocialPlatform): ProspectingMockUIElement[] {
    const baseElements = [
      { id: 'search', type: 'input' as const, text: '搜索', resourceId: 'com.ss.android.ugc.aweme:id/search' },
      { id: 'discover', type: 'text' as const, text: '发现', resourceId: 'com.ss.android.ugc.aweme:id/discover' },
      { id: 'me', type: 'text' as const, text: '我', resourceId: 'com.ss.android.ugc.aweme:id/me' }
    ];

    if (platform === 'xhs') {
      return baseElements.map(el => ({
        ...el,
        resourceId: el.resourceId?.replace('com.ss.android.ugc.aweme', 'com.xingin.xhs')
      }));
    }

    return baseElements;
  }

  private getVideoDetailElements(videoId: string): ProspectingMockUIElement[] {
    return [
      { id: 'video_player', type: 'button' as const, text: '', resourceId: 'com.ss.android.ugc.aweme:id/video_player' },
      { id: 'comment_btn', type: 'button' as const, text: '评论', resourceId: 'com.ss.android.ugc.aweme:id/comment' },
      { id: 'like_btn', type: 'button' as const, text: '点赞', resourceId: 'com.ss.android.ugc.aweme:id/like' }
    ];
  }

  private getCommentsPageElements(): ProspectingMockUIElement[] {
    return [
      { id: 'comment_1', type: 'text' as const, text: '多少钱一套？支持到广州吗', resourceId: 'com.ss.android.ugc.aweme:id/comment_text' },
      { id: 'comment_2', type: 'text' as const, text: '地址在哪？线下能看样吗', resourceId: 'com.ss.android.ugc.aweme:id/comment_text' },
      { id: 'reply_input', type: 'input' as const, text: '写评论...', resourceId: 'com.ss.android.ugc.aweme:id/reply_input' },
      { id: 'send_btn', type: 'button' as const, text: '发送', resourceId: 'com.ss.android.ugc.aweme:id/send' }
    ];
  }

  private extractVideoId(url: string): string {
    // 简单的视频ID提取逻辑
    const match = url.match(/\/(\w+)$/);
    return match ? match[1] : 'unknown_video';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}