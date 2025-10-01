/**
 * Feedback 反馈组件适配器 - Employee D 架构
 * 
 * 目的：为页面层提供反馈组件，避免直连AntD Alert/Spin
 * 原则：适配器统一、品牌化一致、零覆盖
 */

import React from 'react';
import { Alert, Spin } from 'antd';

/**
 * AlertCard 警告卡片适配器
 * 封装 AntD Alert 组件，提供统一的反馈接口
 */
export const AlertCard = Alert;

/**
 * LoadingSpinner 加载器适配器
 * 封装 AntD Spin 组件，提供统一的加载接口
 */
export const LoadingSpinner = Spin;

/**
 * Feedback 适配器组合导出
 */
export const FeedbackAdapter = {
  AlertCard,
  LoadingSpinner
};

export default FeedbackAdapter;