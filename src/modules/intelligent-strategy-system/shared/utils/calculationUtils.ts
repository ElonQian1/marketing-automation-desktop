/**
 * 统一的计算和数学工具
 * 
 * @description 替换项目中重复的计算函数
 */

import type { BoundsRect, Position, Size } from '../types/geometry';
import type { ResolutionProfile, DeviceProfile } from '../types/device';
import { DEFAULT_WEIGHTS } from '../types/constants';

/**
 * 统一的计算工具类
 */
export class UnifiedCalculationUtils {
  /**
   * 计算两点之间的欧几里得距离
   * 
   * @param point1 第一个点
   * @param point2 第二个点
   * @returns 距离值
   */
  static calculateDistance(point1: Position, point2: Position): number {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 计算矩形中心点
   * 
   * @param bounds 矩形边界
   * @returns 中心点坐标
   */
  static calculateCenter(bounds: BoundsRect): Position {
    return {
      x: bounds.left + (bounds.right - bounds.left) / 2,
      y: bounds.top + (bounds.bottom - bounds.top) / 2,
    };
  }

  /**
   * 计算矩形面积
   * 
   * @param bounds 矩形边界
   * @returns 面积值
   */
  static calculateArea(bounds: BoundsRect): number {
    const width = Math.max(0, bounds.right - bounds.left);
    const height = Math.max(0, bounds.bottom - bounds.top);
    return width * height;
  }

  /**
   * 计算两个矩形的重叠面积
   * 
   * @param bounds1 第一个矩形
   * @param bounds2 第二个矩形
   * @returns 重叠面积
   */
  static calculateOverlapArea(bounds1: BoundsRect, bounds2: BoundsRect): number {
    const left = Math.max(bounds1.left, bounds2.left);
    const top = Math.max(bounds1.top, bounds2.top);
    const right = Math.min(bounds1.right, bounds2.right);
    const bottom = Math.min(bounds1.bottom, bounds2.bottom);

    if (left >= right || top >= bottom) {
      return 0; // 无重叠
    }

    return (right - left) * (bottom - top);
  }

  /**
   * 计算重叠比例（Intersection over Union）
   * 
   * @param bounds1 第一个矩形
   * @param bounds2 第二个矩形
   * @returns IoU值（0-1）
   */
  static calculateIoU(bounds1: BoundsRect, bounds2: BoundsRect): number {
    const overlapArea = this.calculateOverlapArea(bounds1, bounds2);
    if (overlapArea === 0) return 0;

    const area1 = this.calculateArea(bounds1);
    const area2 = this.calculateArea(bounds2);
    const unionArea = area1 + area2 - overlapArea;

    return unionArea > 0 ? overlapArea / unionArea : 0;
  }

  /**
   * 计算相对位置向量
   * 
   * @param from 起始矩形
   * @param to 目标矩形
   * @returns 位置向量
   */
  static calculateRelativeVector(from: BoundsRect, to: BoundsRect): Position {
    const fromCenter = this.calculateCenter(from);
    const toCenter = this.calculateCenter(to);

    return {
      x: toCenter.x - fromCenter.x,
      y: toCenter.y - fromCenter.y,
    };
  }

  /**
   * 计算角度（弧度制）
   * 
   * @param from 起始点
   * @param to 目标点
   * @returns 角度（弧度）
   */
  static calculateAngle(from: Position, to: Position): number {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    return Math.atan2(dy, dx);
  }

  /**
   * 将弧度转换为度数
   * 
   * @param radians 弧度值
   * @returns 度数值
   */
  static radiansToDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }

