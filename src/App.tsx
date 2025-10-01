// 文件路径：src/App.tsx

import React, { useEffect, useState } from 'react';
import { isTauri } from '@tauri-apps/api/core';
import { ThemeBridge, ThemeToggler } from './theme/ThemeBridge';

function App() {
  const [FullApp, setFullApp] = useState<React.ComponentType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        try {
          const isInTauri = await isTauri();
          console.log('✅ Tauri environment detected:', isInTauri);
        } catch (detectError) {
          console.log('🌐 Running in browser environment', detectError);
        }

        const module = await import('./components/NativeAntDesignApp');
        setFullApp(() => module.NativeAntDesignIntegration);
        setLoading(false);
      } catch (loadError: unknown) {
        console.error('❌ 应用程序加载失败:', loadError);
        const message = loadError instanceof Error ? loadError.message : String(loadError);
        setError(`加载失败: ${message || '未知错误'}`);
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background-base text-text-primary">
        <span className="text-xl font-semibold">🚀 正在启动 Employee GUI 应用程序...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background-base px-6 text-text-primary">
        <h2 className="text-2xl font-semibold text-error">❌ 应用启动失败</h2>
        <p className="max-w-md text-center text-text-secondary">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white transition-brand hover:opacity-90"
        >
          重新加载
        </button>
      </div>
    );
  }

  if (!FullApp) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-base text-text-primary">
        初始化中...
      </div>
    );
  }

  return (
    <ThemeBridge>
      <div className="app-container">
        <FullApp />
        {process.env.NODE_ENV === 'development' && <ThemeToggler />}
      </div>
    </ThemeBridge>
  );
}

export default App;
