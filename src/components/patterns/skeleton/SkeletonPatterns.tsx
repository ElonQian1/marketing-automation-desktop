import React from "react";
import { Skeleton } from "antd";

export interface SkeletonBlockProps {
  lines?: number;
  width?: number | string;
  height?: number | string;
  active?: boolean;
  className?: string;
}

export const SkeletonBlock: React.FC<SkeletonBlockProps> = ({ lines = 3, width = "100%", height, active = true, className }) => (
  <div className={className} style={{ width }}>
    <Skeleton active={active} paragraph={{ rows: Math.max(0, lines - 1) }} title={{ width: typeof width === 'number' ? width : undefined }} style={{ height }} />
  </div>
);

export interface SkeletonCardProps {
  image?: boolean;
  lines?: number;
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ image = true, lines = 2, className }) => (
  <div className={className}>
    {image && <Skeleton.Image active style={{ width: "100%", height: 160, marginBottom: 12 }} />}
    <Skeleton active paragraph={{ rows: lines }} title={{ width: "60%" }} />
  </div>
);

export interface SkeletonListProps {
  items?: number;
  className?: string;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({ items = 5, className }) => (
  <div className={className}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} style={{ marginBottom: 12 }}>
        <Skeleton active title paragraph={{ rows: 1 }} />
      </div>
    ))}
  </div>
);

export default SkeletonBlock;
