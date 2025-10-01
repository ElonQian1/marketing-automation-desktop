// 文件路径：src/theme/ThemeBridge.tsx

/**
 * ThemeBridge - AntD 主题桥接组件
 *
 * 职责：
 * 1. 将设计令牌系统与 Ant Design v5 主题系统对接
 * 2. 统一 dark/compact 算法，避免覆盖 .ant-* 样式
 * 3. 提供上下文 Hook 以便全局切换主题与密度
 */

import React from 'react';
import { App as AntdApp, ConfigProvider, theme } from 'antd';

type ThemeMode = 'light' | 'dark';
type DensityMode = 'default' | 'compact';

interface ThemeBridgeProps {
  children: React.ReactNode;
  /** 初始是否为暗色模式，默认为 true */
  isDark?: boolean;
  /** 初始是否为紧凑模式，默认为 false */
  isCompact?: boolean;
}

interface ThemeBridgeContextValue {
  mode: ThemeMode;
  density: DensityMode;
  isDark: boolean;
  isCompact: boolean;
  setMode: React.Dispatch<React.SetStateAction<ThemeMode>>;
  setDensity: React.Dispatch<React.SetStateAction<DensityMode>>;
  toggleTheme: () => void;
  toggleDensity: () => void;
}

const ThemeBridgeContext = React.createContext<ThemeBridgeContextValue | undefined>(undefined);

const safeDocument = () => typeof document !== 'undefined';

const setRootAttribute = (name: string, value: string) => {
  if (safeDocument()) {
    document.documentElement.setAttribute(name, value);
  }
};

const toggleRootClass = (className: string, enabled: boolean) => {
  if (safeDocument()) {
    document.documentElement.classList.toggle(className, enabled);
  }
};

