// playwright.config.ts
// Tauri + React 应用的 E2E 测试配置
// 支持 Dark/Compact 模式切换回归测试和不同 DPI 缩放测试

import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 配置 for Tauri 应用
 * 
 * 测试覆盖：
 * - 品牌化页面渲染测试
 * - Dark/Compact 模式切换
 * - 不同 DPI/缩放级别兼容性
 * - 核心用户流程 E2E 测试
 * - A11y 键盘导航测试
 */
export default defineConfig({
  // 测试目录
  testDir: './tests/e2e',
  
  // 全局配置
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  // 全局设置
  use: {
    // 基础设置
    baseURL: 'http://localhost:1420', // Tauri 开发服务器地址
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // 品牌化测试设置
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
  },

  // 测试项目配置
  projects: [
    // 桌面 Chrome - 标准分辨率
    {
      name: 'desktop-chrome',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    },

    // 桌面 Chrome - 高分辨率 (2K)
    {
      name: 'desktop-chrome-2k',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },

    // 桌面 Chrome - 4K 分辨率
    {
      name: 'desktop-chrome-4k',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 2560, height: 1440 }
      },
    },

    // 桌面 Firefox
    {
      name: 'desktop-firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 }
      },
    },

    // 高 DPI 测试 (模拟 Retina 显示器)
    {
      name: 'high-dpi',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 2,
      },
    },
  ],

  // Tauri 应用启动配置
  webServer: {
    command: 'npm run tauri dev',
    port: 1420,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 分钟启动时间
  },

  // 测试超时设置
  timeout: 30 * 1000,
  expect: {
    timeout: 5 * 1000,
  },
});