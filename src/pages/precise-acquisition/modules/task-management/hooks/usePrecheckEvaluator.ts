import { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import { preciseAcquisitionService } from '../../../../../application/services';
import { ExecutorMode, TaskStatus } from '../../../../../constants/precise-acquisition-enums';
import type {
  PrecheckContext,
  PrecheckResult,
  UsePrecheckEvaluatorResult,
} from './types';

const SENSITIVE_DICTIONARY = [
  '加微信',
  '导流',
  '返利',
  '色情',
  '违法',
  '赌博',
  '违规',
];

const hoursToMs = (hours: number) => hours * 60 * 60 * 1000;

const evaluatePermissions = (context: PrecheckContext): PrecheckResult => {
  if (context.executorMode === ExecutorMode.API) {
    return {
      key: 'permissions',
      label: '权限',
      status: 'pass',
      message: '已检测到 API 权限，可直接调用',
    };
  }

  return {
    key: 'permissions',
    label: '权限',
    status: 'warning',
    message: '当前任务需人工半自动处理',
    detail: '账号暂未开通 API 回复权限，请按流程人工完成并回填结果',
  };
};

const evaluateSensitiveWords = (context: PrecheckContext): PrecheckResult => {
  const text = context.commentContent || '';
  const hit = SENSITIVE_DICTIONARY.find((keyword) => text.includes(keyword));

  if (!hit) {
    return {
      key: 'sensitiveWords',
      label: '敏感词',
      status: 'pass',
      message: '未命中敏感词',
    };
  }

  return {
    key: 'sensitiveWords',
    label: '敏感词',
    status: 'blocked',
    message: `命中敏感词「${hit}」`,
    detail: '请替换话术或交由具备审批权限的同学处理',
  };
};

export function usePrecheckEvaluator(context: PrecheckContext | null): UsePrecheckEvaluatorResult {
  const [loading, setLoading] = useState(false);
  const [checks, setChecks] = useState<PrecheckResult[]>([]);

  const runEvaluations = useCallback(async () => {
    if (!context) {
      setChecks([]);
      return;
    }

    setLoading(true);

    try {
      const permissionResult = evaluatePermissions(context);
      const sensitiveResult = evaluateSensitiveWords(context);

      let rateLimitResult: PrecheckResult = {
        key: 'rateLimit',
        label: '频控',
        status: 'pass',
        message: '频控未命中',
      };

      if (context.assignAccountId) {
        const rateLimit = await preciseAcquisitionService.checkRateLimit(
          context.assignAccountId,
          preciseAcquisitionService.getDefaultRateLimitConfig(),
        );

        if (!rateLimit.allowed) {
          rateLimitResult = {
            key: 'rateLimit',
            label: '频控',
            status: rateLimit.wait_seconds ? 'warning' : 'blocked',
            message: rateLimit.reason || '频控限制',
            waitSeconds: rateLimit.wait_seconds,
          };
        }
      } else {
        rateLimitResult = {
          key: 'rateLimit',
          label: '频控',
          status: 'warning',
          message: '未识别到执行账号，暂无法计算频控',
        };
      }

      let dedupResult: PrecheckResult = {
        key: 'deduplication',
        label: '查重',
        status: 'pass',
        message: '未发现重复执行',
      };

      if (context.dedupKey && context.assignAccountId) {
        const history = await preciseAcquisitionService.getTasks({
          assign_account_id: context.assignAccountId,
          limit: 200,
        });

        const duplicate = history.find((task) => {
          if (task.dedupKey !== context.dedupKey) {
            return false;
          }

          if (task.status !== TaskStatus.DONE) {
            return false;
          }

          if (!task.executedAt) {
            return false;
          }

          // 24 小时窗口内视为重复
          const withinWindow =
            Date.now() - task.executedAt.getTime() <= hoursToMs(24);

          return withinWindow;
        });

        if (duplicate) {
          dedupResult = {
            key: 'deduplication',
            label: '查重',
            status: 'blocked',
            message: '24 小时内已经执行过相同对象',
            detail: `上次执行时间：${duplicate.executedAt?.toLocaleString()}`,
          };
        }
      }

      setChecks([permissionResult, rateLimitResult, dedupResult, sensitiveResult]);
    } catch (error) {
      console.error('执行前检查失败:', error);
      message.error('执行前检查失败，请稍后重试');
      setChecks((current) =>
        current.length
          ? current
          : [
              {
                key: 'permissions',
                label: '权限',
                status: 'warning',
                message: '检查失败',
              },
            ],
      );
    } finally {
      setLoading(false);
    }
  }, [context]);

  useEffect(() => {
    runEvaluations();
  }, [runEvaluations]);

  const allPassed = useMemo(
    () => checks.every((item) => item.status === 'pass'),
    [checks],
  );

  return {
    loading,
    checks,
    allPassed,
    refresh: runEvaluations,
  };
}
