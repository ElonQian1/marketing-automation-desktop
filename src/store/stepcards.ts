// src/store/stepcards.ts
// module: store | layer: store | role: 步骤卡片状态管理
// summary: 统一的步骤卡片状态管理，支持jobId精确路由和置信度展示

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  ConfidenceEvidence,
  SingleStepScore,
  StepCardMeta,
} from "../modules/universal-ui/types/intelligent-analysis-types";
import type { ActionType } from "../types/action-types";
import { DEFAULT_ACTION } from "../types/action-types";

export type StepCardStatus =
  | "draft"
  | "analyzing"
  | "ready"
  | "failed"
  | "blocked"
  | "completed"
  | "done";

// 🛡️ 终态集合：进入这些状态后，禁止被回写成 analyzing
const FINAL_STATES = new Set<StepCardStatus>([
  "ready",
  "completed",
  "done",
  "failed",
]);

export interface StepCard {
  id: string;
  jobId?: string;
  elementUid: string;
  elementContext?: {
    xpath?: string;
    text?: string;
    bounds?: string;
    resourceId?: string;
    className?: string;
  };
  /** 🔥 原始UIElement - 用于策略配置（如结构匹配需要children字段） */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  original_element?: any; // 使用any避免循环依赖
  
  /** 📄 XML快照信息 - 支持参数推导 */
  xmlSnapshot?: {
    xmlCacheId?: string;           // XML缓存ID
    xmlContent?: string;           // 直接内嵌的XML内容
    xmlHash?: string;              // XML内容哈希
    screenshotPath?: string;       // 配套截图路径
  };
  
  /** 🎯 静态定位信息 - 用于同一份XML的精确定位 */
  staticLocator?: {
    indexPath: number[];           // 绝对下标链 [0,0,0,5,2]
    xmlHash: string;               // 绑定的XML哈希（校验用）
  };
  
  /** 🔍 节点指纹 - 用于调试和校验 */
  elementFingerprint?: {
    class?: string;
    resourceId?: string;
    text?: string;
    contentDesc?: string;
    bounds?: string;
    clickable?: boolean;
    childrenTexts?: string[];      // 子元素文本列表
  };
  
  /** 🏗️ 结构匹配参数计划 - 推导生成的完整匹配参数 */
  structuralMatchPlan?: {
    version: string;               // 计划版本
    snapshotHash: string;          // XML快照哈希
    generatedAt: string;           // 推导生成时间
    sourceXPath: string;           // 原始静态XPath
    
    selectedAnchor: {
      ancestorChain: Array<{
        className: string;
        role: string;
        depth: number;
        signature: string;
      }>;
      clickableParentSig: string;
      selfSignature: string;
    };
    
    containerGate: {
      containerXPath: string;
      fallbackMode: "nearest_scrollable" | "business_pane";
      gateMode: "pre" | "post";
    };
    
    fieldMask: {
      text: "use" | "ignore-numeric" | "pattern-match";
      contentDesc: "use" | "ignore-numeric" | "pattern-match"; 
      resourceId: "use" | "soft";
      bounds: "geom-iou" | "ignore";
      booleanFields: "exact" | "soft";
    };
    
    layoutGate: {
      normalizedCenter: [number, number];
      normalizedSize: [number, number];
      maxShift: number;
    };
    
    scoring: {
      weightsProfile: "Speed" | "Default" | "Robust";
      minConfidence: number;
      topGap: number;
      earlyStop: boolean;
    };
  };
  
  /** 🎯 运行时推导状态 */
  inferenceState?: {
    status: "not_needed" | "pending" | "completed" | "failed";
    lastInferredAt?: string;
    inferenceVersion?: string;
    error?: string;
  };
  status: StepCardStatus;
  strategy?: {
    primary: string;
    backups: string[];
    score: number;
    candidates?: Array<{
      key: string;
      name: string;
      confidence: number;
      xpath: string;
      description?: string;
    }>;
  };
  progress?: number;
  error?: string;
  /** 整体置信度 (0-1) */
  confidence?: number;
  /** 置信度证据分项 */
  evidence?: ConfidenceEvidence;
  /** 扩展元数据 */
  meta?: StepCardMeta;
  /** 操作类型配置 */
  actionType?: ActionType;
  /** 推荐的操作类型 */
  recommendedAction?: ActionType;
  createdAt: number;
  updatedAt: number;
}

export interface StepCardStore {
  cards: Record<string, StepCard>;
  byStepId: Record<string, string>; // stepId -> cardId 映射
  byJobId: Record<string, string>; // jobId -> cardId 映射
  aliasToCanonical: Record<string, string>; // 任意别名 -> canonical cardId

