// src/services/optimized-image-cache.ts
// module: cache | layer: service | role: image-optimizer
// summary: 优化的图片缓存服务，支持预加载、压缩和内存管理

interface CacheStats {
  memoryHits: number;
  diskHits: number;
  misses: number;
  memoryUsage: number; // bytes
  compressionRatio: number;
}

interface ImageCacheEntry {
  id: string;
  originalPath: string;
  thumbnailBlob: Blob | null;
  originalBlob: Blob | null;
  lastAccessed: number;
  size: number;
  loadTime?: number;
}

/**
 * 优化的图片缓存管理器
 * 
 * 功能特性：
 * 1. LRU内存缓存，避免重复加载
 * 2. 自动生成缩略图，提升首屏加载
 * 3. 预加载机制，预判用户行为
 * 4. 压缩优化，减少内存占用
 * 5. 性能监控，实时优化策略
 */
class OptimizedImageCache {
  private static instance: OptimizedImageCache;
  
  private memoryCache = new Map<string, ImageCacheEntry>();
  private maxMemorySize = 100 * 1024 * 1024; // 100MB
  private currentMemoryUsage = 0;
  private stats: CacheStats = {
    memoryHits: 0,
    diskHits: 0,
    misses: 0,
    memoryUsage: 0,
    compressionRatio: 0.7 // 预估压缩比
  };
  
  // 预加载队列
  private preloadQueue: string[] = [];
  private isPreloading = false;
  private preloadWorker: Worker | null = null;

  private constructor() {
    this.initPreloadWorker();
    this.startMaintenanceLoop();
  }

  static getInstance(): OptimizedImageCache {
    if (!this.instance) {
      this.instance = new OptimizedImageCache();
    }
    return this.instance;
  }

  /**
   * 获取图片（优先使用缓存）
   */
  async getImage(imagePath: string, preferThumbnail = true): Promise<{
    blob: Blob;
    isFromCache: boolean;
    loadTime: number;
    source: 'memory' | 'disk' | 'network';
  }> {
    const startTime = performance.now();
    const cacheKey = this.getCacheKey(imagePath, preferThumbnail);
    
    // 1. 尝试内存缓存
    const memoryEntry = this.memoryCache.get(cacheKey);
    if (memoryEntry && memoryEntry.thumbnailBlob && preferThumbnail) {
      memoryEntry.lastAccessed = Date.now();
      this.stats.memoryHits++;
      
      const loadTime = performance.now() - startTime;
      console.log(`⚡ [ImageCache] 内存命中: ${imagePath} (${loadTime.toFixed(2)}ms)`);
      
      return {
        blob: memoryEntry.thumbnailBlob,
        isFromCache: true,
        loadTime,
        source: 'memory'
      };
    }

    if (memoryEntry && memoryEntry.originalBlob && !preferThumbnail) {
      memoryEntry.lastAccessed = Date.now();
      this.stats.memoryHits++;
      
      const loadTime = performance.now() - startTime;
      return {
        blob: memoryEntry.originalBlob,
        isFromCache: true,
        loadTime,
        source: 'memory'
      };
    }

    // 2. 从磁盘加载并处理
    try {
      console.log(`📡 [ImageCache] 从磁盘加载: ${imagePath}`);
      
      const { blob: originalBlob, loadTime: diskLoadTime } = await this.loadFromDisk(imagePath);
      let resultBlob = originalBlob;
      let source: 'disk' | 'network' = 'disk';

      // 生成缩略图（如果需要）
      if (preferThumbnail) {
        resultBlob = await this.generateThumbnail(originalBlob, 150);
        console.log(`🔧 [ImageCache] 生成缩略图: ${imagePath}`);
      }

      // 缓存到内存
      const cacheEntry: ImageCacheEntry = {
        id: cacheKey,
        originalPath: imagePath,
        thumbnailBlob: preferThumbnail ? resultBlob : null,
        originalBlob: !preferThumbnail ? resultBlob : originalBlob,
        lastAccessed: Date.now(),
        size: resultBlob.size,
        loadTime: diskLoadTime
      };

      await this.addToMemoryCache(cacheEntry);
      this.stats.diskHits++;

      const totalLoadTime = performance.now() - startTime;
      console.log(`✅ [ImageCache] 缓存完成: ${imagePath} (${totalLoadTime.toFixed(2)}ms, ${(resultBlob.size/1024).toFixed(1)}KB)`);

      return {
        blob: resultBlob,
        isFromCache: false,
        loadTime: totalLoadTime,
        source
      };

    } catch (error) {
      this.stats.misses++;
      console.error(`❌ [ImageCache] 加载失败: ${imagePath}`, error);
      throw error;
    }
  }

