import React from 'react';

export interface AppShellProps {
  sidebar?: React.ReactNode;
  headerTitle?: React.ReactNode;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * AppShell
 * 轻量应用外壳，提供标准布局骨架：侧边栏 + 顶部栏 + 内容区。
 * 样式完全依赖 modern.css 的 modern-* 类，不引入额外视觉逻辑。
 */
export const AppShell: React.FC<AppShellProps> = ({
  sidebar,
  headerTitle,
  headerActions,
  children,
  className,
}) => {
  return (
    <div className={["modern-app", className].filter(Boolean).join(' ')}>
      {sidebar && (
        <aside className="modern-sidebar">
          {sidebar}
        </aside>
      )}

      <main className="modern-main">
        {(headerTitle || headerActions) && (
          <header className="modern-header">
            <div className="modern-header-title">{headerTitle}</div>
            <div className="modern-header-actions">{headerActions}</div>
          </header>
        )}

        <div className="modern-content">
          <div className="modern-content-body">{children}</div>
        </div>
      </main>
    </div>
  );
};

export default AppShell;