const getCSSVar = (varName: string): string => {
  if (!safeDocument() || typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
};

const getVarNumberPx = (varName: string, fallback: number): number => {
  if (!safeDocument() || typeof window === 'undefined') return fallback;
  const raw = getCSSVar(varName);
  if (!raw) return fallback;

  if (/^\d+(?:\.\d+)?$/.test(raw)) return Number(raw);

  if (raw.endsWith('px')) {
    const n = Number.parseFloat(raw.replace('px', ''));
    return Number.isFinite(n) ? n : fallback;
  }

  if (raw.endsWith('rem')) {
    const rem = Number.parseFloat(raw.replace('rem', ''));
    if (!Number.isFinite(rem)) return fallback;
    const rootFontSizeRaw = safeDocument()
      ? getComputedStyle(document.documentElement).fontSize
      : '16px';
    const rootFontSize = Number.parseFloat(rootFontSizeRaw || '16px');
    return Number.isFinite(rootFontSize) ? rem * rootFontSize : fallback;
  }

  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
};

// 使用本地别名避免与 antd 的 ThemeConfig 冲突
type AntdThemeConfig = Parameters<typeof ConfigProvider>[0]['theme'];
const createThemeConfig = (mode: ThemeMode, density: DensityMode): AntdThemeConfig => {
  const algorithms: Array<typeof theme.darkAlgorithm> = [];
  if (mode === 'dark') algorithms.push(theme.darkAlgorithm);
  if (density === 'compact') algorithms.push(theme.compactAlgorithm);

  const token = {
    colorPrimary: getCSSVar('--brand') || '#6E8BFF',
    colorSuccess: getCSSVar('--success') || '#10B981',
    colorWarning: getCSSVar('--warning') || '#F59E0B',
    colorError: getCSSVar('--error') || '#EF4444',
    colorInfo: getCSSVar('--info') || '#3B82F6',
    borderRadius: getVarNumberPx('--radius', 12),
    fontFamily:
      getCSSVar('--font-family') ||
      '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif',
    fontSize: getVarNumberPx('--font', 16),
    controlHeight: getVarNumberPx('--control-h', 40),
    controlHeightSM: getVarNumberPx('--control-h-sm', 32),
    controlHeightLG: getVarNumberPx('--control-h-lg', 48),
    padding: getVarNumberPx('--space-4', 16),
    paddingSM: getVarNumberPx('--space-3', 12),
    paddingLG: getVarNumberPx('--space-6', 24),
    margin: getVarNumberPx('--space-4', 16),
    marginSM: getVarNumberPx('--space-3', 12),
    marginLG: getVarNumberPx('--space-6', 24),
    motionDurationSlow: getCSSVar('--duration-slow') || '0.22s',
    motionDurationMid: getCSSVar('--duration-normal') || '0.18s',
    motionDurationFast: getCSSVar('--duration-fast') || '0.12s',
    boxShadow: getCSSVar('--shadow') || '0 4px 20px rgba(0, 0, 0, 0.15)',
    boxShadowSecondary: getCSSVar('--shadow-sm') || '0 2px 8px rgba(0, 0, 0, 0.10)',
  } as AntdThemeConfig['token'];

  const components: AntdThemeConfig['components'] = {
    Button: {
      borderRadius: getVarNumberPx('--radius', 12),
    },
    Card: {
      borderRadiusLG: getVarNumberPx('--radius-lg', 16),
      paddingLG: getVarNumberPx('--space-6', 24),
    },
    Input: {
      borderRadius: getVarNumberPx('--radius', 12),
    },
    Table: {
      borderRadiusLG: getVarNumberPx('--radius-lg', 16),
      padding: getVarNumberPx('--space-4', 16),
      paddingSM: getVarNumberPx('--space-3', 12),
    },
    Modal: {
      borderRadiusLG: getVarNumberPx('--radius-lg', 16),
      paddingLG: getVarNumberPx('--space-6', 24),
    },
    Tag: {
      borderRadius: getVarNumberPx('--radius-sm', 8),
    },
    Menu: {
      borderRadius: getVarNumberPx('--radius', 12),
    },
  };

  const algorithmConfig: AntdThemeConfig['algorithm'] =
    algorithms.length === 0 ? undefined : algorithms.length === 1 ? algorithms[0] : algorithms;

  return {
    algorithm: algorithmConfig,
    token,
    components,
  };
};

export const ThemeBridge: React.FC<ThemeBridgeProps> = ({
  children,
  isDark = true,
  isCompact = false,
}) => {
  const [mode, setMode] = React.useState<ThemeMode>(isDark ? 'dark' : 'light');
  const [density, setDensity] = React.useState<DensityMode>(isCompact ? 'compact' : 'default');

  React.useEffect(() => {
    setMode(isDark ? 'dark' : 'light');
  }, [isDark]);

  React.useEffect(() => {
    setDensity(isCompact ? 'compact' : 'default');
  }, [isCompact]);

  React.useEffect(() => {
    setRootAttribute('data-theme', mode);
    toggleRootClass('dark', mode === 'dark');
  }, [mode]);

  React.useEffect(() => {
    setRootAttribute('data-density', density === 'compact' ? 'compact' : 'default');
  }, [density]);

  const themeConfig = React.useMemo(() => createThemeConfig(mode, density), [mode, density]);

  const contextValue = React.useMemo<ThemeBridgeContextValue>(() => ({
    mode,
    density,
    isDark: mode === 'dark',
    isCompact: density === 'compact',
    setMode,
    setDensity,
    toggleTheme: () => setMode((prev) => (prev === 'dark' ? 'light' : 'dark')),
    toggleDensity: () => setDensity((prev) => (prev === 'compact' ? 'default' : 'compact')),
  }), [mode, density]);

  return (
    <ThemeBridgeContext.Provider value={contextValue}>
      <ConfigProvider theme={themeConfig}>
        <AntdApp
          message={{ maxCount: 3 }}
          notification={{ placement: 'topRight' }}
        >
          {children}
        </AntdApp>
      </ConfigProvider>
    </ThemeBridgeContext.Provider>
  );
};

export const useThemeConfig = () => {
  const context = React.useContext(ThemeBridgeContext);
  if (!context) {
    throw new Error('useThemeConfig 必须在 ThemeBridge 组件内部使用');
  }
  return context;
};

// 为了兼容性，导出别名
export const useTheme = useThemeConfig;

// 导出配置类型
export type ThemeConfig = ThemeBridgeContextValue;

export const ThemeToggler: React.FC = () => {
  const { isDark, isCompact, toggleTheme, toggleDensity } = useThemeConfig();

  return (
    <div className="fixed top-4 right-4 z-modal flex gap-2">
      <button
        type="button"
        onClick={toggleTheme}
        className="rounded-lg bg-brand px-3 py-1 text-sm font-medium text-white transition-brand hover:opacity-90"
      >
        {isDark ? '🌞 浅色' : '🌙 深色'}
      </button>
      <button
        type="button"
        onClick={toggleDensity}
        className="rounded-lg bg-background-elevated px-3 py-1 text-sm font-medium text-text-primary transition-brand hover:bg-background-secondary"
      >
        {isCompact ? '📐 标准' : '🔥 紧凑'}
      </button>
    </div>
  );
};