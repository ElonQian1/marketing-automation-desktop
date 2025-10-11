// src/theme/ThemeProvider.tsx
// module: shared | layer: ui | role: 主题系统
// summary: 应用主题配置和切换逻辑

import React from 'react';
import { ConfigProvider, theme as antdTheme, App } from 'antd';
import { ThemeMode, antdTokens, cssVars } from './tokens';
import { TokenBridge } from './TokenBridge';

export interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
}

const ThemeContext = React.createContext<ThemeContextValue>({ mode: 'dark', setMode: () => {} });

export const useTheme = () => React.useContext(ThemeContext);

export const AppThemeProvider: React.FC<{ children: React.ReactNode; defaultMode?: ThemeMode }>=({ children, defaultMode = 'dark' }) =>{
  const [mode, setMode] = React.useState<ThemeMode>(() => (localStorage.getItem('app.theme') as ThemeMode) || defaultMode);

  React.useEffect(() => {
    localStorage.setItem('app.theme', mode);
    const root = document.documentElement;
    // 同步 AntD 原生主题优先的暗黑模式：设置 data-theme 属性，兼容设计系统 [data-theme="*"] 选择器
    root.setAttribute('data-theme', mode);
    // 兼容历史：保留 class，避免旧样式依赖失效
    root.classList.remove('theme-dark', 'theme-light');
    root.classList.add(mode === 'dark' ? 'theme-dark' : 'theme-light');
    // 写入 CSS 变量
    const vars = cssVars[mode];
    Object.entries(vars).forEach(([k, v]) => { root.style.setProperty(k, v); });
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, setMode }}>
      <ConfigProvider
        theme={{
          algorithm: mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          // 让 AntD 负责配色，仅保留极少形状参数
          token: {
            borderRadius: 12,
            borderRadiusLG: 16,
          } as any,
          components: {
            Button: { controlHeight: 36, borderRadius: 10, fontWeight: 500 },
          },
        }}
      >
        <App>
          <TokenBridge />
          {children}
        </App>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}
