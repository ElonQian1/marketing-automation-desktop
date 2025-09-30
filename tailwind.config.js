/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 与设计令牌系统对齐的颜色
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe', 
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        device: {
          online: '#10b981',
          connecting: '#f59e0b',
          offline: '#6b7280',
          error: '#ef4444',
        },
        background: {
          canvas: '#fafafa',
          surface: '#ffffff',
          elevated: '#ffffff',
        },
        text: {
          primary: '#111827',
          secondary: '#374151',
          tertiary: '#6b7280',
          disabled: '#9ca3af',
        },
        border: {
          subtle: '#f3f4f6',
          default: '#e5e7eb',
          strong: '#d1d5db',
          focus: '#3b82f6',
        }
      },
      // 与设计令牌对齐的间距
      spacing: {
        '1': '2px',
        '2': '4px',
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      // 与设计令牌对齐的圆角
      borderRadius: {
        'sm': '4px',
        'md': '8px', 
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
      },
      // 与设计令牌对齐的阴影
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      // 字体大小
      fontSize: {
        'xs': '12px',
        'sm': '14px',
        'base': '16px',
        'lg': '18px',
        'xl': '20px',
        '2xl': '24px',
      },
      // 动画时长
      transitionDuration: {
        'fast': '150ms',
        'normal': '300ms',
        'slow': '500ms',
      },
      // 缓动函数
      transitionTimingFunction: {
        'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
        'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
        'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      }
    },
  },
  plugins: [],
}