  /**
   * 预加载图片列表
   */
  async preloadImages(imagePaths: string[], priority: 'high' | 'medium' | 'low' = 'medium') {
    console.log(`🔄 [ImageCache] 预加载 ${imagePaths.length} 张图片 (优先级: ${priority})`);
    
    if (priority === 'high') {
      // 高优先级立即处理
      const preloadPromises = imagePaths.slice(0, 5).map(path => 
        this.getImage(path, true).catch(err => {
          console.warn(`⚠️ [ImageCache] 预加载失败: ${path}`, err);
        })
      );
      await Promise.allSettled(preloadPromises);
    } else {
      // 中低优先级加入队列
      this.preloadQueue.push(...imagePaths);
      this.processPreloadQueue();
    }
  }

  /**
   * 智能预测需要加载的图片
   */
  async predictivePreload(currentImagePath: string, allImagePaths: string[]) {
    const currentIndex = allImagePaths.indexOf(currentImagePath);
    if (currentIndex === -1) return;

    // 预加载前后3张图片
    const toPreload = [];
    for (let i = Math.max(0, currentIndex - 3); i <= Math.min(allImagePaths.length - 1, currentIndex + 3); i++) {
      if (i !== currentIndex) {
        toPreload.push(allImagePaths[i]);
      }
    }

    await this.preloadImages(toPreload, 'medium');
  }

  /**
   * 从磁盘加载图片
   */
  private async loadFromDisk(imagePath: string): Promise<{ blob: Blob; loadTime: number }> {
    const startTime = performance.now();
    
    try {
      // 使用Tauri API读取文件
      const response = await fetch(`http://localhost:1420/load-image?path=${encodeURIComponent(imagePath)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const loadTime = performance.now() - startTime;
      
      return { blob, loadTime };
      
    } catch (error) {
      // 尝试使用file://协议加载
      try {
        const fileUrl = `file://${imagePath.replace(/\\/g, '/')}`;
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const loadTime = performance.now() - startTime;
        
        return { blob, loadTime };
      } catch (fallbackError) {
        throw new Error(`无法加载图片: ${imagePath}. 原因: ${error}`);
      }
    }
  }

