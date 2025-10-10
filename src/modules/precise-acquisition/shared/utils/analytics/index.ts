/**
 * 数据分析工具
 * 
 * 提供统计分析、成功率计算等功能
 */

import { Task } from '../../types/core';

/**
 * 计算成功率
 */
export function calculateSuccessRate(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  
  const successfulTasks = tasks.filter(task => 
    task.status === TaskStatus.DONE || task.status === TaskStatus.COMPLETED
  );
  
  return (successfulTasks.length / tasks.length) * 100;
}

/**
 * 按状态分组任务
 */
export function groupTasksByStatus(tasks: Task[]): Record<string, number> {
  return tasks.reduce((groups, task) => {
    const status = task.status || 'unknown';
    groups[status] = (groups[status] || 0) + 1;
    return groups;
  }, {} as Record<string, number>);
}

/**
 * 按日期分组数据
 */
export function groupByDate<T extends { created_at: Date }>(
  items: T[],
  dateFormat: 'day' | 'week' | 'month' = 'day'
): Record<string, T[]> {
  return items.reduce((groups, item) => {
    let key: string;
    const date = item.created_at;
    
    switch (dateFormat) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        key = date.toISOString().split('T')[0];
    }
    
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * 计算时间范围内的趋势
 */
export function calculateTrend<T extends { created_at: Date }>(
  items: T[],
  days: number = 7
): {
  current_period: number;
  previous_period: number;
  change_percentage: number;
  trend: 'up' | 'down' | 'stable';
} {
  const now = new Date();
  const currentPeriodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const previousPeriodStart = new Date(currentPeriodStart.getTime() - days * 24 * 60 * 60 * 1000);

  const currentPeriodItems = items.filter(item => 
    item.created_at >= currentPeriodStart && item.created_at <= now
  );
  
  const previousPeriodItems = items.filter(item => 
    item.created_at >= previousPeriodStart && item.created_at < currentPeriodStart
  );

  const currentCount = currentPeriodItems.length;
  const previousCount = previousPeriodItems.length;
  
  let changePercentage = 0;
  if (previousCount > 0) {
    changePercentage = ((currentCount - previousCount) / previousCount) * 100;
  } else if (currentCount > 0) {
    changePercentage = 100;
  }

  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (changePercentage > 5) {
    trend = 'up';
  } else if (changePercentage < -5) {
    trend = 'down';
  }

  return {
    current_period: currentCount,
    previous_period: previousCount,
    change_percentage: changePercentage,
    trend
  };
}

/**
 * 计算平均值
 */
export function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return sum / numbers.length;
}

/**
 * 计算中位数
 */
export function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  
  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  } else {
    return sorted[middle];
  }
}

/**
 * 计算标准差
 */
export function calculateStandardDeviation(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  
  const mean = calculateAverage(numbers);
  const squaredDifferences = numbers.map(num => Math.pow(num - mean, 2));
  const variance = calculateAverage(squaredDifferences);
  
  return Math.sqrt(variance);
}

/**
 * 生成数据摘要
 */
export function generateDataSummary(numbers: number[]): {
  count: number;
  sum: number;
  average: number;
  median: number;
  min: number;
  max: number;
  std_deviation: number;
} {
  if (numbers.length === 0) {
    return {
      count: 0,
      sum: 0,
      average: 0,
      median: 0,
      min: 0,
      max: 0,
      std_deviation: 0
    };
  }

  return {
    count: numbers.length,
    sum: numbers.reduce((acc, num) => acc + num, 0),
    average: calculateAverage(numbers),
    median: calculateMedian(numbers),
    min: Math.min(...numbers),
    max: Math.max(...numbers),
    std_deviation: calculateStandardDeviation(numbers)
  };
}

/**
 * 计算百分位数
 */
export function calculatePercentile(numbers: number[], percentile: number): number {
  if (numbers.length === 0) return 0;
  if (percentile < 0 || percentile > 100) {
    throw new Error('Percentile must be between 0 and 100');
  }

  const sorted = [...numbers].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  
  if (Number.isInteger(index)) {
    return sorted[index];
  } else {
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }
}

/**
 * 检测异常值（使用IQR方法）
 */
export function detectOutliers(numbers: number[]): {
  outliers: number[];
  clean_data: number[];
  lower_bound: number;
  upper_bound: number;
} {
  if (numbers.length < 4) {
    return {
      outliers: [],
      clean_data: numbers,
      lower_bound: 0,
      upper_bound: 0
    };
  }

  const q1 = calculatePercentile(numbers, 25);
  const q3 = calculatePercentile(numbers, 75);
  const iqr = q3 - q1;
  
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  const outliers: number[] = [];
  const cleanData: number[] = [];
  
  numbers.forEach(num => {
    if (num < lowerBound || num > upperBound) {
      outliers.push(num);
    } else {
      cleanData.push(num);
    }
  });

  return {
    outliers,
    clean_data: cleanData,
    lower_bound: lowerBound,
    upper_bound: upperBound
  };
}