  // 创建操作
  create: (data: {
    elementUid: string;
    elementContext?: StepCard["elementContext"];
    status?: StepCardStatus;
    jobId?: string;
  }) => string;
  createCard: (
    stepId: string,
    cardId: string,
    data?: Partial<StepCard>
  ) => void;

  // 查找操作
  findByJob: (jobId: string) => string | undefined;
  findByElement: (elementUid: string) => string | undefined;
  getCard: (cardId: string) => StepCard | undefined;
  getAllCards: () => StepCard[];
  has: (cardId: string) => boolean;

  // 更新操作
  attachJob: (cardId: string, jobId: string) => void;
  bindJob: (cardAnyId: string, jobId: string) => void; // 新增：支持别名绑定
  updateStatus: (cardId: string, status: StepCardStatus) => void;
  updateCard: (cardAnyId: string, patch: Partial<StepCard>) => void; // 新增：通用更新
  updateProgress: (cardId: string, progress: number) => void;
  fillStrategyAndReady: (
    cardId: string,
    strategy: StepCard["strategy"]
  ) => void;
  fillStrategy: (
    cardAnyId: string,
    strategy: StepCard["strategy"],
    confidence?: number
  ) => void;
  setError: (cardId: string, error: string) => void;

  // 置信度管理
  setConfidence: (
    cardId: string,
    confidence: number,
    evidence?: ConfidenceEvidence
  ) => void;
  setSingleStepConfidence: (cardId: string, score: SingleStepScore) => void;
  getStepIdByCard: (cardId: string) => string | undefined;

  // 操作类型管理
  updateActionType: (cardId: string, action: ActionType) => void;
  setRecommendedAction: (cardId: string, action: ActionType) => void;
  getActionType: (cardId: string) => ActionType | undefined;

  // 删除操作
  remove: (cardId: string) => void;
  clear: () => void;

  // 清理操作
  cleanupAliases: (canonicalId: string) => void;
}

