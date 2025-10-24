// src/stores/authStore.ts
// module: shared | layer: application | role: 状态管理
// summary: 认证状态管理 Store

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  username: string;
  email?: string;
  role: 'admin' | 'user' | 'trial';
  createdAt: string;
  expiresAt?: string; // 试用期到期时间
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isTrialExpired: boolean;
  
  // Actions
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkTrialExpiry: () => boolean;
  getTrialDaysRemaining: () => number;
  setUser: (user: User, token: string) => void;
}

// 测试账户配置
const TEST_ACCOUNTS = [
  {
    username: 'admin',
    password: 'admin123',
    role: 'admin' as const,
    email: 'admin@example.com'
  },
  {
    username: 'test',
    password: 'test123',
    role: 'trial' as const,
    email: 'test@example.com'
  }
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false, // 每次启动应用时都需要重新登录
      isTrialExpired: false,

      login: async (username: string, password: string) => {
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 500));

        // 查找匹配的账户
        const account = TEST_ACCOUNTS.find(
          acc => acc.username === username && acc.password === password
        );

        if (!account) {
          return {
            success: false,
            error: '用户名或密码错误'
          };
        }

        // 生成用户信息
        const now = new Date();
        const createdAt = now.toISOString();
        
        // 试用账户：15天到期
        const expiresAt = account.role === 'trial' 
          ? new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString()
          : undefined;

        const user: User = {
          id: Math.random().toString(36).substr(2, 9),
          username: account.username,
          email: account.email,
          role: account.role,
          createdAt,
          expiresAt
        };

        // 生成简单的 token
        const token = btoa(`${username}:${Date.now()}`);

        set({
          user,
          token,
          isAuthenticated: true,
          isTrialExpired: false
        });

        return { success: true };
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isTrialExpired: false
        });
      },

      checkTrialExpiry: () => {
        const { user } = get();
        
        if (!user || user.role !== 'trial' || !user.expiresAt) {
          return false;
        }

        const now = new Date();
        const expiryDate = new Date(user.expiresAt);
        const isExpired = now > expiryDate;

        if (isExpired) {
          set({ isTrialExpired: true });
        }

        return isExpired;
      },

      getTrialDaysRemaining: () => {
        const { user } = get();
        
        if (!user || user.role !== 'trial' || !user.expiresAt) {
          return -1; // 不是试用账户
        }

        const now = new Date();
        const expiryDate = new Date(user.expiresAt);
        const diffTime = expiryDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays > 0 ? diffDays : 0;
      },

      setUser: (user: User, token: string) => {
        set({
          user,
          token,
          isAuthenticated: true,
          isTrialExpired: false
        });
      }
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        // 🔒 不保存 isAuthenticated，每次启动都需要重新登录
        // isAuthenticated: state.isAuthenticated,
        isTrialExpired: state.isTrialExpired
      }),
      // 🔧 自定义恢复逻辑：始终设置为未认证状态
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isAuthenticated = false; // 强制未认证，必须重新登录
        }
      }
    }
  )
);
