// src/components/adapters/notification/NotificationAdapter.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from "react";
import { notification } from "antd";

type NotificationInstance = typeof notification;
type ArgsProps = Parameters<NotificationInstance['open']>[0];

/**
 * 通知类型
 */
export type NotificationType = 'success' | 'info' | 'warning' | 'error';

/**
 * 通知位置
 */
export type NotificationPlacement = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

/**
 * 通知适配器配置
 */
export interface NotificationAdapterConfig extends ArgsProps {
  /** 通知类型 */
  type?: NotificationType;
  /** 自动关闭延时，默认 4.5s */
  duration?: number;
  /** 通知位置，默认 topRight */
  placement?: NotificationPlacement;
  /** 是否显示关闭按钮，默认 true */
  closable?: boolean;
  /** 主题模式，用于适配暗黑模式 */
  theme?: 'light' | 'dark';
}

/**
 * 通知配置默认值
 */
const DEFAULT_CONFIG: Required<Pick<NotificationAdapterConfig, 'duration' | 'placement' | 'closable'>> = {
  duration: 4.5,
  placement: 'topRight',
  closable: true,
};

/**
 * Notification 通知适配器类
 * 
 * 职责：
 * 1. 提供统一的通知消息接口
 * 2. 集成品牌化的默认配置
 * 3. 支持暗黑/紧凑模式适配
 * 4. 提供类型安全的API
 */
export class NotificationAdapter {
  /**
   * 应用默认配置到通知选项
   */
  private static applyDefaults(config: NotificationAdapterConfig): NotificationAdapterConfig {
    return {
      ...DEFAULT_CONFIG,
      ...config,
    };
  }

  /**
   * 显示成功通知
   */
  static success(config: Omit<NotificationAdapterConfig, 'type'>) {
    const finalConfig = this.applyDefaults(config);
    notification.success(finalConfig);
  }

  /**
   * 显示信息通知
   */
  static info(config: Omit<NotificationAdapterConfig, 'type'>) {
    const finalConfig = this.applyDefaults(config);
    notification.info(finalConfig);
  }

  /**
   * 显示警告通知
   */
  static warning(config: Omit<NotificationAdapterConfig, 'type'>) {
    const finalConfig = this.applyDefaults(config);
    notification.warning(finalConfig);
  }

  /**
   * 显示错误通知
   */
  static error(config: Omit<NotificationAdapterConfig, 'type'>) {
    const finalConfig = this.applyDefaults(config);
    notification.error(finalConfig);
  }

  /**
   * 通用通知方法
   */
  static open(config: NotificationAdapterConfig) {
    const finalConfig = this.applyDefaults(config);
    notification.open(finalConfig);
  }

  /**
   * 批量显示多个通知
   */
  static batch(notifications: NotificationAdapterConfig[]) {
    notifications.forEach((config, index) => {
      setTimeout(() => {
        this.open(config);
      }, index * 200); // 200ms间隔避免同时弹出
    });
  }

  /**
   * 显示加载中通知（返回用于关闭的key）
   */
  static loading(config: Omit<NotificationAdapterConfig, 'type' | 'duration'>) {
    const key = `loading-${Date.now()}`;
    notification.info({
      ...this.applyDefaults(config),
      key,
      duration: 0, // 不自动关闭
      icon: <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />,
    });
    return key;
  }

  /**
   * 关闭所有通知
   */
  static destroy() {
    notification.destroy();
  }

  /**
   * 关闭指定通知
   */
  static close(key: string) {
    notification.destroy(key);
  }

  /**
   * 配置全局设置
   */
  static config(options: Parameters<NotificationInstance['config']>[0]) {
    notification.config({
      // 默认品牌化配置
      placement: 'topRight',
      duration: 4.5,
      ...options,
    });
  }

  /**
   * 获取当前默认配置
   */
  static getDefaults() {
    return { ...DEFAULT_CONFIG };
  }

  /**
   * 快捷方法：显示操作成功通知
   */
  static operationSuccess(message: string, description?: string) {
    this.success({
      message: message || '操作成功',
      description,
    });
  }

  /**
   * 快捷方法：显示操作失败通知
   */
  static operationError(message: string, description?: string) {
    this.error({
      message: message || '操作失败',
      description,
      duration: 6, // 错误通知显示时间更长
    });
  }

  /**
   * 快捷方法：显示保存成功通知
   */
  static saveSuccess(itemName?: string) {
    this.success({
      message: '保存成功',
      description: itemName ? `${itemName} 已成功保存` : undefined,
    });
  }

  /**
   * 快捷方法：显示删除成功通知
   */
  static deleteSuccess(itemName?: string) {
    this.success({
      message: '删除成功',
      description: itemName ? `${itemName} 已成功删除` : undefined,
    });
  }
}

export default NotificationAdapter;