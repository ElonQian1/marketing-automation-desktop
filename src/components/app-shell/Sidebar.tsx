import React from 'react';

export interface SidebarItem {
  key: string;
  icon?: React.ReactNode;
  label: React.ReactNode;
}

export interface SidebarProps {
  brand?: React.ReactNode;
  items: SidebarItem[];
  activeKey: string;
  onChange: (key: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ brand, items, activeKey, onChange }) => {
  return (
    <>
      <div className="modern-sidebar-header">{brand}</div>
      <nav className="modern-nav">
        {items.map(item => (
          <button
            key={item.key}
            className={`modern-nav-item ${activeKey === item.key ? 'active' : ''}`}
            onClick={() => onChange(item.key)}
          >
            {item.icon && <span className="modern-nav-icon">{item.icon}</span>}
            <span className="modern-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
};

export default Sidebar;