  /**
   * 计算权重分数
   * 
   * @param scores 各项分数
   * @param weights 权重配置（可选）
   * @returns 加权总分
   */
  static calculateWeightedScore(
    scores: Record<string, number>,
    weights: Record<string, number> = {}
  ): number {
    let totalScore = 0;
    let totalWeight = 0;

    for (const [key, score] of Object.entries(scores)) {
      const weight = weights[key] || 0;
      totalScore += score * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * 标准化分数到0-1范围
   * 
   * @param value 待标准化的值
   * @param min 最小值
   * @param max 最大值
   * @returns 标准化后的值（0-1）
   */
  static normalize(value: number, min: number, max: number): number {
    if (max <= min) return 0;
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }

  /**
   * 计算分辨率适配比例
   * 
   * @param originalResolution 原始分辨率
   * @param targetResolution 目标分辨率
   * @returns 适配比例 { x: number, y: number }
   */
  static calculateResolutionScale(
    originalResolution: Size,
    targetResolution: Size
  ): Position {
    return {
      x: targetResolution.width / originalResolution.width,
      y: targetResolution.height / originalResolution.height,
    };
  }

  /**
   * 缩放矩形边界
   * 
   * @param bounds 原始边界
   * @param scale 缩放比例
   * @returns 缩放后的边界
   */
  static scaleBounds(bounds: BoundsRect, scale: Position): BoundsRect {
    return {
      left: Math.round(bounds.left * scale.x),
      top: Math.round(bounds.top * scale.y),
      right: Math.round(bounds.right * scale.x),
      bottom: Math.round(bounds.bottom * scale.y),
    };
  }

  /**
   * 计算设备像素密度比例
   * 
   * @param device1 第一个设备配置
   * @param device2 第二个设备配置
   * @returns 密度比例
   */
  static calculateDensityRatio(device1: DeviceProfile, device2: DeviceProfile): number {
    // 从分辨率字符串解析密度，如 "1080x1920@320dpi"
    const extractDensity = (resolution: string): number => {
      const match = resolution.match(/@(\d+)dpi/);
      return match ? parseInt(match[1], 10) : 320;
    };

    const density1 = extractDensity(device1.resolution);
    const density2 = extractDensity(device2.resolution);
    return density2 / density1;
  }

  /**
   * 计算相似度分数（0-1）
   * 
   * @param value1 第一个值
   * @param value2 第二个值
   * @param maxDifference 最大差异值
   * @returns 相似度分数
   */
  static calculateSimilarity(value1: number, value2: number, maxDifference: number): number {
    if (maxDifference <= 0) return value1 === value2 ? 1 : 0;
    
    const difference = Math.abs(value1 - value2);
    return Math.max(0, 1 - difference / maxDifference);
  }

  /**
   * 计算稳定性分数
   * 
   * @param values 历史值数组
   * @returns 稳定性分数（0-1，越高越稳定）
   */
  static calculateStabilityScore(values: number[]): number {
    if (values.length < 2) return 1;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);

    // 标准差越小，稳定性越高
    const maxStdDev = Math.max(1, mean); // 避免除以0
    return Math.max(0, 1 - standardDeviation / maxStdDev);
  }

  /**
   * 计算置信度分数
   * 
   * @param successCount 成功次数
   * @param totalCount 总次数
   * @param minSamples 最小样本数（用于置信度调整）
   * @returns 置信度分数（0-1）
   */
  static calculateConfidenceScore(
    successCount: number,
    totalCount: number,
    minSamples: number = 5
  ): number {
    if (totalCount <= 0) return 0;

    const successRate = successCount / totalCount;
    
    // 样本数不足时降低置信度
    const sampleFactor = Math.min(1, totalCount / minSamples);
    
    return successRate * sampleFactor;
  }

  /**
   * 线性插值
   * 
   * @param start 起始值
   * @param end 结束值
   * @param t 插值参数（0-1）
   * @returns 插值结果
   */
  static lerp(start: number, end: number, t: number): number {
    return start + (end - start) * Math.max(0, Math.min(1, t));
  }

  /**
   * 限制值在指定范围内
   * 
   * @param value 待限制的值
   * @param min 最小值
   * @param max 最大值
   * @returns 限制后的值
   */
  static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * 计算加权平均值
   * 
   * @param values 值数组
   * @param weights 权重数组
   * @returns 加权平均值
   */
  static calculateWeightedAverage(values: number[], weights: number[]): number {
    if (values.length !== weights.length || values.length === 0) {
      return 0;
    }

    let weightedSum = 0;
    let totalWeight = 0;

    for (let i = 0; i < values.length; i++) {
      weightedSum += values[i] * weights[i];
      totalWeight += weights[i];
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }
}

// 兼容性导出
export const calculateDistance = UnifiedCalculationUtils.calculateDistance;
export const calculateCenter = UnifiedCalculationUtils.calculateCenter;
export const calculateArea = UnifiedCalculationUtils.calculateArea;
export const calculateWeightedScore = UnifiedCalculationUtils.calculateWeightedScore;