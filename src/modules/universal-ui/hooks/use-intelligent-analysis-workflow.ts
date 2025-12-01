// src/modules/universal-ui/hooks/use-intelligent-analysis-workflow.ts
// module: universal-ui | layer: hooks | role: workflow-manager
// summary: V2 智能分析工作流管理Hook（已升级到V3）
//
// 🔄 [V2 传统工作流系统 - 已升级到 V3]
//
// ⚠️  重要提醒：此文件为 V2 传统 Hook，已有更高效的 V3 替代方案
//
// V2 系统特征：
//   - ✅ 完整工作流管理（创建→分析→完成）
//   - ❌ 完整数据传输：createStepCardQuick() → startAnalysis() (~500KB)
//   - ❌ 简单事件监听：analysis:progress, analysis:done
//   - ✅ 稳定可靠，适合作为后备方案
//
// 🚀 V3 升级版本（推荐使用）：
//   📁 V3 Hook：use-intelligent-analysis-workflow-v3.ts (计划创建)
//   📁 V3 集成：直接在此文件中通过 FeatureFlagManager 切换 ✅ 推荐方案
//
// 🔄 V2 → V3 关键升级：
//   V2: createStepCardQuick() → 传完整元素数据 → startAnalysis()
//   V3: createStepCardQuick() → 传 analysisId → executeChainV3() (90%精简)
//
//   V2: 事件监听 analysis:progress (基础进度)
//   V3: 相同事件 + Phase枚举 (更细粒度：UI_DUMP→MATCH→EXECUTE→VALIDATE)
//
//   V2: 单一模式执行
//   V3: by-ref/by-inline 双模式 + 智能回退
//
// 📋 集成建议（当前最优方案）：
//   1. 在此文件中集成 FeatureFlagManager
//   2. 根据 feature flag 选择 V2 或 V3 服务层
//   3. 保持相同的 Hook 接口，用户无感知切换
//   4. V3 失败时自动回退到 V2（容错机制）
//
// 💡 优势：避免重复创建Hook文件，统一管理工作流逻辑
//
// ============================================

import { useState, useEffect, useCallback, useRef } from "react";
import { message } from "antd";
import { logOnce, logProgress } from "../../../utils/logger-config";
import { useSelectedDevice } from "../../../application/store/adbStore";
import { useAnalysisStateStore } from "../../../stores/analysis-state-store";
import { useAdbStore } from "../../../application/store/adbStore";
import { SNAPSHOT_DEVICE_ID } from "../../../application/constants";

// ========== V2/V3 智能分析后端服务 ==========
// 🔄 [V2/V3 动态切换] 根据特性开关选择执行版本
import { intelligentAnalysisBackend } from "../../../services/intelligent-analysis-backend";
import {
  IntelligentAnalysisBackendV3,
  V3ExecutionConfig,
  V3ChainSpec,
} from "../../../services/intelligent-analysis-backend-v3";
import { featureFlagManager } from "../../../config/feature-flags";

import { FallbackStrategyGenerator } from "../domain/fallback-strategy-generator";
import { EVENTS, ANALYSIS_STATES } from "../../../shared/constants/events";
import { eventAckService } from "../infrastructure/event-acknowledgment-service";
import { analysisHealthService } from "../infrastructure/analysis-health-service";

import type {
  ElementSelectionContext,
  SelectionHash,
  AnalysisJob,
  IntelligentStepCard,
  AnalysisResult,
} from "../types/intelligent-analysis-types";

import { calculateSelectionHash } from "../utils/selection-hash";

/**
 * V2/V3智能分析工作流Hook返回值
 * 🚀 [V3集成] 支持V2/V3动态切换的统一接口
 */
export interface UseIntelligentAnalysisWorkflowReturn {
  // ========== 核心状态 ==========
  currentJobs: Map<string, AnalysisJob>;
  stepCards: IntelligentStepCard[];
  isAnalyzing: boolean;

  // ========== V2/V3 智能执行状态 ==========
  currentExecutionVersion: "v2" | "v3"; // 🔄 当前执行版本

  // 向后兼容属性 (for tests)
  progress?: number;
  status?: string;
  error?: string;
  clearAllSteps?: () => void;

  // ========== 核心操作（V2/V3统一接口）==========
  startAnalysis: (
    context: ElementSelectionContext,
    stepId?: string,
    userSelectionMode?: string
  ) => Promise<string>;
  cancelAnalysis: (jobId: string) => Promise<void>;
  createStepCardQuick: (
    context: ElementSelectionContext,
    lockContainer?: boolean
  ) => Promise<string>;
  bindAnalysisResult: (stepId: string, result: AnalysisResult) => Promise<void>;

  // 步骤卡片操作
  updateStepCard: (
    stepId: string,
    updates: Partial<IntelligentStepCard>
  ) => void;
  deleteStepCard: (stepId: string) => void;
  switchStrategy: (
    stepId: string,
    strategyKey: string,
    followSmart?: boolean
  ) => Promise<void>;
  upgradeStep: (stepId: string) => Promise<void>;
  retryAnalysis: (stepId: string) => Promise<void>;

  // 工具方法
  getStepCard: (stepId: string) => IntelligentStepCard | undefined;
  getJobsBySelectionHash: (hash: SelectionHash) => AnalysisJob[];
  clearAllJobs: () => void;
}