function generateId(): string {
  return `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ID规范化和别名管理
const short = (id?: string) => (id && id.length > 12 ? id.slice(-9) : id || "");

const resolveCardId = (
  state: {
    cards: Record<string, StepCard>;
    aliasToCanonical: Record<string, string>;
  },
  anyId?: string
): string | undefined => {
  if (!anyId) return undefined;
  if (state.cards[anyId]) return anyId;
  return state.aliasToCanonical[anyId] || state.aliasToCanonical[short(anyId)];
};

const registerAliases = (
  state: { aliasToCanonical: Record<string, string> },
  canonical: string,
  ...aliases: (string | undefined)[]
) => {
  [canonical, ...aliases].forEach((alias) => {
    if (!alias) return;
    state.aliasToCanonical[alias] = canonical;
    state.aliasToCanonical[short(alias)] = canonical;
  });
};

export const useStepCardStore = create<StepCardStore>()(
  immer((set, get) => ({
    cards: {},
    byStepId: {},
    byJobId: {},
    aliasToCanonical: {},

    create: (data) => {
      const cardId = generateId();
      const now = Date.now();

      set((state) => {
        state.cards[cardId] = {
          id: cardId,
          elementUid: data.elementUid,
          elementContext: data.elementContext,
          status: data.status ?? "draft",
          jobId: data.jobId,
          createdAt: now,
          updatedAt: now,
        };

        // 🔑 关键：写入stepId映射
        state.byStepId[data.elementUid] = cardId;

        // 🏷️ 注册别名（含短尾）
        registerAliases(state, cardId);

        // 如果有jobId，立即绑定
        if (data.jobId) {
          state.byJobId[data.jobId] = cardId;
          state.byJobId[short(data.jobId)] = cardId;
        }
      });

      console.log("📝 [StepCardStore] 创建步骤卡片", {
        cardId,
        stepId: data.elementUid,
        data,
      });
      return cardId;
    },

    createCard: (stepId, cardId, data = {}) => {
      const now = Date.now();

      set((state) => {
        state.cards[cardId] = {
          id: cardId,
          elementUid: stepId,
          status: "analyzing",
          createdAt: now,
          updatedAt: now,
          ...data,
        } as StepCard;

        // 🔑 关键：写入stepId映射
        state.byStepId[stepId] = cardId;

        // 🏷️ 注册别名（含短尾）
        registerAliases(state, cardId);
      });

      console.log("📝 [StepCardStore] 创建步骤卡片（新方式）", {
        stepId,
        cardId,
        data,
      });
    },

    findByJob: (jobId) => {
      const state = get();
      // 🔍 优先从映射表查找（支持长短ID）
      return state.byJobId[jobId] || state.byJobId[short(jobId)];
    },

    findByElement: (elementUid) => {
      const cards = get().cards;
      return Object.values(cards).find((c) => c.elementUid === elementUid)?.id;
    },

    getCard: (cardId) => {
      return get().cards[cardId];
    },

    getAllCards: () => {
      return Object.values(get().cards).sort(
        (a, b) => a.createdAt - b.createdAt
      );
    },

    has: (cardId: string) => {
      return cardId in get().cards;
    },

    attachJob: (cardId, jobId) => {
      set((state) => {
        const card = state.cards[cardId];
        if (card) {
          card.jobId = jobId;
          card.updatedAt = Date.now();
          console.log("🔗 [StepCardStore] 绑定Job", { cardId, jobId });
        }
      });
    },

    bindJob: (cardAnyId, jobId) => {
      set((state) => {
        const canonicalId = resolveCardId(state, cardAnyId) || cardAnyId;
        registerAliases(state, canonicalId, cardAnyId);
        state.byJobId[jobId] = canonicalId;
        state.byJobId[short(jobId)] = canonicalId;

        // 同时更新卡片的jobId字段
        const card = state.cards[canonicalId];
        if (card) {
          card.jobId = jobId;
          card.updatedAt = Date.now();
        }

        // console.log('🔗 [StepCardStore] 绑定Job（支持别名）', { cardAnyId, canonicalId, jobId });
      });
    },

    updateStatus: (cardAnyId, status) => {
      set((state) => {
        const canonicalId = resolveCardId(state, cardAnyId);
        if (!canonicalId) return;

        const card = state.cards[canonicalId];
        if (!card) return;

        // 🛡️ 保护：终态后不允许退回 analyzing
        if (FINAL_STATES.has(card.status) && status === "analyzing") {
          console.debug("🛡️ [StepCardStore] 忽略终态回写 analyzing", {
            cardId: canonicalId.slice(-8),
            currentStatus: card.status,
            attemptedStatus: status,
          });
          return;
        }

        card.status = status;
        card.updatedAt = Date.now();
        // console.log('🔄 [StepCardStore] 更新状态', { cardId: canonicalId.slice(-8), status });
      });
    },

    updateProgress: (cardAnyId, progress) => {
      set((state) => {
        const canonicalId = resolveCardId(state, cardAnyId);
        if (!canonicalId) return;

        const card = state.cards[canonicalId];
        if (card) {
          card.progress = progress;
          card.updatedAt = Date.now();

          // 🔧 修复：当进度达到100%时，自动将状态从analyzing改为ready
          if (progress >= 100 && card.status === "analyzing") {
            card.status = "ready";
            console.log("✅ [StepCardStore] 分析完成，状态自动切换为ready", {
              cardId: canonicalId.slice(-8),
              progress,
            });
          }
        }
      });
    },

    updateCard: (cardAnyId, patch) => {
      set((state) => {
        const canonicalId = resolveCardId(state, cardAnyId);
        if (!canonicalId) return;

        const card = state.cards[canonicalId];
        if (card) {
          Object.assign(card, patch);
          card.updatedAt = Date.now();
          console.log("🔄 [StepCardStore] 更新卡片", {
            cardId: canonicalId.slice(-8),
            patch,
          });
        }
      });
    },

    fillStrategyAndReady: (cardAnyId, strategy) => {
      set((state) => {
        const canonicalId = resolveCardId(state, cardAnyId);
        if (!canonicalId) return;

        const card = state.cards[canonicalId];
        if (card) {
          card.strategy = strategy;
          card.status = "ready"; // ← 关键：状态切换
          card.progress = 100;
          card.updatedAt = Date.now();
          console.log("✅ [StepCardStore] 填充策略并就绪", {
            cardId: canonicalId,
            strategy,
          });
        }
      });
    },

    fillStrategy: (cardAnyId, strategy, confidence) => {
      set((state) => {
        const canonicalId = resolveCardId(state, cardAnyId);
        if (!canonicalId) return;

        const card = state.cards[canonicalId];
        if (card) {
          card.strategy = strategy;
          card.confidence =
            typeof confidence === "number" ? confidence : card.confidence;
          card.status = "ready";
          card.updatedAt = Date.now();
          console.log("✅ [StepCardStore] 填充策略", {
            cardId: canonicalId,
            strategy,
            confidence,
          });
        }
      });
    },

    setError: (cardAnyId, error) => {
      set((state) => {
        const canonicalId = resolveCardId(state, cardAnyId);
        if (!canonicalId) return;

        const card = state.cards[canonicalId];
        if (card) {
          card.error = error;
          card.status = "failed";
          card.updatedAt = Date.now();
          console.log("❌ [StepCardStore] 设置错误", {
            cardId: canonicalId,
            error,
          });
        }
      });
    },

    setConfidence: (cardAnyId, confidence, evidence) => {
      set((state) => {
        const canonicalId = resolveCardId(state, cardAnyId);
        if (!canonicalId) return;

        const card = state.cards[canonicalId];
        if (card) {
          card.confidence = confidence;
          card.evidence = evidence;
          card.updatedAt = Date.now();
          console.log("📊 [StepCardStore] 设置置信度", {
            cardId: canonicalId,
            confidence,
            evidence,
          });
        }
      });
    },

    setSingleStepConfidence: (cardAnyId, score) => {
      set((state) => {
        const canonicalId = resolveCardId(state, cardAnyId);
        if (!canonicalId) return;

        const card = state.cards[canonicalId];
        if (!card) return;

        // 🔧 关键修复：同时设置 meta 和 confidence 字段
        card.meta = { ...(card.meta ?? {}), singleStepScore: score };
        card.confidence = score.confidence; // ✅ 直接设置到卡片的 confidence 字段
        card.evidence = score.evidence; // ✅ 设置证据数据

        // 🛡️ 写入置信度即认为"可渲染"→ 至少 ready，但不覆盖已有终态
        const status = FINAL_STATES.has(card.status) ? card.status : "ready";
        card.status = status;
        card.updatedAt = Date.now();
        console.log("🎯 [StepCardStore] 设置单步置信度", {
          cardId: canonicalId.slice(-8),
          confidence: score.confidence,
          confidencePercent: `${Math.round(score.confidence * 100)}%`,
          source: score.source,
          finalStatus: status,
          hasEvidence: !!score.evidence,
          cardConfidenceSet: "✅ card.confidence 已设置",
        });
      });
    },

    getStepIdByCard: (cardId) => {
      const card = get().cards[cardId];
      return card?.elementUid; // 使用 elementUid 作为 stepId
    },

    remove: (cardId) => {
      set((state) => {
        delete state.cards[cardId];
        console.log("🗑️ [StepCardStore] 删除卡片", { cardId });
      });
    },

    clear: () => {
      set((state) => {
        state.cards = {};
        state.byStepId = {};
        state.byJobId = {};
        state.aliasToCanonical = {};
        console.log("🧹 [StepCardStore] 清空所有卡片和映射");
      });
    },

    cleanupAliases: (canonicalId) => {
      set((state) => {
        const shortId = short(canonicalId);
        if (state.cards[shortId] && shortId !== canonicalId) {
          // 合并数据到canonical卡片
          state.cards[canonicalId] = {
            ...state.cards[shortId],
            ...state.cards[canonicalId],
          };
          delete state.cards[shortId];
          state.aliasToCanonical[shortId] = canonicalId;
          console.log("🧹 [StepCardStore] 清理短ID幽灵卡片", {
            shortId,
            canonicalId,
          });
        }
      });
    },

    // 操作类型管理方法
    updateActionType: (cardId, action) => {
      set((state) => {
        const canonicalId = resolveCardId(state, cardId);
        if (!canonicalId) return;

        const card = state.cards[canonicalId];
        if (card) {
          card.actionType = action;
          card.updatedAt = Date.now();
          console.log("🎯 [StepCardStore] 更新操作类型", {
            cardId: canonicalId.slice(-8),
            actionType: action.type,
            params: action.params,
          });
        }
      });
    },

    setRecommendedAction: (cardId, action) => {
      set((state) => {
        const canonicalId = resolveCardId(state, cardId);
        if (!canonicalId) return;

        const card = state.cards[canonicalId];
        if (card) {
          card.recommendedAction = action;
          // 如果没有设置过操作类型，使用推荐的
          if (!card.actionType) {
            card.actionType = action;
          }
          card.updatedAt = Date.now();
          console.log("💡 [StepCardStore] 设置推荐操作", {
            cardId: canonicalId.slice(-8),
            recommendedAction: action.type,
            applied: !card.actionType,
          });
        }
      });
    },

    getActionType: (cardId) => {
      const card = get().cards[cardId];
      return card?.actionType || DEFAULT_ACTION;
    },
  }))
);