  /**
   * 生成缩略图
   */
  private async generateThumbnail(originalBlob: Blob, maxWidth: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('无法创建canvas上下文'));
        return;
      }

      img.onload = () => {
        // 计算缩略图尺寸
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        const newWidth = img.width * ratio;
        const newHeight = img.height * ratio;

        canvas.width = newWidth;
        canvas.height = newHeight;

        // 绘制缩放图片
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // 转换为Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('缩略图生成失败'));
            }
          },
          'image/webp', // 使用WebP格式压缩
          0.8 // 80%质量
        );
      };

      img.onerror = () => {
        reject(new Error('图片加载失败'));
      };

      img.src = URL.createObjectURL(originalBlob);
    });
  }

  /**
   * 添加到内存缓存
   */
  private async addToMemoryCache(entry: ImageCacheEntry) {
    // 检查是否需要清理内存
    if (this.currentMemoryUsage + entry.size > this.maxMemorySize) {
      await this.evictLRU(entry.size);
    }

    this.memoryCache.set(entry.id, entry);
    this.currentMemoryUsage += entry.size;
    this.stats.memoryUsage = this.currentMemoryUsage;
  }

  /**
   * LRU清理策略
   */
  private async evictLRU(neededSpace: number) {
    const entries = Array.from(this.memoryCache.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    let freedSpace = 0;
    for (const [key, entry] of entries) {
      this.memoryCache.delete(key);
      this.currentMemoryUsage -= entry.size;
      freedSpace += entry.size;

      console.log(`🗑️ [ImageCache] LRU清理: ${entry.originalPath} (${(entry.size/1024).toFixed(1)}KB)`);

      if (freedSpace >= neededSpace) {
        break;
      }
    }
  }

  /**
   * 处理预加载队列
   */
  private async processPreloadQueue() {
    if (this.isPreloading || this.preloadQueue.length === 0) {
      return;
    }

    this.isPreloading = true;
    
    try {
      // 每次处理2个图片，避免阻塞主线程
      const batch = this.preloadQueue.splice(0, 2);
      const preloadPromises = batch.map(path => 
        this.getImage(path, true).catch(err => {
          console.warn(`⚠️ [ImageCache] 预加载失败: ${path}`, err);
        })
      );

      await Promise.allSettled(preloadPromises);
      
      // 继续处理剩余队列
      setTimeout(() => {
        this.isPreloading = false;
        this.processPreloadQueue();
      }, 100); // 100ms间隔，避免过于频繁

    } catch (error) {
      console.error('预加载队列处理失败:', error);
      this.isPreloading = false;
    }
  }

  /**
   * 初始化预加载Worker
   */
  private initPreloadWorker() {
    try {
      // 创建内联Worker
      const workerCode = `
        self.onmessage = function(e) {
          const { type, imagePath, priority } = e.data;
          
          if (type === 'preload') {
            // 在Worker中预加载图片
            fetch(imagePath)
              .then(response => response.blob())
              .then(blob => {
                self.postMessage({
                  type: 'preload-complete',
                  imagePath,
                  success: true,
                  size: blob.size
                });
              })
              .catch(error => {
                self.postMessage({
                  type: 'preload-complete',
                  imagePath,
                  success: false,
                  error: error.message
                });
              });
          }
        };
      `;
      
      const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
      this.preloadWorker = new Worker(URL.createObjectURL(workerBlob));
      
      this.preloadWorker.onmessage = (e) => {
        const { type, imagePath, success, size, error } = e.data;
        if (type === 'preload-complete') {
          if (success) {
            console.log(`⚡ [Worker] 预加载完成: ${imagePath} (${(size/1024).toFixed(1)}KB)`);
          } else {
            console.warn(`❌ [Worker] 预加载失败: ${imagePath} - ${error}`);
          }
        }
      };
      
    } catch (error) {
      console.warn('Worker初始化失败，使用主线程预加载:', error);
      this.preloadWorker = null;
    }
  }

  /**
   * 定期维护循环
   */
  private startMaintenanceLoop() {
    setInterval(() => {
      this.performMaintenance();
    }, 30000); // 每30秒维护一次
  }

  /**
   * 执行缓存维护
   */
  private performMaintenance() {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10分钟过期

    let cleanedCount = 0;
    let freedMemory = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.lastAccessed > maxAge) {
        this.memoryCache.delete(key);
        this.currentMemoryUsage -= entry.size;
        freedMemory += entry.size;
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 [ImageCache] 维护完成: 清理 ${cleanedCount} 项, 释放 ${(freedMemory/1024).toFixed(1)}KB`);
    }

    this.stats.memoryUsage = this.currentMemoryUsage;
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * 清理所有缓存
   */
  clearCache() {
    this.memoryCache.clear();
    this.currentMemoryUsage = 0;
    this.preloadQueue.length = 0;
    this.stats = {
      memoryHits: 0,
      diskHits: 0,
      misses: 0,
      memoryUsage: 0,
      compressionRatio: 0.7
    };
    console.log('🗑️ [ImageCache] 所有缓存已清理');
  }

  /**
   * 获取缓存键
   */
  private getCacheKey(imagePath: string, isThumbnail: boolean): string {
    return `${imagePath}:${isThumbnail ? 'thumb' : 'original'}`;
  }

  /**
   * 销毁缓存服务
   */
  destroy() {
    this.clearCache();
    if (this.preloadWorker) {
      this.preloadWorker.terminate();
      this.preloadWorker = null;
    }
  }
}

// 导出单例
export const optimizedImageCache = OptimizedImageCache.getInstance();
export default OptimizedImageCache;