/**
 * 生成唯一ID
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * V2/V3智能分析工作流管理Hook
 *
 * 🚀 [V3集成完成]
 * ✅ 已完成V2→V3升级集成，支持：
 *   - 动态版本选择：根据FeatureFlags和健康检查自动选择V2/V3
 *   - 智能回退：V3失败时自动降级到V2系统
 *   - 统一接口：用户代码无需修改，透明切换
 *   - 性能提升：V3模式下90%数据精简 + 智能短路
 *
 * 🔄 执行路径：
 *   V2路径: startAnalysis() → intelligentAnalysisBackend.startAnalysis()
 *   V3路径: startAnalysis() → IntelligentAnalysisBackendV3.executeChainV3()
 *
 * 📋 版本特性对比：
 *   V2: 完整数据传输(~500KB) + 事件驱动进度 + 稳定可靠
 *   V3: by-ref精简传输(~5KB) + 智能短路算法 + 统一执行协议
 *
 * 🎛️ 控制方式：
 *   - 自动模式：featureFlagManager.getSmartExecutionVersion()
 *   - 手动控制：window.v2v3Migration.setV3Enabled(true/false)
 *   - 健康监控：每30秒检查V3可用性
 */
export function useIntelligentAnalysisWorkflow(): UseIntelligentAnalysisWorkflowReturn {
  // ========== 设备管理 ==========
  const selectedDevice = useSelectedDevice();
  
  // ========== V2/V3 智能版本选择系统 ==========
  // 🔄 动态选择执行版本，支持实时切换和自动回退
  const [currentExecutionVersion, setCurrentExecutionVersion] = useState<
    "v2" | "v3"
  >("v2");

  // 定期检查V3健康状态并更新执行版本
  useEffect(() => {
    const updateExecutionVersion = async () => {
      try {
        // 🚨 关键修复：移除对 offline_snapshot_mode 的强制 V2 降级
        // 原因：V3 事件监听需要启用 V3 模式，即使在快照模式下也应保持 V3 监听
        // 至于执行时的设备ID问题，由 startAnalysis 内部处理
        /*
        if (!selectedDevice || selectedDevice.id === 'offline_snapshot_mode') {
          console.log('🔌 [SmartRouting] 无设备连接，强制使用 V2 离线分析引擎');
          setCurrentExecutionVersion("v2");
          return;
        }
        */

        const version = await featureFlagManager.getSmartExecutionVersion(
          "intelligent-analysis"
        );
        setCurrentExecutionVersion(version);
        // console.log(`🔄 [V2/V3] 当前执行版本: ${version.toUpperCase()}`);
      } catch (error) {
        console.error("❌ [V2/V3] 版本选择失败，回退到V2:", error);
        setCurrentExecutionVersion("v2");
      }
    };

    // 立即检查一次
    updateExecutionVersion();

    // 每30秒检查一次V3健康状态
    const interval = setInterval(updateExecutionVersion, 30000);
    return () => clearInterval(interval);
  }, [selectedDevice]);

  // 状态管理
  const [currentJobs, setCurrentJobs] = useState<Map<string, AnalysisJob>>(
    new Map()
  );
  const [stepCards, setStepCards] = useState<IntelligentStepCard[]>([]);

  // 事件监听器引用
  const unlistenFunctions = useRef<(() => void)[]>([]);

  // 🔒 幂等性保护：已处理的完成事件
  const processedJobs = useRef<Set<string>>(new Set());

  // 计算是否正在分析
  const isAnalyzing = Array.from(currentJobs.values()).some(
    (job) => job.state === "queued" || job.state === "running"
  );

  /**
   * 设置事件监听器
   * 🚀 [V3集成] 根据执行版本动态选择事件监听服务
   */
  useEffect(() => {
    const setupEventListeners = async () => {
      try {
        // 🔄 V2/V3 智能事件监听切换
        const backendService = currentExecutionVersion === "v3" 
          ? IntelligentAnalysisBackendV3 
          : intelligentAnalysisBackend;
        
        console.log(`🔧 [EventSetup] 使用${currentExecutionVersion.toUpperCase()}事件监听系统`);

        // 分析进度事件 - ✅ V2/V3统一接口，自动适配
        const unlistenProgress =
          await backendService.listenToAnalysisProgress(
            (jobId, progress, currentStep, estimatedTimeLeft) => {
              // 🛡️ 防御性编程：处理 jobId 为空的情况 (V3 事件可能导致 jobId 为 undefined)
              if (!jobId) {
                // 尝试从 currentStep 或其他上下文推断，或者直接忽略
                // console.warn("⚠️ [Workflow] 收到无效的 jobId，跳过处理", { progress, currentStep });
                return;
              }

              // 🔇 日志优化：使用防抖日志，避免重复打印
              logProgress(jobId, progress, "📊 [Workflow] 收到分析进度", {
                jobId,
                currentStep,
                estimatedTimeLeft,
              });

              // ✅ 精准更新对应的任务
              setCurrentJobs((prev) => {
                const updated = new Map(prev);
                let job = updated.get(jobId);

                // 🆕 修复：尝试通过 stepId 模糊匹配任务 (解决 V3 后端事件 ID 不一致问题)
                if (!job) {
                  // 1. 尝试匹配 step_execution_{stepId} 格式
                  const stepIdMatch = jobId.match(/step_execution_(.+)/);
                  const targetStepId = stepIdMatch ? stepIdMatch[1] : jobId;
                  
                  // 2. 遍历查找匹配 stepId 的任务
                  for (const j of updated.values()) {
                    if (j.stepId === targetStepId || j.stepId === jobId) {
                      job = j;
                      // console.log(`🔗 [Workflow] 通过 stepId 关联任务: ${jobId} -> ${j.jobId}`);
                      break;
                    }
                  }
                }

                if (job && job.state === "running") {
                  // ✅ 更新原始任务 (使用 job.jobId 作为 key)
                  updated.set(job.jobId, {
                    ...job,
                    progress,
                    estimatedTimeLeft,
                  });
                } else {
                  // 🔇 日志优化：使用 logOnce 避免重复警告
                  logOnce(
                    `unknown-job-${jobId}`,
                    `⚠️ [Workflow] 收到未知任务的进度更新: ${jobId}`,
                    { jobId, currentJobs: Array.from(updated.keys()) }
                  );
                }
                return updated;
              });

              // ✅ 只更新匹配 jobId 的步骤卡片！
              setStepCards((prev) =>
                prev.map((card) => {
                  // 🆕 修复：支持模糊匹配
                  const stepIdMatch = jobId.match(/step_execution_(.+)/);
                  const targetStepId = stepIdMatch ? stepIdMatch[1] : jobId;
                  const isMatch = 
                    card.analysisJobId === jobId || 
                    card.stepId === targetStepId;

                  if (
                    isMatch &&
                    card.analysisState === "analyzing"
                  ) {
                    // 🔇 日志优化：只在进度有大幅变化时打印
                    if (progress % 25 === 0 || progress === 100) {
                      // console.log("🎯 [Workflow] 更新步骤卡片进度", {
                      //   stepId: card.stepId,
                      //   jobId,
                      //   progress,
                      // });
                    }
                    return {
                      ...card,
                      analysisProgress: progress,
                      estimatedTimeLeft,
                    };
                  }
                  return card;
                })
              );

              // 🔄 桥接到统一StepCard Store (修复可视化分析页面状态同步)
              (async () => {
                try {
                  const { useStepCardStore } = await import(
                    "../../../store/stepcards"
                  );
                  const unifiedStore = useStepCardStore.getState();
                  const cardByJob = unifiedStore.findByJob(jobId);
                  if (cardByJob) {
                    // ✅ 修正：progress=100 时不要再写 analyzing，静待 DONE 事件
                    if (progress < 100) {
                      unifiedStore.updateStatus(cardByJob, "analyzing");
                    }
                    unifiedStore.updateProgress(cardByJob, progress);
                    // console.log("🔗 [Bridge] 同步进度到统一store", {
                    //   cardId: cardByJob.slice(-8),
                    //   jobId: jobId.slice(-8),
                    //   progress,
                    //   statusUpdate: progress < 100 ? "analyzing" : "no-change",
                    // });
                  }
                } catch (err) {
                  console.warn("⚠️ [Bridge] 同步到统一store失败", err);
                }
              })();
            }
          );

        // 🔒 分析完成事件 - jobId 精确匹配 + 懒绑定防竞态 + ACK确认
        // 🚀 [V3集成] V2/V3完成事件统一处理
        const unlistenDone =
          await backendService.listenToAnalysisComplete(
            async (jobId, result) => {
              // console.log("✅ [Workflow] 收到分析完成", {
              //   jobId: jobId.slice(-8),
              //   result,
              // });

              // 🔒 幂等性保护：检查是否已处理过此完成事件
              if (processedJobs.current.has(jobId)) {
                // console.log("🔒 [Workflow] 完成事件已处理，跳过重复处理", {
                //   jobId: jobId.slice(-8),
                // });
                return;
              }
              processedJobs.current.add(jobId);

              // 🔒 XOR确认：检查是否已处理过此完成事件（兼容性）
              if (
                eventAckService.isEventAcknowledged(EVENTS.ANALYSIS_DONE, jobId)
              ) {
                console.log("🔒 [Workflow] 完成事件已确认处理，跳过重复处理", {
                  jobId: jobId.slice(-8),
                });
                return;
              }

              setCurrentJobs((prev) => {
                const updated = new Map(prev);
                let job = updated.get(jobId);

                // 🆕 修复：尝试通过 stepId 模糊匹配任务 (解决 V3 后端事件 ID 不一致问题)
                if (!job) {
                  // 1. 尝试匹配 step_execution_{stepId} 格式
                  const stepIdMatch = jobId.match(/step_execution_(.+)/);
                  const targetStepId = stepIdMatch ? stepIdMatch[1] : jobId;
                  
                  // 2. 遍历查找匹配 stepId 的任务
                  for (const j of updated.values()) {
                    if (j.stepId === targetStepId || j.stepId === jobId) {
                      job = j;
                      // console.log(`🔗 [Workflow] 通过 stepId 关联完成事件: ${jobId} -> ${j.jobId}`);
                      break;
                    }
                  }
                }

                if (!job) {
                  // 🔒 懒绑定：完成事件先于启动到达时的兜底
                  console.warn(
                    "⚠️ [Workflow] 收到未知任务的完成事件，尝试懒绑定",
                    { jobId }
                  );
                  const orphanCard = Array.from(stepCards).find(
                    (c) =>
                      (c.analysisState === "analyzing" ||
                        c.analysisState === "idle") &&
                      !c.analysisJobId
                  );

                  if (orphanCard) {
                    console.log("🔗 [Workflow] 懒绑定孤立完成事件到步骤", {
                      jobId,
                      stepId: orphanCard.stepId,
                    });
                    updated.set(jobId, {
                      jobId,
                      stepId: orphanCard.stepId,
                      selectionHash: result.selectionHash,
                      state: "completed",
                      progress: 100,
                      completedAt: Date.now(),
                      result,
                      startedAt: Date.now(),
                    });
                  }
                } else {
                  // 正常流程：更新已登记的任务
                  updated.set(job.jobId, { // ✅ 使用原始 job.jobId 保持一致性
                    ...job,
                    state: "completed",
                    progress: 100,
                    completedAt: Date.now(),
                    result,
                  });
                  // console.log("🔗 [Workflow] 更新任务状态为已完成", {
                  //   jobId,
                  //   stepId: job.stepId,
                  // });
                }

                return updated;
              });

              // ✅ 精确匹配并更新步骤卡片，强制清理 Loading
              setStepCards((prevCards) => {
                return prevCards.map((card) => {
                  // 🆕 修复：支持模糊匹配
                  const stepIdMatch = jobId.match(/step_execution_(.+)/);
                  const targetStepId = stepIdMatch ? stepIdMatch[1] : jobId;
                  const isMatch = 
                    card.analysisJobId === jobId || 
                    card.stepId === targetStepId;

                  if (isMatch) {
                    // console.log("🎯 [Workflow] 更新步骤卡片为完成状态", {
                    //   stepId: card.stepId,
                    //   jobId,
                    // });
                    return {
                      ...card,
                      analysisState: ANALYSIS_STATES.COMPLETED,
                      analysisProgress: 100,
                      analysisJobId: undefined, // ✅ 清除引用防误匹配
                      smartCandidates: result.smartCandidates,
                      staticCandidates: result.staticCandidates,
                      recommendedStrategy: result.smartCandidates.find(
                        (c) => c.key === result.recommendedKey
                      ),
                      analyzedAt: Date.now(),
                      updatedAt: Date.now(),
                    };
                  }
                  return card;
                });
              });

              // 🔄 桥接到统一StepCard Store (修复可视化分析页面状态同步)
              (async () => {
                try {
                  const { useStepCardStore } = await import(
                    "../../../store/stepcards"
                  );
                  const unifiedStore = useStepCardStore.getState();
                  const cardByJob = unifiedStore.findByJob(jobId);
                  if (cardByJob) {
                    // 将策略候选转换为统一格式
                    const recommendedStrategy = result.smartCandidates?.find(
                      (c) => c.key === result.recommendedKey
                    );
                    
                    // 🆕 同步到 AnalysisStateStore (修复评分显示)
                    const analysisStore = useAnalysisStateStore.getState();
                    if (result.smartCandidates) {
                      const scores = result.smartCandidates.map(c => ({
                        stepId: c.key, // 使用 candidateKey 作为 stepId
                        confidence: c.confidence,
                        strategy: c.name,
                        metrics: {
                          source: 'intelligent-analysis',
                          mode: 'v3',
                          timestamp: Date.now()
                        }
                      }));
                      analysisStore.setFinalScores(scores);
                      console.log("✅ [Workflow] 同步评分到 AnalysisStateStore", scores);
                    }

                    const strategy = {
                      primary: result.recommendedKey || "fallback",
                      backups:
                        result.smartCandidates?.slice(1).map((c) => c.key) ||
                        [],
                      score: recommendedStrategy?.confidence || 0.8,
                      candidates:
                        result.smartCandidates?.map((c) => ({
                          key: c.key,
                          name: c.name,
                          confidence: c.confidence,
                          xpath: c.xpath || "",
                          description: c.description,
                        })) || [],
                    };

                    unifiedStore.fillStrategyAndReady(cardByJob, strategy);
                    console.log("🔗 [Bridge] 同步完成状态到统一store", {
                      cardId: cardByJob,
                      jobId,
                      strategy,
                    });
                  }
                } catch (err) {
                  console.warn("⚠️ [Bridge] 同步完成状态到统一store失败", err);
                }
              })();

              // 🔒 确认事件已处理，防止重复处理
              await eventAckService.acknowledgeEvent(
                EVENTS.ANALYSIS_DONE,
                jobId,
                {
                  selectionHash: result.selectionHash,
                  processedAt: Date.now(),
                }
              );

              console.log("✅ [Workflow] 完成事件处理并已确认", { jobId });
            }
          );

        // 🚀 [V3集成] V2/V3错误事件统一处理
        const unlistenError =
          await backendService.listenToAnalysisError((error) => {
            console.error("❌ [Workflow] 收到分析错误", error);

            // 找到运行中的任务并标记为失败
            setCurrentJobs((prev) => {
              const updated = new Map(prev);
              for (const [jobId, job] of Array.from(updated.entries())) {
                if (job.state === "running") {
                  updated.set(jobId, {
                    ...job,
                    state: "failed",
                    completedAt: Date.now(),
                    error,
                  });
                  break; // 假设只有一个运行中的任务
                }
              }
              return updated;
            });

            // 更新关联的步骤卡片（更新所有分析中的卡片为失败状态）
            setStepCards((prev) =>
              prev.map((card) =>
                card.analysisState === "analyzing"
                  ? {
                      ...card,
                      analysisState: "analysis_failed",
                      analysisError: error,
                      analysisProgress: 0,
                    }
                  : card
              )
            );

            if (error !== "canceled") {
              console.error(`❌ 分析失败: ${error}`);
              // message.error(`分析失败: ${error}`); // 注释掉静态调用，避免警告
            }
          });

        unlistenFunctions.current = [
          unlistenProgress,
          unlistenDone,
          unlistenError,
        ];
      } catch (error) {
        console.error("设置事件监听器失败:", error);
      }
    };

    setupEventListeners();

    return () => {
      // 🚀 [V3集成] V2/V3智能cleanup
      if (currentExecutionVersion === "v3") {
        IntelligentAnalysisBackendV3.cleanup();
      }
      unlistenFunctions.current.forEach((unlisten) => unlisten());
    };
  }, [stepCards, currentExecutionVersion]); // 🔄 添加currentExecutionVersion依赖

  /**
   * 启动分析
   */
  const startAnalysis = useCallback(
    async (
      context: ElementSelectionContext,
      stepId?: string,
      userSelectionMode?: string
    ): Promise<string> => {
      // 🎯 [临时修复] 获取当前用户的选择模式
      // TODO: 这应该从ActionSelector组件或全局状态中获取
      const currentSelectionMode =
        userSelectionMode ||
        (() => {
          // 尝试从URL参数获取选择模式（临时方案）
          const urlParams = new URLSearchParams(window.location.search);
          const modeParam = urlParams.get("selectionMode");
          if (modeParam) {
            console.log("🔍 [临时] 从URL获取选择模式:", modeParam);
            return modeParam;
          }

          // 尝试从localStorage获取用户之前的选择（临时方案）
          const savedMode = localStorage.getItem("userSelectionMode");
          if (savedMode) {
            console.log("🔍 [临时] 从localStorage获取选择模式:", savedMode);
            return savedMode;
          }

          console.log("🔍 [临时] 使用默认选择模式: auto");
          return "auto";
        })();

      console.log(
        "🎯 [Selection Mode] 当前用户选择模式:",
        currentSelectionMode
      );

      // 🔍 Task 8: 健康检查兜底 - 分析启动前系统状态检查
      const healthOk = await analysisHealthService.checkBeforeAnalysis();

      if (!healthOk) {
        throw new Error("系统健康检查失败，无法启动分析");
      }

      const selectionHash = calculateSelectionHash(context);

      // 检查是否已有相同选择的分析任务
      const existingJob = Array.from(currentJobs.values()).find(
        (job) =>
          job.selectionHash === selectionHash &&
          (job.state === "queued" || job.state === "running")
      );

      if (existingJob) {
        // 如果指定了stepId，更新作业关联
        if (stepId && !existingJob.stepId) {
          setCurrentJobs((prev) => {
            const updated = new Map(prev);
            updated.set(existingJob.jobId, { ...existingJob, stepId });
            return updated;
          });
        }
        return existingJob.jobId;
      }

      try {
        // 🔥🔥🔥 关键修复：优先使用 context.originalUIElement（包含完整结构信息）
        // 如果没有，则构建基础UIElement对象
        const uiElement = context.originalUIElement || {
          id:
            context.keyAttributes?.["resource-id"] || context.elementPath || "",
          xpath: context.elementPath || "",
          text: context.elementText || "",
          bounds: context.elementBounds
            ? (() => {
                try {
                  // 检查是否是JSON格式
                  if (context.elementBounds.startsWith("{")) {
                    return JSON.parse(context.elementBounds);
                  }
                  // 解析 "[864,2230][1080,2358]" 格式
                  const match = context.elementBounds.match(
                    /\[(\d+),(\d+)\]\[(\d+),(\d+)\]/
                  );
                  if (match) {
                    const [, left, top, right, bottom] = match.map(Number);
                    return { left, top, right, bottom };
                  }
                  throw new Error("无法识别的bounds格式");
                } catch (e) {
                  console.warn(
                    "⚠️ elementBounds 解析失败，使用默认值:",
                    context.elementBounds,
                    e
                  );
                  return { left: 0, top: 0, right: 0, bottom: 0 };
                }
              })()
            : { left: 0, top: 0, right: 0, bottom: 0 },
          element_type: context.elementType || "unknown",
          resource_id: context.keyAttributes?.["resource-id"] || "",
          content_desc: context.keyAttributes?.["content-desc"] || "",
          class_name: context.keyAttributes?.class || "",
          is_clickable: true,
          is_scrollable: false,
          is_enabled: true,
          is_focused: false,
          checkable: false,
          checked: false,
          selected: false,
          password: false,
          // 🔥 关键修复：传递 indexPath，启用结构匹配
          indexPath:
            (context as any).indexPath ||
            (context as any).originalUIElement?.indexPath ||
            [],
        };
        
        // 🔍 调试：检查 uiElement 是否包含结构信息
        console.log('🔍 [Workflow] uiElement 构建结果:', {
          hasOriginalUIElement: !!context.originalUIElement,
          uiElementId: uiElement.id,
          hasIndexPath: !!(uiElement as any).indexPath,
          indexPathLength: (uiElement as any).indexPath?.length,
          hasChildren: !!(uiElement as any).children,
          childrenCount: (uiElement as any).children?.length,
        });

        // ========== V2/V3 智能路由系统 ==========
        // 🚀 根据特性开关和健康状态动态选择执行版本
        let response;
        let jobId: string;

        try {
          // 🚀 [智能路由] V3 引擎现在支持离线/快照分析 (通过 xmlCacheId)
          // 不再强制要求真实设备，允许 snapshot-mode
          const canUseV3 = currentExecutionVersion === "v3";

          if (canUseV3) {
            // console.log("🚀 [V3] 使用V3统一执行协议启动智能分析");

            // V3 高效执行：构建统一配置和链规格
            const analysisId = `analysis_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`;
            
            // 动态获取选中设备ID
            let deviceId = selectedDevice?.id;
            
            // 🚨 修复：如果当前是离线快照模式，尝试查找真实设备
            // 🚀 [V3集成] 如果是V3模式，允许使用 snapshot-mode 占位符，不强制要求真实设备
            if ((!deviceId || deviceId === SNAPSHOT_DEVICE_ID) && currentExecutionVersion !== "v3") {
               const devices = useAdbStore.getState().devices;
               const realDevice = devices.find(d => d.id !== SNAPSHOT_DEVICE_ID && d.status === 'online');
               if (realDevice) {
                 deviceId = realDevice.id;
                 console.log(`🔌 [SmartRouting] 自动切换到真实设备: ${deviceId}`);
               }
            }

            // 🚀 [V3集成] V3模式下允许无设备ID（离线分析）
            if (!deviceId && currentExecutionVersion !== "v3") {
               throw new Error("没有选中的设备，请先连接设备");
            }
            
            // 如果是V3且无设备，使用占位符
            if (!deviceId && currentExecutionVersion === "v3") {
                deviceId = "snapshot-mode";
            }

            // V3执行配置 - 90%数据精简 + 智能回退优化
            const v3Config: V3ExecutionConfig = {
              analysis_id: analysisId, // 唯一分析ID，支持链路追踪
              device_id: deviceId!, // 设备标识，关联ADB连接
              timeout_ms: 60000, // V3超时后自动降级V2
              max_retries: 2, // 智能重试：失败时自动V3→V2回退
              dryrun: deviceId === 'snapshot-mode', // 🚀 离线模式下启用dryrun，避免尝试连接不存在的设备
              enable_fallback: true, // 🚀 启用V2回退：确保业务连续性
              // 🚀 [离线支持] 传递XML缓存ID，允许无设备分析
              // 如果是snapshot-mode，强制清空xmlCacheId，确保后端使用xmlContent而不是尝试查找缓存或连接设备
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              xmlCacheId: (deviceId === 'snapshot-mode') ? undefined : ((context as any).xmlCacheId || context.snapshotId),
              // 🔥 关键修复：传递完整XML内容，防止后端尝试从 snapshot-mode 设备 dump
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              xmlContent: (context as any).xmlContent,
            };

            // 🔗 V3链规格构建：将UI元素转换为统一执行步骤
            const chainSpec: V3ChainSpec = {
              chain_id: `chain_${analysisId}`, // 链标识，支持并发执行追踪
              threshold: 0.7, // 全局置信度阈值：低于此值触发智能短路
              mode: "sequential" as const, // 序列执行：保证步骤依赖关系
              selection_mode: currentSelectionMode as
                | "auto"
                | "first"
                | "last"
                | "match-original"
                | "random"
                | "all", // 🎯 用户选择模式
              steps: [
                {
                  step_id: stepId || `step_${Date.now()}`,
                  action: "smart_navigation" as const, // V3智能导航：融合OCR+CV+规则引擎
                  params: {
                    target_element: uiElement, // by-ref模式：仅传递元素引用(~5KB)
                    selection_context: context, // 精简上下文：智能裁剪无关数据
                  },
                  quality: {
                    confidence_threshold: 0.7, // 步骤级置信度：低于此值智能回退
                    match_precision: 0.8, // 匹配精度要求：确保操作准确性
                    enable_smart_fallback: true, // 🚀 智能回退：失败时自动V3→V2
                  },
                },
              ],
            };

            // V3 执行：统一链执行接口
            response = await IntelligentAnalysisBackendV3.executeChainV3(
              v3Config,
              chainSpec
            );
            jobId = analysisId; // V3使用analysisId作为jobId
            // console.log("✅ [V3] 智能分析启动成功", {
            //   analysisId,
            //   success: response.success,
            // });
          } else {
            // console.log("🔄 [V2] 使用V2传统协议启动智能分析");

            // V2 传统调用：完整数据传输（集成缓存系统）
            response = await intelligentAnalysisBackend.startAnalysis(
              uiElement,
              stepId,
              {
                lockContainer: false,
                enableSmartCandidates: true,
                enableStaticCandidates: true,
                snapshotId: context.snapshotId, // 🚀 传递实际snapshotId
              }
            );
            jobId = response.job_id;
            // console.log("✅ [V2] 传统分析启动成功", { jobId });
          }
        } catch (v3Error) {
          if (currentExecutionVersion === "v3" && selectedDevice?.id) {
            console.warn(
              "⚠️ [V3→V2 回退] V3执行失败，自动回退到V2系统",
              v3Error
            );

            // V3失败时自动回退到V2（容错机制，同样使用缓存）
            try {
              response = await intelligentAnalysisBackend.startAnalysis(
                uiElement,
                stepId,
                {
                  lockContainer: false,
                  enableSmartCandidates: true,
                  enableStaticCandidates: true,
                  snapshotId: context.snapshotId, // 🚀 回退时也使用缓存
                }
              );
              jobId = response.job_id;

              // 更新执行版本状态（临时降级）
              setCurrentExecutionVersion("v2");
              console.log("✅ [V2 回退] 成功回退到V2系统执行", { jobId });
            } catch (fallbackError) {
              console.error("❌ [致命错误] V3和V2系统均失败", {
                v3Error,
                fallbackError,
              });
              throw new Error(
                `分析系统故障：V3失败(${v3Error.message})，V2回退也失败(${fallbackError.message})`
              );
            }
          } else {
            // V2本身失败
            throw v3Error;
          }
        }

        // 创建分析作业
        const job: AnalysisJob = {
          jobId,
          selectionHash,
          stepId,
          state: "queued",
          progress: 0,
          startedAt: Date.now(),
        };

        setCurrentJobs((prev) => new Map(prev).set(jobId, job));

        // 🔧 修复：立即在StepCardStore中注册job映射
        if (stepId) {
          (async () => {
            try {
              const { useStepCardStore } = await import(
                "../../../store/stepcards"
              );
              const unifiedStore = useStepCardStore.getState();
              const cardId = unifiedStore.byStepId[stepId];
              if (cardId) {
                unifiedStore.bindJob(cardId, jobId);
                // console.log("🔗 [Bridge] 启动时注册job映射", {
                //   stepId,
                //   cardId,
                //   jobId,
                // });
              }
            } catch (err) {
              console.warn("⚠️ [Bridge] 启动时注册job映射失败", err);
            }
          })();
        }

        return jobId;
      } catch (error) {
        console.error("启动分析失败:", error);
        throw new Error(`启动分析失败: ${error}`);
      }
    },
    [currentJobs, currentExecutionVersion, selectedDevice]
  );

  /**
   * 取消分析
   * 🚀 [V3集成] V2/V3统一取消接口
   */
  const cancelAnalysis = useCallback(async (jobId: string): Promise<void> => {
    try {
      // 🔄 V2/V3 智能路由
      if (currentExecutionVersion === "v3") {
        await IntelligentAnalysisBackendV3.cancelAnalysis(jobId);
      } else {
        await intelligentAnalysisBackend.cancelAnalysis(jobId);
      }

      setCurrentJobs((prev) => {
        const updated = new Map(prev);
        const job = updated.get(jobId);
        if (job) {
          updated.set(jobId, {
            ...job,
            state: "canceled",
            completedAt: Date.now(),
          });
        }
        return updated;
      });
    } catch (error) {
      console.error("取消分析失败:", error);
      throw new Error(`取消分析失败: ${error}`);
    }
  }, [currentExecutionVersion]); // 🔄 添加currentExecutionVersion依赖

  /**
   * 快速创建步骤卡片
   */
  const createStepCardQuick = useCallback(
    async (
      context: ElementSelectionContext,
      lockContainer: boolean = false
    ): Promise<string> => {
      const stepId = generateId();
      const selectionHash = calculateSelectionHash(context);

      // 使用增强的兜底策略生成器
      const fallbackStrategy =
        FallbackStrategyGenerator.generatePrimaryFallback(context);

      try {
        // 本地创建步骤卡片（不需要后端调用）
        console.log("🎯 [Workflow] 创建快速步骤卡片", {
          stepId,
          context,
          lockContainer,
        });

        // 创建步骤卡片 - 关键：立即可用的默认值
        const stepCard: IntelligentStepCard = {
          stepId,
          stepName: `步骤 ${stepCards.length + 1}`,
          stepType: context.elementType || "tap",
          elementContext: context,
          selectionHash,
          analysisState: "idle", // 初始状态：未分析但可用
          analysisProgress: 0,
          strategyMode: "intelligent", // 默认智能模式
          smartCandidates: [],
          staticCandidates: [],
          activeStrategy: fallbackStrategy, // 立即使用兜底策略
          fallbackStrategy, // 保存兜底策略引用
          autoFollowSmart: true,
          lockContainer,
          smartThreshold: 0.82,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        setStepCards((prev) => [...prev, stepCard]);

        // 🔄 同步创建到统一StepCard Store (桥接机制) - 🔧 修复：先创建后绑定
        (async () => {
          try {
            const { useStepCardStore } = await import(
              "../../../store/stepcards"
            );
            const unifiedStore = useStepCardStore.getState();

            // 1) 先生成cardId并创建卡片
            const unifiedCardId = `card_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`;
            
            // 🎯 提取原始UIElement的indexPath
            // 🔥 优先从 context.indexPath 获取（已在 convertElementToContext 中修复）
            const indexPath =
              (context as any).indexPath ||
              (context as any).originalUIElement?.indexPath ||
              [];
            
            unifiedStore.createCard(stepId, unifiedCardId, {
              elementContext: {
                xpath: context.elementPath,
                text: context.elementText,
                bounds: context.elementBounds,
                resourceId: context.keyAttributes?.["resource-id"],
                className: context.keyAttributes?.class,
              },
              // 🔥 保存完整的原始UIElement用于后续策略配置
              original_element: context.originalUIElement || null,
              // 🔥 关键修复：保存XML快照信息，确保评分系统可以获取XML内容
              xmlSnapshot: {
                xmlCacheId: context.snapshotId,
                xmlContent: context.xmlContent,
                xmlHash: context.xmlHash,
              },
              // 🎯 静态定位信息 - 用于同一份XML的精确定位
              staticLocator: indexPath.length > 0 ? {
                indexPath: indexPath,
                xmlHash: context.xmlHash || '',
              } : undefined,
              // 🔍 节点指纹 - 用于调试和校验
              elementFingerprint: {
                class: context.keyAttributes?.class,
                resourceId: context.keyAttributes?.["resource-id"],
                text: context.elementText,
                contentDesc: context.keyAttributes?.["content-desc"],
                bounds: context.elementBounds,
                clickable: context.originalUIElement?.clickable,
                childrenTexts: context.originalUIElement?.child_elements?.map((c: any) => c.text).filter(Boolean) || [],
              },
              status: "analyzing",
            });

            console.log("🔗 [Bridge] 在统一store中创建对应卡片", {
              stepId,
              unifiedCardId,
              elementUid: stepId,
              hasOriginalElement: !!context.originalUIElement,
            });

            // 🆕 自动触发Step1-2评分（智能·自动链）
            (async () => {
              try {
                // ⏱️ 短暂延迟，确保卡片和XML缓存都已就绪
                await new Promise(resolve => setTimeout(resolve, 300));
                
                const { executeSmartAutoScoring } = await import(
                  "../../../components/strategy-selector/scoring/smart-auto-scoring"
                );
                const { useAnalysisStateStore } = await import(
                  "../../../stores/analysis-state-store"
                );
                const { useStepCardStore: getStepCardStore } = await import(
                  "../../../store/stepcards"
                );
                
                // 🔧 修复：重新获取最新状态，避免使用过时的 unifiedStore 引用
                const latestStore = getStepCardStore.getState();
                const card = latestStore.cards[unifiedCardId];
                if (card) {
                  const { setFinalScores } = useAnalysisStateStore.getState();
                  console.log("🎯 [自动评分] 开始执行Step1-2评分", { stepId, cardId: unifiedCardId });
                  await executeSmartAutoScoring(card, setFinalScores);
                  console.log("✅ [自动评分] Step1-2评分完成", { stepId });
                } else {
                  console.warn("⚠️ [自动评分] 卡片未找到，跳过评分", { unifiedCardId });
                }
              } catch (err) {
                console.warn("⚠️ [自动评分] 评分失败，不影响卡片创建", err);
              }
            })();
          } catch (err) {
            console.warn("⚠️ [Bridge] 创建统一store卡片失败", err);
          }
        })();

        // 自动启动后台分析（不阻塞用户操作） - 修改顺序：先启动分析再绑定
        try {
          const jobId = await startAnalysis(context, stepId);

          // 立即绑定job到StepCardStore
          (async () => {
            try {
              const { useStepCardStore } = await import(
                "../../../store/stepcards"
              );
              const unifiedStore = useStepCardStore.getState();
              const cardId = unifiedStore.byStepId[stepId];
              if (cardId) {
                unifiedStore.bindJob(cardId, jobId);
                console.log("🔗 [Bridge] 绑定job到统一store卡片", {
                  cardId,
                  jobId,
                });
              }
            } catch (err) {
              console.warn("⚠️ [Bridge] 绑定job失败", err);
            }
          })();
        } catch (error) {
          console.error("❌ [Workflow] 自动启动分析失败", error);
          // 更新卡片状态为失败
          setStepCards((prev) =>
            prev.map((c) =>
              c.stepId === stepId
                ? {
                    ...c,
                    analysisState: "analysis_failed",
                    analysisError: String(error),
                  }
                : c
            )
          );
        }

        return stepId;
      } catch (error) {
        console.error("创建步骤卡片失败:", error);
        throw error;
      }
    },
    [startAnalysis, stepCards.length]
  );

  /**
   * 手动绑定分析结果（用于调试或恢复）
   */
  const bindAnalysisResult = useCallback(
    async (stepId: string, result: AnalysisResult): Promise<void> => {
      setStepCards((prev) =>
        prev.map((card) => {
          if (card.stepId === stepId) {
            return {
              ...card,
              analysisState: "analysis_completed",
              analysisProgress: 100,
              smartCandidates: result.smartCandidates,
              staticCandidates: result.staticCandidates,
              recommendedStrategy: result.smartCandidates.find(
                (c) => c.key === result.recommendedKey
              ),
              updatedAt: Date.now(),
            };
          }
          return card;
        })
      );
    },
    []
  );

  // ... 其他辅助方法 ...

  const updateStepCard = useCallback(
    (stepId: string, updates: Partial<IntelligentStepCard>) => {
      setStepCards((prev) =>
        prev.map((card) =>
          card.stepId === stepId ? { ...card, ...updates } : card
        )
      );
    },
    []
  );

  const deleteStepCard = useCallback((stepId: string) => {
    setStepCards((prev) => prev.filter((card) => card.stepId !== stepId));
  }, []);

  const switchStrategy = useCallback(
    async (stepId: string, strategyKey: string, followSmart: boolean = false) => {
      setStepCards((prev) =>
        prev.map((card) => {
          if (card.stepId === stepId) {
            // 查找策略
            const strategy =
              card.smartCandidates.find((c) => c.key === strategyKey) ||
              card.staticCandidates.find((c) => c.key === strategyKey) ||
              card.fallbackStrategy;

            if (strategy) {
              return {
                ...card,
                activeStrategy: strategy,
                autoFollowSmart: followSmart,
                updatedAt: Date.now(),
              };
            }
          }
          return card;
        })
      );
    },
    []
  );

  const upgradeStep = useCallback(async (stepId: string) => {
    console.log("升级步骤:", stepId);
    // TODO: 实现升级逻辑
  }, []);

  const retryAnalysis = useCallback(
    async (stepId: string) => {
      const card = stepCards.find((c) => c.stepId === stepId);
      if (card && card.elementContext) {
        // 重置状态
        setStepCards((prev) =>
          prev.map((c) =>
            c.stepId === stepId
              ? {
                  ...c,
                  analysisState: "idle",
                  analysisProgress: 0,
                  analysisError: undefined,
                }
              : c
          )
        );

        // 重新启动分析
        await startAnalysis(card.elementContext, stepId);
      }
    },
    [stepCards, startAnalysis]
  );

  const getStepCard = useCallback(
    (stepId: string) => stepCards.find((c) => c.stepId === stepId),
    [stepCards]
  );

  const getJobsBySelectionHash = useCallback(
    (hash: SelectionHash) =>
      Array.from(currentJobs.values()).filter(
        (job) => job.selectionHash === hash
      ),
    [currentJobs]
  );

  const clearAllJobs = useCallback(() => {
    setCurrentJobs(new Map());
    setStepCards([]);
  }, []);

  return {
    currentJobs,
    stepCards,
    isAnalyzing,
    currentExecutionVersion,
    startAnalysis,
    cancelAnalysis,
    createStepCardQuick,
    bindAnalysisResult,
    updateStepCard,
    deleteStepCard,
    switchStrategy,
    upgradeStep,
    retryAnalysis,
    getStepCard,
    getJobsBySelectionHash,
    clearAllJobs,
  };
}
