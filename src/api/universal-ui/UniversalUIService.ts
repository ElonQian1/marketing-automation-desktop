// src/api/universal-ui/UniversalUIService.ts
// module: api | layer: api | role: universal-ui-service
// summary: Universal UI服务层，处理UI操作和元素匹配的业务逻辑

/**
 * Universal UI 服务类
 * 提供智能导航和元素操作功能
 */

import { invoke } from '@tauri-apps/api/core';
import type {
  SmartNavigationParams,
  UniversalClickResult,
  NavigationPresets
} from './types';

/**
 * Universal UI智能导航服务类
 * 提供智能导航和元素查找功能
 */
export class UniversalUIService {

  /**
   * 执行智能导航点击（统一入口）
   * 支持双模式：指定应用模式 vs 直接ADB模式
   */
  static async executeUIClick(
    deviceId: string,
    params: SmartNavigationParams
  ): Promise<UniversalClickResult> {
    try {
      return await invoke<UniversalClickResult>('execute_universal_ui_click', {
        deviceId: deviceId,
        params,
      });
    } catch (error) {
      console.error('Failed to execute UI click:', error);
      throw new Error(`智能导航执行失败: ${error}`);
    }
  }

  /**
   * 快速点击（简化接口）
   * 自动使用指定应用模式
   */
  static async quickClick(
    deviceId: string,
    appName: string,
    buttonText: string
  ): Promise<UniversalClickResult> {
    try {
      const params: SmartNavigationParams = {
        navigation_type: 'bottom',
        target_button: buttonText,
        click_action: 'single_tap',
        app_name: appName,
      };
      return await this.executeUIClick(deviceId, params);
    } catch (error) {
      console.error('Failed to execute quick click:', error);
      throw new Error(`快速点击执行失败: ${error}`);
    }
  }

  /**
   * 直接ADB点击（跳过应用检测）
   * 用于快速测试当前界面
   */
  static async directClick(
    deviceId: string,
    buttonText: string
  ): Promise<UniversalClickResult> {
    try {
      const params: SmartNavigationParams = {
        navigation_type: 'bottom',
        target_button: buttonText,
        click_action: 'single_tap',
        // 不指定 app_name，表示直接ADB模式
      };
      return await this.executeUIClick(deviceId, params);
    } catch (error) {
      console.error('Failed to execute direct click:', error);
      throw new Error(`直接点击执行失败: ${error}`);
    }
  }

  /**
   * 获取预设配置信息
   * 包含应用列表和导航类型定义
   */
  static async getNavigationPresets(): Promise<NavigationPresets> {
    try {
      // 暂时返回默认配置，后续可以通过后端命令获取
      return {
        apps: ['小红书', '微信', '抖音', '淘宝'],
        navigation_types: ['bottom', 'top', 'left', 'right'],
        common_buttons: ['我', '首页', '发现', '消息', '购物车', '个人中心']
      };
    } catch (error) {
      console.error('Failed to get navigation presets:', error);
      throw new Error(`获取导航预设失败: ${error}`);
    }
  }

  /**
   * 格式化执行结果信息
   */
  static formatResult(result: UniversalClickResult): {
    statusText: string;
    detailText: string;
    success: boolean;
  } {
    const { success, element_found, click_executed, execution_time_ms, mode, error_message } = result;

    let statusText = '';
    let detailText = '';

    if (success) {
      statusText = '✅ 执行成功';
      detailText = `模式: ${mode}, 执行时间: ${execution_time_ms}ms`;
    } else if (!element_found) {
      statusText = '❌ 未找到元素';
      detailText = error_message || '目标按钮未在指定区域找到';
    } else if (!click_executed) {
      statusText = '⚠️ 点击失败';
      detailText = error_message || '找到元素但点击操作失败';
    } else {
      statusText = '❌ 执行失败';
      detailText = error_message || '未知错误';
    }

    return { statusText, detailText, success };
  }
}