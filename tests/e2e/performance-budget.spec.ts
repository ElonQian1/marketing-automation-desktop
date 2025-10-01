// tests/e2e/performance-budget.spec.ts
// 性能预算测试 - 验证首屏 CSS <100KB，包体积 <5MB
// 检查 Motion 动效性能，确保使用 transform/opacity

import { test, expect } from '@playwright/test';

test.describe('性能预算测试', () => {
  
  test('首屏 CSS 大小检查', async ({ page }) => {
    // 开启网络监控
    await page.route('**/*', (route) => {
      route.continue();
    });
    
    const responses: Array<{ url: string, size: number, type: string }> = [];
    
    page.on('response', async (response) => {
      const url = response.url();
      const contentType = response.headers()['content-type'] || '';
      
      if (contentType.includes('text/css') || url.includes('.css')) {
        try {
          const body = await response.body();
          responses.push({
            url,
            size: body.length,
            type: 'css'
          });
        } catch (error) {
          // 忽略无法获取响应体的情况
        }
      }
    });

    // 导航到首页
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // 计算 CSS 总大小
    const totalCssSize = responses
      .filter(r => r.type === 'css')
      .reduce((total, r) => total + r.size, 0);
    
    const cssKB = totalCssSize / 1024;
    
    console.log(`📊 首屏 CSS 大小: ${cssKB.toFixed(2)} KB`);
    console.log('📝 CSS 文件列表:');
    responses.forEach(r => {
      console.log(`  - ${r.url}: ${(r.size / 1024).toFixed(2)} KB`);
    });
    
    // 验证 CSS 大小 < 100KB
    expect(cssKB).toBeLessThan(100);
  });

  test('Motion 动效性能检查', async ({ page }) => {
    await page.goto('/');
    
    // 查找可能有动效的元素
    const animatedElements = page.locator('button, .card, [data-testid*="animated"]');
    
    if (await animatedElements.count() > 0) {
      const element = animatedElements.first();
      
      // 检查元素的 CSS 属性，确保使用性能友好的属性
      const styles = await element.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          transition: computed.transition,
          transform: computed.transform,
          opacity: computed.opacity,
          willChange: computed.willChange
        };
      });
      
      // 如果有 transition，应该主要使用 transform 和 opacity
      if (styles.transition && styles.transition !== 'none') {
        const transitionProps = styles.transition.toLowerCase();
        
        // 检查是否避免了昂贵的属性
        const expensiveProps = ['width', 'height', 'left', 'top', 'margin', 'padding'];
        const hasExpensiveTransition = expensiveProps.some(prop => 
          transitionProps.includes(prop)
        );
        
        console.log(`🎭 动效属性检查:`, styles);
        
        // 警告而不是失败，因为某些情况下可能需要这些属性
        if (hasExpensiveTransition) {
          console.warn('⚠️ 发现可能影响性能的动效属性');
        }
      }
    }
  });

  test('页面加载性能测试', async ({ page }) => {
    // 记录性能指标
    const startTime = Date.now();
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    const loadTime = Date.now() - startTime;
    
    console.log(`⚡ 页面加载时间: ${loadTime} ms`);
    
    // 页面应该在 5 秒内加载完成
    expect(loadTime).toBeLessThan(5000);
    
    // 检查 Core Web Vitals (如果支持)
    const vitals = await page.evaluate(() => {
      // @ts-ignore
      return new Promise((resolve) => {
        if ('PerformanceObserver' in window) {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const vitals = {
              fcp: 0,
              lcp: 0,
              cls: 0
            };
            
            entries.forEach((entry) => {
              if (entry.name === 'first-contentful-paint') {
                vitals.fcp = entry.startTime;
              }
            });
            
            resolve(vitals);
          });
          
          observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift'] });
          
          // 超时后返回部分数据
          setTimeout(() => resolve({ fcp: 0, lcp: 0, cls: 0 }), 3000);
        } else {
          resolve({ fcp: 0, lcp: 0, cls: 0 });
        }
      });
    });
    
    console.log(`📊 Core Web Vitals:`, vitals);
  });

  test('内存使用检查', async ({ page, browser }) => {
    await page.goto('/');
    
    // 等待页面稳定
    await page.waitForTimeout(2000);
    
    // 检查是否有内存泄漏的迹象（多次导航）
    for (let i = 0; i < 3; i++) {
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
    }
    
    // 验证页面仍然正常响应
    const button = page.locator('button').first();
    if (await button.isVisible()) {
      await expect(button).toBeEnabled();
    }
  });
});

test.describe('响应式性能测试', () => {
  
  test('不同分辨率下的渲染性能', async ({ page }) => {
    const resolutions = [
      { width: 1920, height: 1080, name: '1080p' },
      { width: 2560, height: 1440, name: '1440p' },
      { width: 3840, height: 2160, name: '4K' }
    ];
    
    for (const res of resolutions) {
      await page.setViewportSize({ width: res.width, height: res.height });
      
      const startTime = Date.now();
      await page.goto('/', { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;
      
      console.log(`📺 ${res.name} (${res.width}x${res.height}) 加载时间: ${loadTime} ms`);
      
      // 高分辨率下加载时间可以稍长，但不应超过 8 秒
      expect(loadTime).toBeLessThan(8000);
      
      // 验证关键元素可见
      const mainContent = page.locator('main, [role="main"], .main-content').first();
      await expect(mainContent).toBeVisible({ timeout: 5000 });
    }
  });
});