// src/components/ui/PhoneFrame.tsx
// module: ui | layer: components | role: phone-frame
// summary: 模拟手机外观的容器组件，用于展示应用启动器或屏幕预览

import React from 'react';

interface PhoneFrameProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  scale?: number;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({ 
  children, 
  className = '', 
  style = {},
  scale = 1
}) => {
  return (
    <div 
      className={`phone-frame-container ${className}`}
      style={{
        position: 'relative',
        width: '360px',
        height: '720px', // 18:9 aspect ratio roughly
        backgroundColor: '#000',
        borderRadius: '30px',
        padding: '12px', // Bezel width
        boxShadow: '0 0 0 2px #333, 0 20px 40px -10px rgba(0,0,0,0.5)',
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        margin: '0 auto',
        ...style
      }}
    >
      {/* Notch / Camera area */}
      <div 
        style={{
          position: 'absolute',
          top: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '120px',
          height: '24px',
          backgroundColor: '#000',
          borderBottomLeftRadius: '12px',
          borderBottomRightRadius: '12px',
          zIndex: 100,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        {/* Speaker grill */}
        <div style={{ width: '40px', height: '4px', backgroundColor: '#333', borderRadius: '2px' }} />
      </div>

      {/* Screen Content Area */}
      <div 
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#fff', // Default screen bg
          borderRadius: '20px',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Status Bar Placeholder */}
        <div style={{ 
          height: '24px', 
          width: '100%', 
          backgroundColor: 'rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0 16px',
          alignItems: 'center',
          fontSize: '10px',
          color: '#333',
          zIndex: 90
        }}>
          <span>12:00</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <span>5G</span>
            <span>100%</span>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {children}
        </div>

        {/* Bottom Navigation Bar Placeholder */}
        <div style={{
          height: '20px',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'transparent',
          position: 'absolute',
          bottom: '4px',
          left: 0,
          zIndex: 90
        }}>
          <div style={{ width: '100px', height: '4px', backgroundColor: '#ccc', borderRadius: '2px' }} />
        </div>
      </div>

      {/* Side Buttons (Volume/Power) */}
      <div style={{
        position: 'absolute',
        right: '-2px',
        top: '100px',
        width: '2px',
        height: '40px',
        backgroundColor: '#333',
        borderTopRightRadius: '2px',
        borderBottomRightRadius: '2px'
      }} />
      <div style={{
        position: 'absolute',
        right: '-2px',
        top: '150px',
        width: '2px',
        height: '60px',
        backgroundColor: '#333',
        borderTopRightRadius: '2px',
        borderBottomRightRadius: '2px'
      }} />
    </div>
  );
};
