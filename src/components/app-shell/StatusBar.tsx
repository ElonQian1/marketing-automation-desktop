import React from 'react';

export interface StatusBarProps {
  left?: React.ReactNode;
  right?: React.ReactNode;
}

export const StatusBar: React.FC<StatusBarProps> = ({ left, right }) => {
  return (
    <div className="modern-content-footer">
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
};

export default StatusBar;
