import React, { useEffect, useState } from "react";
import { isTauri } from '@tauri-apps/api/core';
// 使用最小化样式，不覆盖Ant Design原生样式
import "./styles/native-minimal.css";

function App() {
  const [tauriReady, setTauriReady] = useState(false);
  const [FullApp, setFullApp] = useState<React.ComponentType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 检查 Tauri 环境
        try {
          const isInTauri = await isTauri();
          console.log('✅ Tauri environment detected:', isInTauri);
        } catch (error) {
          console.log('🌐 Running in browser environment');
        }
        setTauriReady(true);

        // 直接加载完整应用
        console.log('🔄 加载原生Ant Design应用程序...');
        const module = await import("./components/NativeAntDesignApp");
        console.log('✅ 原生应用程序加载成功');
        
        setFullApp(() => module.NativeAntDesignIntegration);
        setLoading(false);
      } catch (error) {
        console.error('❌ 应用程序加载失败:', error);
        setError(`加载失败: ${error.message || '未知错误'}`);
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        fontFamily: 'Arial, sans-serif'
      }}>
        🚀 正在启动 Employee GUI 应用程序...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        padding: '20px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h2 style={{ color: 'red', marginBottom: '16px' }}>❌ 应用启动失败</h2>
        <p style={{ marginBottom: '16px', textAlign: 'center' }}>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          重新加载
        </button>
      </div>
    );
  }

  if (FullApp) {
    return <FullApp />;
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '18px' 
    }}>
      初始化中...
    </div>
  );
}

export default App;
